// 輔助函數
import {createResponse} from "../index";
import {Env, UserRegisterData, UserLoginData, UserData, UserChangePasswordData} from "../types";

async function hashPassword(password: string) {
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
}
async function generateJWT(payload, secret: string) {
	const header = { alg: "HS256", typ: "JWT" };

	const encode = (data) =>
		btoa(JSON.stringify(data))
			.replace(/=/g, "")
			.replace(/\+/g, "-")
			.replace(/\//g, "_");

	const headerEncoded = encode(header);
	const payloadEncoded = encode(payload);

	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"]
	);

	const signature = await crypto.subtle.sign(
		"HMAC",
		key,
		encoder.encode(`${headerEncoded}.${payloadEncoded}`)
	);

	const signatureEncoded = btoa(String.fromCharCode(...new Uint8Array(signature)))
		.replace(/=/g, "")
		.replace(/\+/g, "-")
		.replace(/\//g, "_");

	return `${headerEncoded}.${payloadEncoded}.${signatureEncoded}`;
}
async function verifyJWT(token: string, secret: string) {
	const [headerEncoded, payloadEncoded, signatureEncoded] = token.split(".");
	if (!headerEncoded || !payloadEncoded || !signatureEncoded) {
		return null;
	}

	const payload = JSON.parse(atob(payloadEncoded.replace(/-/g, "+").replace(/_/g, "/")));
	if (payload.exp < Math.floor(Date.now() / 1000)) {
		return null; // token 已過期
	}

	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["verify"]
	);

	const signature = Uint8Array.from(atob(signatureEncoded.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
	const isValid = await crypto.subtle.verify(
		"HMAC",
		key,
		signature,
		encoder.encode(`${headerEncoded}.${payloadEncoded}`)
	);

	return isValid ? payload : null;
}
async function checkToken(request: Request, env: Env) {
	const secret = "lycaapis2024"; // 建議使用環境變數來管理這個秘密

	const url = new URL(request.url);
	const token = url.searchParams.get("token");

	if (!token) {
		return createResponse({ error: "Token is missing" }, 400);
	}

	const payload = await verifyJWT(token, secret);
	if (!payload) {
		return createResponse({ error: "Invalid or expired token" }, 401);
	}

	return await fetchUserData(payload.userId, env);
}

// 帳號基本功能
async function userRegister(request: Request, env: Env) {
	const { DATABASE } = env;
	const { email, password, name, admin_access, user_level, user_class, user_grade, user_role }: UserRegisterData = await request.json();

	try {
		const existingUser = await DATABASE.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
		if (existingUser) {
			return createResponse({ error: '此帳號已經存在' }, 409);
		}

		const userId = crypto.randomUUID();
		const hashedPassword = await hashPassword(password);

		await DATABASE.prepare(`
          INSERT INTO users (id, email, password, name, admin_access, user_level, user_class, user_grade, user_role)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(userId, email, hashedPassword, name, admin_access, user_level, user_class, user_grade, user_role).run();

		return createResponse({ message: 'User registered successfully' }, 201);
	} catch (error) {
		return createResponse({ error: `Error: ${error.message}` }, 500);
	}
}
async function userLogin(request: Request, env: Env) {
	const { DATABASE } = env;
	const JWT_SECRET = env.JWT_SECRET;
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

		const payload = {
			userId: user.id,
			email: user.email,
			exp: Math.floor(Date.now() / 1000) + (2 * 60 * 60), // 2小時後過期
		};
		const token = await generateJWT(payload, JWT_SECRET);

		return createResponse({ token : token }, 200);
	} catch (error) {
		return createResponse({ error: `Error: ${error.message}` }, 500);
	}
}
async function fetchUserData(userId: string, env: Env) {
	const { DATABASE } = env;
	try {
		const user: UserData | null = await DATABASE.prepare('SELECT id, email, name, admin_access, user_level, user_class, user_grade, user_role FROM users WHERE id = ?').bind(userId).first();
		if (!user) {
			return createResponse({ error: "找不到此用戶" }, 404);
		}
		return createResponse(user, 200);
	} catch (error) {
		return createResponse({ error: `Error: ${error.message}` }, 500);
	}
}
async function isPasswordCorrect(inputPassword: string, oldPassword: string) {
	const hashedInput = await hashPassword(inputPassword);
	return hashedInput === oldPassword;
}

// 重設密碼（已登入狀態）
async function changePassword(request: Request,env: Env) {
	const { DATABASE } = env;
	const JWT_SECRET = env.JWT_SECRET;
	const { oldPassword, newPassword }: UserChangePasswordData = await request.json();

	// 確保 oldPassword 和 newPassword 存在
	if (oldPassword === undefined || newPassword === undefined) {
		return createResponse({ error: "未輸入新密碼與舊密碼" }, 400);
	}

	const token = request.headers.get("Authorization")?.split(" ")[1];
	if (!token) {
		return createResponse({ error: "找不到帳戶token，請重新登入後重試" }, 401);
	}

	// 認證用戶
	const user = await verifyJWT(token, JWT_SECRET);
	if (!user) {
		return createResponse({ error: "帳號未驗證，請重新登入後再試" }, 401);
	}

	// 獲取存儲的用戶信息
	const storedUser = await DATABASE.prepare('SELECT password FROM users WHERE email = ?')
		.bind(user.email)
		.first();

	// 確保存儲的用戶存在
	if (!storedUser) {
		return createResponse({ error: "找不到該用戶" }, 404);
	}

	// 驗證舊密碼
	const isOldPasswordValid = await isPasswordCorrect(oldPassword, storedUser.password);
	if (!isOldPasswordValid) {
		return createResponse({ error: "舊密碼輸入錯誤" }, 400);
	}

	// 哈希新密碼並更新資料庫
	const hashedNewPassword = await hashPassword(newPassword);
	if (!hashedNewPassword) {
		return createResponse({ error: "密碼無法加密，請稍後再試" }, 500);
	}

	await DATABASE.prepare('UPDATE users SET password = ? WHERE email = ?')
		.bind(hashedNewPassword, user.email)
		.run();

	return createResponse({ message: "密碼更新成功" }, 200);
}
// 重設密碼（未登入狀態）
async function sendRpEmail(request: Request, env: Env) {
	const { DATABASE } = env;
	const JWT_SECRET = env.JWT_SECRET
	const apiKey = 're_ijfpWje1_KsgWZGzYRZfbQzVacPkiqoXH';
	// 從請求的 JSON 資料中提取用戶的 email
	const { email } = await request.json();
	const fromAddress = 'noreply@lyhsca.org';
	try {
		const user = await DATABASE.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
		if (!user) {
			return createResponse({ error: '找不到該用戶' }, 404);
		}
		const payload = {
			email: user.email,
			exp: Math.floor(Date.now() / 1000) + (10 * 60),
		};
		const token = await generateJWT(payload, JWT_SECRET);

		const resetUrl = `https://auth.lyhsca.org/resetpassword?token=${token}`;
		const emailContent = `
      <p>您好，</p>
      <p>請點擊以下連結來重設您的密碼：</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>此連結將在一段時間後失效。若您未曾請求重設密碼，請忽略此郵件。</p>
    `;

		// 發送 email
		const response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				from: fromAddress,
				to: email,
				subject: '密碼重設請求',
				html: emailContent
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to send email: ${errorText}`);
		}

		// 成功時返回 token，用於後續驗證
		return createResponse(200);

	} catch (error) {
		console.error('Error sending email:', error);
		return createResponse(`Failed to sending email: ${error}`, 500 );
	}
}
async function resetPassword(request: Request, env: Env) {
	const { DATABASE } = env;
	const JWT_SECRET = env.JWT_SECRET

	try {
		// 从请求 URL 中提取 token
		const url = new URL(request.url);
		const token = url.searchParams.get('token');
		if (!token) {
			return new Response(JSON.stringify({ error: '缺少 token' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
		}

		// 验证 token
		const payload = await verifyJWT(token, JWT_SECRET);
		if (!payload) {
			return new Response(JSON.stringify({ error: '無效的 token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
		}

		// Token 验证成功，提取用户 email
		const { email } = payload;

		// 获取新的密码（假设是从请求体中获得）
		const { newPassword } = await request.json();
		const password = await hashPassword(newPassword)

		// 更新密码
		await DATABASE.prepare('UPDATE users SET password = ? WHERE email = ?').bind(password, email).run();

		return createResponse({ message: `密碼更新成功` }, 200);
	} catch (error) {
		console.error('Error resetting password:', error);
		return new Response(JSON.stringify({ error: '密码重置失败' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
	}
}

export { userRegister, userLogin, fetchUserData, checkToken, changePassword, sendRpEmail, resetPassword };
