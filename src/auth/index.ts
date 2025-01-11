import { createResponse } from '../index';
import { sign, verify } from 'jsonwebtoken';
import { Env, newUserData, UserLoginData, UserData, UserChangePasswordData, codeData } from '../types';

// 密碼哈希化
async function hashPassword(password: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => ('00' + b.toString(16)).slice(-2)).join('');
}
// 生成 JWT
async function generateJWT(payload: any, secret: string): Promise<string> {
	return new Promise((resolve, reject) => {
		sign(payload, secret, { expiresIn: '2h' }, (err, token) => {
			if (err) reject(err);
			resolve(token!);
		});
	});
}
// 驗證 JWT
async function verifyJWT(token: string, secret: string): Promise<any> {
	return new Promise((resolve, reject) => {
		verify(token, secret, (err, decoded) => {
			if (err) reject(err);
			resolve(decoded);
		});
	});
}

// 一般用戶註冊
export async function userRegister(request: Request, env: Env) {
	const { DATABASE } = env;
	const { email, password, name, level, Class, grade }: newUserData = await request.json();

	try {
		const existingUser = await DATABASE.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
		if (existingUser) {
			return createResponse({ error: '此帳號已經存在' }, 409);
		}

		const userId = crypto.randomUUID();
		const hashedPassword = await hashPassword(password);

		await DATABASE.prepare(
			`
			INSERT INTO users (id, email, password, name, admin_access, user_level, user_class, user_grade)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`,
		)
			.bind(userId, email, hashedPassword, name, '0', level, Class, grade)
			.run();

		return createResponse({ message: 'User registered successfully' }, 201);
	} catch (error) {
		console.error('Error during registration:', error);
		return createResponse({ error: `Error: ${error.message}` }, 500);
	}
}
// 產生Staff授權碼
export async function createStaffCode(request: Request, env: Env) {
	const { DATABASE, KV, StaffKV } = env;

	// 驗證請求格式
	const sessionId = request.headers.get('Authorization');
	if (!sessionId?.startsWith('Bearer ')) {
		console.error('SessionId is missing or malformed');
		return createResponse({ error: 'SessionId is missing or malformed' }, 400);
	}

	// 驗證請求體
	let vuli: boolean;
	let level: string;
	try {
		const body: { vuli: boolean; level: string } = await request.json();
		vuli = body.vuli;
		level = body.level;
		if (typeof vuli !== 'boolean') {
			throw new Error('Invalid vl parameter');
		}
	} catch (error) {
		console.error('Invalid request body', error);
		return createResponse({ error: 'Invalid request body' }, 400);
	}

	const token = sessionId.slice(7);

	try {
		const sessionData = await KV.get(token, { type: 'json' });

		// sessionData 是否存在
		if (!sessionData) {
			console.error(`Invalid or expired token: ${token}`); // 添加日志
			return createResponse({ error: 'Invalid or expired token' }, 401);
		}

		const { userId } = sessionData as { userId: string };

		// 獲取用戶資訊
		const userData = await DATABASE.prepare(
			`
    SELECT user_level, email
    FROM users
    WHERE id = ?
  `,
		)
			.bind(userId)
			.first<{ user_level: string; email: string }>();

		if (!userData) {
			console.error('User not found');
			return createResponse({ error: 'User not found' }, 404);
		}
		const { user_level, email } = userData;

		if (user_level !== 'L04') {
			console.error('Unauthorized access attempt');
			return createResponse({ error: 'Unauthorized' }, 403);
		}

		// 創建邀請碼
		const code = Array.from(crypto.getRandomValues(new Uint8Array(6)))
			.map((n) => n % 10)
			.join('');
		const codeData = {
			createUserId: userId,
			createUserEmail: email,
			vuli: vuli,
			level: level,
			user_number: vuli ? 10 : 1,
			createdTime: new Date().toISOString(),
		};

		await StaffKV.put(code, JSON.stringify(codeData), {
			expirationTtl: 60 * 60 * 24,
		});

		return createResponse({ code: code }, 200);
	} catch (error) {
		console.error('Server error:', error);
		return createResponse({ error: 'Internal server error' }, 500);
	}
}
// 驗證授權碼
export async function verifyStaffCode(request: Request, env: Env) {
	const { StaffKV } = env;
	try {
		const body: { code: string } = await request.json();
		const code = body.code;
		const codeData = (await StaffKV.get(code, { type: 'json' })) as codeData | null;
		if (!codeData) {
			return createResponse({ error: 'Invalid code' }, 404);
		}
		return createResponse({ code: code }, 200);
	} catch (error) {
		console.error('Invalid request body', error);
		return createResponse({ error: 'Invalid request body' }, 400);
	}
}
export async function addNewStaff(request: Request, env: Env) {
	const { StaffKV, DATABASE } = env;

	try {
		const body = (await request.json()) as newUserData;
		const { code, email, name, password, Class, grade, role } = body;

		const existingUser = await DATABASE.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
		if (existingUser) {
			return createResponse({ error: '此帳號已經存在' }, 409);
		}

		// 驗證必要欄位
		if (!code) {
			return createResponse({ error: 'Code is required' }, 400);
		}

		// 檢查驗證碼
		const codeData = await StaffKV.get<codeData>(code, { type: 'json' });
		if (!codeData) {
			return createResponse({ error: 'Invalid code' }, 404);
		}

		const hashedPassword = await hashPassword(password);
		const userId = crypto.randomUUID();
		const auth_person = codeData.createUserEmail;

		await DATABASE.prepare(
			`
			INSERT INTO users (id, email, password, name, admin_access, user_level, user_class, user_grade, user_role, auth_person)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`,
		)
			.bind(userId, email, hashedPassword, name, '1', codeData.level, Class, grade, role, auth_person)
			.run();

		if (codeData.vuli && codeData.user_number !== 1) {
			const newCodeData = {
				...codeData,
				user_number: codeData.user_number - 1,
			};
			await StaffKV.put(code, JSON.stringify(newCodeData));
		} else {
			await StaffKV.delete(code);
		}
		return createResponse({ message: 'User registered successfully' }, 201);
	} catch (error) {
		console.error('Invalid request body', error);
		return createResponse({ error: 'Invalid request body' }, 400);
	}
}

