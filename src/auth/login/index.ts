import { Env, userVerifyData, userData, sessionKVData, BrowserInfo, OsInfo } from '../../types';
import { createResponse } from '../../index';
import { hashPassword } from '../index';

// 得到瀏覽器和操作系統資訊
export function parseUserAgent(userAgent: string): { browser: BrowserInfo; os: OsInfo } {
	const browser: BrowserInfo = {
		name: 'unknown',
		version: 'unknown',
	};
	const os: OsInfo = {
		name: 'unknown',
		version: 'unknown',
	};

	// 瀏覽器檢測
	if (userAgent.includes('Firefox/')) {
		browser.name = 'Firefox';
		browser.version = userAgent.split('Firefox/')[1].split(' ')[0];
	} else if (userAgent.includes('Chrome/')) {
		browser.name = 'Chrome';
		browser.version = userAgent.split('Chrome/')[1].split(' ')[0];
	} else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
		browser.name = 'Safari';
		browser.version = userAgent.split('Version/')[1]?.split(' ')[0] || 'unknown';
	} else if (userAgent.includes('Edge/')) {
		browser.name = 'Edge';
		browser.version = userAgent.split('Edge/')[1].split(' ')[0];
	}

	// 操作系統檢測
	if (userAgent.includes('Windows')) {
		os.name = 'Windows';
		if (userAgent.includes('Windows NT 10.0')) os.version = '10';
		else if (userAgent.includes('Windows NT 6.3')) os.version = '8.1';
		else if (userAgent.includes('Windows NT 6.2')) os.version = '8';
		else if (userAgent.includes('Windows NT 6.1')) os.version = '7';
	} else if (userAgent.includes('Mac OS X')) {
		os.name = 'MacOS';
		const version = userAgent.match(/Mac OS X (\d+[._]\d+[._]\d+|\d+[._]\d+)/);
		os.version = version ? version[1].replace(/_/g, '.') : 'unknown';
	} else if (userAgent.includes('Linux')) {
		os.name = 'Linux';
	} else if (userAgent.includes('iPhone')) {
		os.name = 'iOS';
		const version = userAgent.match(/iPhone OS (\d+_\d+)/);
		os.version = version ? version[1].replace('_', '.') : 'unknown';
	} else if (userAgent.includes('Android')) {
		os.name = 'Android';
		const version = userAgent.match(/Android (\d+(\.\d+)?)/);
		os.version = version ? version[1] : 'unknown';
	}

	return { browser, os };
}

// 用戶登錄
export async function userLogin(request: Request, env: Env) {
	const { DATABASE, sessionKV } = env;
	const { email, password }: userVerifyData = await request.json();
	const userAgent = request.headers.get('User-Agent') || '';
	const { browser: browserInfo, os: osInfo } = parseUserAgent(userAgent);
	const clientIp =
		request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || request.headers.get('X-Real-IP') || 'unknown';

	if (!password) {
		return createResponse({ error: 'Password is missing' }, 400);
	}

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
		const expirationTime = new Date(Date.now() + 12 * 60 * 60).toISOString();
		const sessionData = JSON.stringify({
			userId: user.id,
			email: user.email,
			loginTime: loginTime,
			expirationTime: expirationTime,
			browser: browserInfo.name,
			ip: clientIp,
			os: osInfo.name,
		});
		await sessionKV.put(sessionId, sessionData, { expirationTtl: 12 * 60 * 60 });
		return createResponse({ sessionId: sessionId }, 200);
	} catch (error: any) {
		console.error('Error during login:', error);
		return createResponse({ error: `Error: ${error.message}` }, 500);
	}
}

// 驗證用戶（如果成功將會回傳用戶資料）
export async function veritySession(request: Request, env: Env) {
	const sessionId = request.headers.get('Authorization');
	const currentIp = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || request.headers.get('X-Real-IP');

	if (!sessionId || !sessionId.startsWith('Bearer ')) {
		console.error('SessionId is missing or malformed');
		return createResponse({ error: 'SessionId is missing or malformed' }, 400);
	}

	const token = sessionId.slice(7); // 去掉 "Bearer " 前缀

	try {
		const sessionData = (await env.sessionKV.get(token, { type: 'json' })) as sessionKVData;

		// sessionData 是否存在
		if (!sessionData) {
			console.error(`Invalid or expired token: ${token}`); // 添加日志
			return createResponse({ error: 'Invalid or expired token' }, 401);
		}

		if (sessionData.ip !== currentIp) {
			console.error('IP address mismatch');
			return createResponse({ error: 'Session IP mismatch' }, 401);
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
		const user: userData | null = await DATABASE.prepare(
			'SELECT id, name, email, type, level, class, grade, role, auth_person FROM accountData WHERE id = ?',
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
