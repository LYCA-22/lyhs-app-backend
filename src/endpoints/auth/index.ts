import { createRouter } from '..';
import { AppContext, AppRouter } from '../..';
import { userLogin } from './login';
import { userLogout } from './logout';
import { verifySession as VS } from '../../utils/verifySession';
import { BrowserInfo, OsInfo } from '../../types';
import { googleLogin } from './googleLogin';

export function registerAuthRoute(): AppRouter {
	const router = createRouter();

	router.post('/login', (ctx) => userLogin(ctx));
	router.post('/logout', (ctx) => userLogout(ctx));
	router.get('/verify', (ctx) => verifySession(ctx));
	router.post('/google', (ctx) => googleLogin(ctx));
	return router;
}

async function verifySession(ctx: AppContext) {
	try {
		const result = await VS(ctx);
		if (result instanceof Response) {
			return result;
		}
		return ctx.json({ message: 'Session verified' }, 200);
	} catch (error) {
		if (error instanceof Error) {
			return ctx.json({ error: error.message }, 400);
		}
	}
}

export function parseUserAgent(userAgent: string): { browser: BrowserInfo; os: OsInfo } {
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