// 用戶登錄
export async function userLogin(request: Request, env: Env) {
	const { DATABASE, KV } = env;
	const { email, password }: UserLoginData = await request.json();

	try {
		const user = await DATABASE.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
		if (!user) {
			return createResponse({ error: 'User not found' }, 404);
		}

		// 驗證密碼
		const hashedPassword = await hashPassword(password);
		if (hashedPassword !== user.password) {
			return createResponse({ error: 'Incorrect password' }, 401);
		}

		const sessionId = crypto.randomUUID();
		const loginTime = new Date(Date.now()).toISOString();
		const expirationTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
		const sessionData = JSON.stringify({
			userId: user.id,
			email: user.email,
			loginTime: loginTime,
			expirationTime: expirationTime,
		});
		await KV.put(sessionId, sessionData, { expirationTtl: 2 * 60 * 60 });
		return createResponse({ sessionId: sessionId }, 200);
	} catch (error: any) {
		console.error('Error during login:', error);
		return createResponse({ error: `Error: ${error.message}` }, 500);
	}
}

// 驗證用戶（如果成功將會回傳用戶資料）
export async function veritySession(request: Request, env: Env) {
	const sessionId = request.headers.get('Authorization');

	if (!sessionId || !sessionId.startsWith('Bearer ')) {
		console.error('SessionId is missing or malformed'); // 添加日志
		return createResponse({ error: 'SessionId is missing or malformed' }, 400);
	}

	const token = sessionId.slice(7); // 去掉 "Bearer " 前缀

	try {
		const sessionData = await env.KV.get(token, { type: 'json' });

		// sessionData 是否存在
		if (!sessionData) {
			console.error(`Invalid or expired token: ${token}`); // 添加日志
			return createResponse({ error: 'Invalid or expired token' }, 401);
		}

		const { userId } = sessionData as { userId: string }; // 确保 userId 存在

		// userId 是否有效
		if (!userId) {
			console.error('Malformed session data: missing userId'); // 添加日志
			return createResponse({ error: 'Malformed session data' }, 400);
		}

		return await fetchUserData(userId, env);
	} catch (error) {
		console.error('Error verifying session:', error); // 添加日志
		return createResponse({ error: 'Internal server error' }, 500); // 返回服务器错误
	}
}

