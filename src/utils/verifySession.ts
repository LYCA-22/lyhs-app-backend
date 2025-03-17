import { AppContext } from '..';
import { sessionKVData } from '../types';
import { getIPv6Prefix } from './getIPv6Prefix';
import { decryptSessionId } from './hashSession';

export async function verifySession(ctx: AppContext): Promise<string | Response> {
	// 取得 Authorization header（預期格式為 Bearer token）
	const authHeader = ctx.req.header('Authorization');
	const currentIp = ctx.req.header('CF-Connecting-IP') || ctx.req.header('X-Forwarded-For') || ctx.req.header('X-Real-IP') || '';

	// 若沒有 token 或格式錯誤，直接回傳400錯誤
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		console.error('SessionId is missing or malformed');
		return ctx.json({ error: 'SessionId is missing or malformed' }, 400);
	}

	let token = authHeader.slice(7);

	try {
		token = await decryptSessionId(token);
		const sessionData = (await ctx.env.sessionKV.get(`session:${token}:data`, { type: 'json' })) as sessionKVData;

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
