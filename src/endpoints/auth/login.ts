import { userVerifyData, BrowserInfo, OsInfo } from '../../types';
import { hashPassword } from './index';
import { AppContext } from '../..';

function parseUserAgent(userAgent: string): { browser: BrowserInfo; os: OsInfo } {
	const browser: BrowserInfo = {
		name: 'unknown',
		version: 'unknown',
	};
	const os: OsInfo = {
		name: 'unknown',
		version: 'unknown',
	};

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
		const sessionData = JSON.stringify({
			userId: user.id,
			email: user.email,
			loginTime: loginTime,
			expirationTime: expirationTime,
			ip: clientIp,
		});
		const userSessionData = JSON.stringify({
			loginTime: loginTime,
			expirationTime: expirationTime,
			browser: browserInfo.name,
			ip: clientIp,
			os: osInfo.name,
		});
		await env.sessionKV.put(`session:${sessionId}:data`, sessionData, { expirationTtl: 12 * 60 * 60 });
		const existingSessions = await env.sessionKV.get(`user:${user.id}:sessions`);
		const sessionList = existingSessions ? JSON.parse(existingSessions) : [];
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
