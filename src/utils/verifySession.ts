import { AppContext } from '..';
import { sessionKVData } from '../types';
import { httpReturn, KnownErrorCode } from './error';
import { getIPv6Prefix } from './getIPv6Prefix';
import { decryptToken } from './hashSessionId';

export async function verifySession(ctx: AppContext): Promise<String | Response> {
	let sessionId = ctx.req.header('Session-Id');
	let type = ctx.req.header('Login-Type');
	const currentIp = ctx.req.header('CF-Connecting-IP') || ctx.req.header('X-Forwarded-For') || ctx.req.header('X-Real-IP') || '';

	// 若沒有 token 或格式錯誤，回傳400錯誤
	if (!sessionId || !type) {
		return httpReturn(ctx, KnownErrorCode.MISSING_REQUIRED_FIELDS, {});
	}

	if (type !== 'WEB' && type !== 'APP') {
		return httpReturn(ctx, KnownErrorCode.INVALID_LOGIN_TYPE);
	}

	try {
		// 解密token
		const decryptedSession = await decryptToken(sessionId);

		// 從KV中獲取session數據
		const sessionData = (await ctx.env.sessionKV.get(`session:${decryptedSession}:data`, { type: 'json' })) as sessionKVData;

		if (!sessionData) {
			console.log('Session not found');
			return httpReturn(ctx, KnownErrorCode.SESSION_NOT_FOUND);
		}

		if (sessionData.ip !== getIPv6Prefix(currentIp)) {
			console.error('IP address mismatch');
			return httpReturn(ctx, KnownErrorCode.SESSION_IP_MISMATCH);
		}

		if (!sessionData.userId) {
			console.error('Malformed session data: missing userId');
			return httpReturn(ctx, KnownErrorCode.MALFORMED_SESSION_DATA);
		}

		return sessionData.userId;
	} catch (error) {
		if (error instanceof Error) {
			console.error('Error verifying session:', error.message);
			return httpReturn(ctx, KnownErrorCode.INTERNAL_SERVER_ERROR, {
				originalError: error.message,
				context: 'session verification',
			});
		}
		return httpReturn(ctx, KnownErrorCode.INTERNAL_SERVER_ERROR, {
			originalError: error,
			context: 'session verification',
		});
	}
}
