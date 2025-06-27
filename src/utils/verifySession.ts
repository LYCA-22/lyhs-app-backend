import { AppContext } from '..';
import { sessionKVData } from '../types';
import { getIPv6Prefix } from './getIPv6Prefix';
import { decryptToken } from './hashSessionId';

export async function verifySession(ctx: AppContext): Promise<String | Response> {
	let sessionId = ctx.req.header('Session-Id');
	let type = ctx.req.header('Login-Type');
	const currentIp = ctx.req.header('CF-Connecting-IP') || ctx.req.header('X-Forwarded-For') || ctx.req.header('X-Real-IP') || '';

	// 若沒有 token 或格式錯誤，回傳400錯誤
	if (!sessionId || !type) {
		console.error('SessionId or Login-Type is missing or malformed');
		return ctx.json({ error: 'Token or Login-Type is missing or malformed' }, 400);
	}

	if (type !== 'WEB' && type !== 'APP') {
		return ctx.json({ error: 'Invalid Login-Type' }, 400);
	}

	try {
		// 解密token
		const decryptedSession = await decryptToken(sessionId);

		// 從KV中獲取session數據
		const sessionData = (await ctx.env.sessionKV.get(`session:${decryptedSession}:data`, { type: 'json' })) as sessionKVData;

		if (!sessionData) {
			console.log('Session not found');
			return ctx.json({ error: 'Invalid or expired token' }, 401);
		}

		if (sessionData.ip !== getIPv6Prefix(currentIp)) {
			console.error('IP address mismatch');
			return ctx.json({ error: 'Session IP mismatch' }, 401);
		}

		if (!sessionData.userId) {
			console.error('Malformed session data: missing userId');
			return ctx.json({ error: 'Malformed session data' }, 400);
		}

		return sessionData.userId;
	} catch (error) {
		if (error instanceof Error) {
			console.error('Error verifying session:', error.message);
			return ctx.json({ error: `Error verifying session: ${error.message}` }, 500);
		}
		return ctx.json({ error: 'Unknown error while verifying session' }, 500);
	}
}