// 用戶資料查詢
async function fetchUserData(userId: string, env: Env) {
	const { DATABASE } = env;
	try {
		const user: UserData | null = await DATABASE.prepare(
			'SELECT id, email, name, admin_access, user_level, user_class, user_grade, user_role FROM users WHERE id = ?',
		)
			.bind(userId)
			.first();
		if (!user) {
			return createResponse({ error: '找不到此用戶' }, 404);
		}
		return createResponse(user, 200);
	} catch (error: any) {
		console.error('Error fetching user data:', error);
		return createResponse({ error: `Error: ${error.message}` }, 500);
	}
}

// 修改密碼
export async function changePassword(request: Request, env: Env) {
	const { DATABASE } = env;
	const { oldPassword, newPassword }: UserChangePasswordData = await request.json();

	if (!oldPassword || !newPassword) {
		return createResponse({ error: '未輸入新密碼與舊密碼' }, 400);
	}

	const token = request.headers.get('Authorization')?.split(' ')[1];
	if (!token) {
		return createResponse({ error: '找不到帳戶token，請重新登入後重試' }, 401);
	}

	// 驗證 token
	const user = await verifyJWT(token, JWT_SECRET);
	if (!user) {
		return createResponse({ error: '帳號未驗證，請重新登入後再試' }, 401);
	}

	// 獲取存儲的用戶信息
	const storedUser = await DATABASE.prepare('SELECT password FROM users WHERE email = ?').bind(user.email).first();
	if (!storedUser) {
		return createResponse({ error: '找不到該用戶' }, 404);
	}

	// 驗證舊密碼
	const isOldPasswordValid = await isPasswordCorrect(oldPassword, storedUser.password);
	if (!isOldPasswordValid) {
		return createResponse({ error: '舊密碼輸入錯誤' }, 400);
	}

	// 哈希新密碼並更新資料庫
	const hashedNewPassword = await hashPassword(newPassword);
	await DATABASE.prepare('UPDATE users SET password = ? WHERE email = ?').bind(hashedNewPassword, user.email).run();

	return createResponse({ message: '密碼更新成功' }, 200);
}

// 重設密碼
export async function resetPassword(request: Request, env: Env) {
	const { DATABASE } = env;
	const { token } = new URL(request.url).searchParams;

	if (!token) {
		return createResponse({ error: '缺少 token' }, 400);
	}

	const payload = await verifyJWT(token, JWT_SECRET);
	if (!payload) {
		return createResponse({ error: '無效的 token' }, 401);
	}

	const { email } = payload;
	const { newPassword } = await request.json();
	const hashedPassword = await hashPassword(newPassword);

	await DATABASE.prepare('UPDATE users SET password = ? WHERE email = ?').bind(hashedPassword, email).run();

	return createResponse({ message: '密碼更新成功' }, 200);
}

// 發送忘記密碼信件
export async function sendRpEmail(request: Request, env: Env) {
	const { DATABASE } = env;
	const JWT_SECRET = env.JWT_SECRET;
	const apiKey = env.RESNED_APIKEY; // 可以将 API Key 放在环境变量中进行管理
	const fromAddress = 'noreply@lyhsca.org';

	try {
		// 从请求的 JSON 中获取 email
		const { email }: { email: string } = await request.json();

		// 查找用户
		const user = await DATABASE.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
		if (!user) {
			return createResponse({ error: '找不到該用戶' }, 404);
		}

		// 生成 JWT token 用于密码重置
		const payload = {
			email: user.email,
			exp: Math.floor(Date.now() / 1000) + 10 * 60, // 10分钟后过期
		};
		const token = sign(payload, JWT_SECRET);

		// 构建重置密码的链接
		const resetUrl = `https://auth.lyhsca.org/resetpassword?token=${token}`;
		const emailContent = `
            <p>您好，</p>
            <p>請點擊以下連結來重設您的密碼：</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <p>此連結將在一段時間後失效。若您未曾請求重設密碼，請忽略此郵件。</p>
        `;

		// 发邮件
		const response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				from: fromAddress,
				to: email,
				subject: '密碼重設請求',
				html: emailContent,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`发送邮件失败: ${errorText}`);
		}

		return createResponse({ message: '密碼重設郵件已發送' }, 200);
	} catch (error) {
		console.error('發送郵件錯誤:', error);
		return createResponse({ error: `發送郵件失败: ${error.message}` }, 500);
	}
}
