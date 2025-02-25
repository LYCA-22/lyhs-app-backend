import type { Env, userVerifyData, sessionKVData } from '../../types';
import { createResponse } from '../../index3';

export async function Logout(request: any, env: Env) {
	const { sessionKV } = env;
	const { email, sessionId }: userVerifyData = await request.json();

	if (!sessionId) {
		return createResponse({ error: 'SessionId is missing' }, 400);
	}

	try {
		const sessionData = await sessionKV.get(sessionId, { type: 'json' });

		if (!sessionData) {
			return createResponse({ error: 'Invalid or expired token' }, 401);
		}

		const sessionInfo = sessionData as sessionKVData;

		if (sessionInfo.email !== email) {
			return createResponse({ error: 'Invalid email' }, 401);
		}

		await sessionKV.delete(sessionId);
		return createResponse({ message: 'Logged out' }, 200);
	} catch (error: any) {
		console.error('Error during logout:', error);
		return createResponse({ error: `Error: ${error.message}` }, 500);
	}
}
