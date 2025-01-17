import { Env, userLoginData, userData } from '../../types';
import { createResponse } from '../../index';
import { hashPassword } from '../index';

// 用戶登錄
export async function userLogin(request: Request, env: Env) {
	const { DATABASE, KV } = env;
	const { email, password }: userLoginData = await request.json();

	try {
		const user = await DATABASE.prepare('SELECT * FROM accountData WHERE email = ?').bind(email).first();
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
		const user: userData | null = await DATABASE.prepare('SELECT * FROM accountData WHERE id = ?').bind(userId).first();
		if (!user) {
			return createResponse({ error: '找不到此用戶' }, 404);
		}
		return createResponse(user, 200);
	} catch (error: any) {
		console.error('Error fetching user data:', error);
		return createResponse({ error: `Error: ${error.message}` }, 500);
	}
}
