import { userVerifyData, BrowserInfo, OsInfo, userData } from '../../types';
import { verifyPassword } from '../../utils/hashPsw';
import { AppContext } from '../..';
import { parseUserAgent } from './index';
import { cleanupExpiredSessions } from '../../utils/cleanSessions';
import { UserSession } from '../../types';
import { getIPv6Prefix } from '../../utils/getIPv6Prefix';
import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { encryptSessionId } from '../../utils/hashSession';

export class userLogin extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '使用一般電子郵件登入',
		tags: ['身份驗證'],
		security: [{ sessionId: [] }],
		request: {
			body: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								email: { type: 'string', format: 'email' },
								password: { type: 'string' },
							},
							required: ['email', 'password'],
						},
					},
				},
			},
		},
		responses: {
			200: {
				description: '登入成功',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								sessionId: { type: 'string' },
								user: { type: 'string' },
							},
							required: ['sessionId', 'user'],
							example: {
								sessionId: '1234567890',
								userId: 'user123',
							},
						},
					},
				},
			},
			400: {
				description: '缺少密碼資訊',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: { type: 'string' },
							},
							required: ['error'],
							example: {
								error: 'Password is missing',
							},
						},
					},
				},
			},
			404: {
				description: '使用者不存在',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: { type: 'string' },
							},
							required: ['error'],
							example: {
								error: 'User not found',
							},
						},
					},
				},
			},
			500: {
				description: '伺服器內部錯誤',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: { type: 'string' },
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

			const userData = user as unknown as userData;

			const isPasswordValid = await verifyPassword(password, userData.password);
			console.log(isPasswordValid);
			if (!isPasswordValid) {
				return ctx.json({ error: 'Invalid password' }, 401);
			}

			let sessionId = crypto.randomUUID();
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
				sessionId: sessionId,
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
			sessionId = await encryptSessionId(sessionId);
			return ctx.json({ sessionId: sessionId, userId: user.id }, 200);
		} catch (error) {
			if (error instanceof Error) {
				console.error('Error during login:', error);
				return ctx.json({ error: `Error: ${error.message}` }, 500);
			}
			console.error('Unexpected error during login:', error);
			return ctx.json({ error: 'Internal server error' }, 500);
		}
	}
}
