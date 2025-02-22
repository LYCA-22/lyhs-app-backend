import { AppContext } from '../..';
import type { Env, userVerifyData, sessionKVData } from '../../types';

export async function userLogout(ctx: AppContext) {
	const { email, sessionId }: userVerifyData = await ctx.req.json();
	const env = ctx.env;

	if (!sessionId) {
		return ctx.json({ error: 'SessionId is missing' }, 400);
	}

	try {
		const sessionData = await env.sessionKV.get(sessionId, { type: 'json' });

		if (!sessionData) {
			return ctx.json({ error: 'Invalid or expired token' }, 401);
		}

		const sessionInfo = sessionData as sessionKVData;

		if (sessionInfo.email !== email) {
			return ctx.json({ error: 'Invalid email' }, 401);
		}

		await env.sessionKV.delete(sessionId);
		return ctx.json({ message: 'Logged out' }, 200);
	} catch (error: any) {
		console.error('Error during logout:', error);
		return ctx.json({ error: `Error: ${error.message}` }, 500);
	}
}
