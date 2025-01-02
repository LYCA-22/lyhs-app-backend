import { createResponse } from "../index";
import { sign, verify } from 'jsonwebtoken';
import { Env, UserRegisterData, UserLoginData, UserData, UserChangePasswordData } from "../types";

const JWT_SECRET = "LyhsPlus2025NEW"; // 建議將密鑰存儲在環境變數中

// 密碼哈希化
async function hashPassword(password: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
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

// 用戶註冊
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
		console.error("Error during registration:", error);
		return createResponse({ error: `Error: ${error.message}` }, 500);
	}
}

// 用戶登錄
async function userLogin(request: Request, env: Env) {
	const { DATABASE } = env;
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
		};
		const token = await generateJWT(payload, JWT_SECRET);

		return createResponse({ token: token }, 200);
	} catch (error) {
		console.error("Error during login:", error);
		return createResponse({ error: `Error: ${error.message}` }, 500);
	}
}

// 用戶資料查詢
async function fetchUserData(userId: string, env: Env) {
	const { DATABASE } = env;
	try {
		const user: UserData | null = await DATABASE.prepare('SELECT id, email, name, admin_access, user_level, user_class, user_grade, user_role FROM users WHERE id = ?').bind(userId).first();
		if (!user) {
			return createResponse({ error: "找不到此用戶" }, 404);
		}
		return createResponse(user, 200);
	} catch (error) {
		console.error("Error fetching user data:", error);
		return createResponse({ error: `Error: ${error.message}` }, 500);
	}
}

// 修改密碼
async function changePassword(request: Request, env: Env) {
	const { DATABASE } = env;
	const { oldPassword, newPassword }: UserChangePasswordData = await request.json();

	if (!oldPassword || !newPassword) {
		return createResponse({ error: "未輸入新密碼與舊密碼" }, 400);
	}

	const token = request.headers.get("Authorization")?.split(" ")[1];
	if (!token) {
		return createResponse({ error: "找不到帳戶token，請重新登入後重試" }, 401);
	}

	// 驗證 token
	const user = await verifyJWT(token, JWT_SECRET);
	if (!user) {
		return createResponse({ error: "帳號未驗證，請重新登入後再試" }, 401);
	}

	// 獲取存儲的用戶信息
	const storedUser = await DATABASE.prepare('SELECT password FROM users WHERE email = ?').bind(user.email).first();
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
	await DATABASE.prepare('UPDATE users SET password = ? WHERE email = ?').bind(hashedNewPassword, user.email).run();

	return createResponse({ message: "密碼更新成功" }, 200);
}

// 重設密碼
async function resetPassword(request: Request, env: Env) {
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

	return createResponse({ message: "密碼更新成功" }, 200);
}
async function checkToken(request: Request, env: Env) {
	const secret = env.JWT_SECRET; // 使用环境变量中的 JWT_SECRET

	const url = new URL(request.url);
	const token = url.searchParams.get("token");

	if (!token) {
		return createResponse({ error: "Token is missing" }, 400);
	}

	try {
		// 使用 jsonwebtoken 的 verify 函数验证 token
		const payload = verify(token, secret) as { userId: string }; // 验证后解码并获取载荷

		// 如果 token 验证通过，继续执行 fetchUserData 来获取用户信息
		return await fetchUserData(payload.userId, env);
	} catch (error) {
		// 如果 token 无效或过期
		return createResponse({ error: "Invalid or expired token" }, 401);
	}
}

export { userRegister, userLogin, fetchUserData, changePassword, resetPassword, checkToken };
