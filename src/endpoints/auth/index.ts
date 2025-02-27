import { createRouter } from '..';
import { AppContext, AppRouter } from '../..';
import { userLogin } from './login';
import { userLogout } from './logout';
import { verifySession as VS } from '../../utils/verifySession';
import { BrowserInfo, OsInfo } from '../../types';
import { googleLogin } from './googleLogin';
import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { getSessionList } from './getSessionList';
import { deleteSession } from './deleteSession';

export function registerAuthRoute(): AppRouter {
	const router = createRouter();

	router.post('/google', googleLogin);
	router.post('/login', userLogin);
	router.post('/logout', userLogout);
	router.get('/verify', verifySession);
	router.get('/sessions/list', getSessionList);
	router.delete('/session', deleteSession);
	return router;
}

class verifySession extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '驗證 SessionId 是否有效',
		tags: ['身份驗證'],
		security: [{ sessionId: [] }],
		responses: {
			200: {
				description: '驗證成功',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								message: {
									type: 'string',
									description: '驗證成功訊息',
								},
							},
							required: ['message'],
							example: {
								message: 'Session verified',
							},
						},
					},
				},
			},
			500: {
				description: '伺服器錯誤',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
									description: '錯誤訊息',
								},
							},
							required: ['error'],
							example: {
								error: 'Internal server error',
							},
						},
					},
				},
			},
		},
	};

	async handle(ctx: AppContext) {
		try {
			const result = await VS(ctx);
			if (result instanceof Response) {
				return result;
			}
			return ctx.json({ message: 'Session verified' }, 200);
		} catch (error) {
			if (error instanceof Error) {
				return ctx.json({ error: error.message }, 500);
			}
			console.error('Error occurred during session verification:', error);
			return ctx.json({ error: 'Internal server error' }, 500);
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
