import { userVerifyData, BrowserInfo, OsInfo } from '../../types';
import { hashPassword } from '../../utils/pswHash';
import { AppContext } from '../..';
import { parseUserAgent } from './index';
import { cleanupExpiredSessions } from '../../utils/cleanSessions';
import { UserSession } from '../../types';
import { getIPv6Prefix } from '../../utils/getIPv6Prefix';

export async function userLogin(ctx: AppContext) {
	const env = ctx.env;
	const { email, password }: userVerifyData = await ctx.req.json();
	const userAgent = ctx.req.header('User-Agent') || '';
	const { browser: browserInfo, os: osInfo } = parseUserAgent(userAgent);
	const clientIp = ctx.req.header('CF-Connecting-IP') || ctx.req.header('X-Forwarded-For') || ctx.req.header('X-Real-IP') || 'unknown';

	if (!password) {
		return ctx.json({ error: 'Password is missing' }, 400);
	}

	try {
		const user = await env.DATABASE.prepare('SELECT * FROM accountData WHERE email = ?').bind(email).first();
		if (!user) {
			return ctx.json({ error: 'User not found' }, 404);
		}

		const hashedPassword = await hashPassword(password);
		if (hashedPassword !== user.password) {
			return ctx.json({ error: 'Incorrect password' }, 401);
		}

		const sessionId = crypto.randomUUID();
		const loginTime = new Date(Date.now()).toISOString();
		const expirationTime = new Date(Date.now() + 12 * 60 * 60).toISOString();
		const currentIp = getIPv6Prefix(clientIp);
		const sessionData = JSON.stringify({
			userId: user.id,
			email: user.email,
			loginTime: loginTime,
			expirationTime: expirationTime,
			ip: currentIp,
		});
		const userSessionData = {
			loginTime: loginTime,
			expirationTime: expirationTime,
			browser: browserInfo.name,
			ip: currentIp,
			os: osInfo.name,
		};
		await env.sessionKV.put(`session:${sessionId}:data`, sessionData, { expirationTtl: 12 * 60 * 60 });
		const existingSessions = await env.sessionKV.get(`user:${user.id}:sessions`);
		let sessionList: UserSession[] = existingSessions ? JSON.parse(existingSessions) : [];
		sessionList = cleanupExpiredSessions(sessionList);
		sessionList.push(userSessionData);
		await env.sessionKV.put(`user:${user.id}:sessions`, JSON.stringify(sessionList));
		return ctx.json({ sessionId: sessionId, userId: user.id }, 200);
	} catch (error) {
		if (error instanceof Error) {
			console.error('Error during login:', error);
			return ctx.json({ error: `Error: ${error.message}` }, 500);
		}
	}
}
