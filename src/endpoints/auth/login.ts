import { userVerifyData, userData, UserSession } from '../../types';
import { verifyPassword } from '../../utils/hashPsw';
import { AppContext } from '../..';
import { parseUserAgent } from './index';
import { getIPv6Prefix } from '../../utils/getIPv6Prefix';
import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { encryptToken } from '../../utils/hashSessionId';
import { cleanupExpiredSessions } from '../../utils/cleanSessions';
import { setCookie } from 'hono/cookie';
import { httpReturn, KnownErrorCode } from '../../utils/error';
import { checkService } from '../../utils/checkService';
import { globalErrorHandler } from '../../utils/errorHandler';

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
								message: { type: 'string' },
							},
							example: {
								message: 'successful',
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
		const loginType = ctx.req.header('Login-Type') || '';
		const { browser: browserInfo, os: osInfo } = parseUserAgent(userAgent);
		const clientIp = ctx.req.header('CF-Connecting-IP') || ctx.req.header('X-Forwarded-For') || ctx.req.header('X-Real-IP') || 'unknown';

		try {
			await checkService('user_login', ctx);

			if (!password || !email || !loginType) {
				return httpReturn(ctx, KnownErrorCode.MISSING_REQUIRED_FIELDS, {
					missingFields: [!email && 'email', !password && 'password', !loginType && 'loginType'].filter(Boolean),
				});
			}

			if (loginType != 'APP' && loginType != 'WEB') {
				return httpReturn(ctx, KnownErrorCode.INVALID_LOGIN_TYPE);
			}

			const user = await env.DATABASE.prepare('SELECT * FROM accountData WHERE email = ?').bind(email).first();
			if (!user) {
				return httpReturn(ctx, KnownErrorCode.USER_NOT_FOUND);
			}

			const userData = user as unknown as userData;
			const isPasswordValid = await verifyPassword(password, userData.password);
			if (!isPasswordValid) {
				return httpReturn(ctx, KnownErrorCode.INVALID_PASSWORD);
			}

			let sessionId = crypto.randomUUID();
			const loginTime = new Date(Date.now()).toISOString();
			const expirationTime = new Date(Date.now() + 12 * 60 * 60).toISOString();
			const currentIp = getIPv6Prefix(clientIp);
			const sessionData = JSON.stringify({
				userId: user.id,
				email: user.email,
				loginTime: loginTime,
				iat: loginTime,
				exp: expirationTime,
				ip: currentIp,
				lgt: loginType,
			});
			const userSessionData: UserSession = {
				sessionId: sessionId,
				iat: loginTime,
				exp: expirationTime,
				browser: browserInfo.name,
				ip: currentIp,
				os: osInfo.name,
				igt: loginType,
			};

			await env.sessionKV.put(`session:${sessionId}:data`, sessionData, {
				expirationTtl: loginType === 'APP' ? 24 * 60 * 60 * 30 : 5 * 60 * 60,
			});
			const existingSessions = await env.sessionKV.get(`user:${user.id}:sessions`);
			let sessionList: UserSession[] = existingSessions ? JSON.parse(existingSessions) : [];
			sessionList = cleanupExpiredSessions(sessionList);
			sessionList.push(userSessionData);
			await env.sessionKV.put(`user:${user.id}:sessions`, JSON.stringify(sessionList));
			sessionId = await encryptToken(sessionId);

			setCookie(ctx, 'sessionId', sessionId, {
				maxAge: loginType === 'APP' ? 24 * 60 * 60 * 30 : 5 * 60 * 60,
				path: '/',
				domain: 'lyhsca.org',
				httpOnly: false,
				secure: true,
			});

			setCookie(ctx, 'lyps_userId', user.id as string, {
				maxAge: 86400,
				path: '/',
				sameSite: 'Strict',
				domain: 'lyhsca.org',
				httpOnly: false,
				secure: true,
			});

			ctx.header('Access-Control-Allow-Credentials', 'true');
			return ctx.json({ message: 'Login successful' }, 200);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
