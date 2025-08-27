import { AppContext } from '../..';
import { parseUserAgent } from '.';
import { TokenResponse, userData, UserInfo, UserSession } from '../../types';
import { getIPv6Prefix } from '../../utils/getIPv6Prefix';
import { cleanupExpiredSessions } from '../../utils/cleanSessions';
import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { encryptToken } from '../../utils/hashSessionId';
import { setCookie } from 'hono/cookie';
import { getUserByEmail } from '../../utils/getUserData';
import { globalErrorHandler } from '../../utils/errorHandler';
import { errorHandler, KnownErrorCode } from '../../utils/error';

export class googleLogin extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '使用 Google 登入',
		description: 'Google 登入',
		tags: ['身份驗證'],
		requestBody: {
			content: {
				'application/json': {
					schema: {
						type: 'object',
						properties: {
							flow: { type: 'string' },
							grant_value: { type: 'string' },
							redirect_uri: { type: 'string' },
						},
						required: ['idToken'],
					},
				},
			},
		},
		responses: {
			'200': {
				description: '成功登入',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								userId: { type: 'string', example: '123456' },
								sessionId: { type: 'string', example: '123456-7890' },
							},
						},
					},
				},
			},
			'400': {
				description: '格式錯誤',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
									example: 'Invalid flow type',
								},
							},
						},
					},
				},
			},
			'404': {
				description: '找不到用戶',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
									example: 'User not found',
								},
							},
						},
					},
				},
			},
			'500': {
				description: '發生不明錯誤',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
									example: 'Error Login Google account',
								},
							},
						},
					},
				},
			},
		},
	};

	async handle(ctx: AppContext) {
		const env = ctx.env;
		const googleClientSecret = env.googleClientSecret;
		const googleClientId = env.googleClientId;
		const userAgent = ctx.req.header('User-Agent') || '';
		const loginType = ctx.req.header('Login-Type') || '';
		const { browser: browserInfo, os: osInfo } = parseUserAgent(userAgent);
		const clientIp = ctx.req.header('CF-Connecting-IP') || ctx.req.header('X-Forwarded-For') || ctx.req.header('X-Real-IP') || 'unknown';
		const { flow, grant_value, redirect_uri } = (await ctx.req.json()) as {
			flow: string;
			grant_value: string;
			redirect_uri: string;
		};

		try {
			if (loginType != 'APP' && loginType != 'WEB') {
				throw new errorHandler(KnownErrorCode.INVALID_LOGIN_TYPE);
			}

			if (flow !== 'authorization_code') {
				throw new errorHandler(KnownErrorCode.GOOGLE_API_ERROR);
			}

			const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					code: grant_value,
					client_id: googleClientId,
					client_secret: googleClientSecret,
					redirect_uri: redirect_uri,
					grant_type: 'authorization_code',
				}),
			});

			if (!tokenResponse.ok) {
				throw new Error('Failed to exchange authorization code for access token');
			}

			const tokenData: TokenResponse = await tokenResponse.json();
			const { access_token } = tokenData;

			const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
				headers: {
					Authorization: `Bearer ${access_token}`,
				},
			});

			if (!userInfoResponse.ok) {
				throw new errorHandler(KnownErrorCode.GOOGLE_AUTH_FAILED);
			}

			// 取得GOOGLE帳號資料，並與資料庫進行對比
			const userInfo = await userInfoResponse.json();
			const { email } = userInfo as UserInfo;
			const user = (await getUserByEmail(email, ctx)) as userData;
			if (!user.id || user.id === null || user.id === '') {
				throw new errorHandler(KnownErrorCode.USER_NOT_FOUND);
			}

			if (!user.oauth?.includes('GOOGLE')) {
				throw new errorHandler(KnownErrorCode.OAUTH_NOT_CONNECTED);
			}

			let sessionId = crypto.randomUUID();
			const loginTime = new Date(Date.now()).toISOString();
			const expirationTime = new Date(Date.now() + 12 * 60 * 60).toISOString();
			const currentIp = getIPv6Prefix(clientIp);
			const sessionData = JSON.stringify({
				userId: user.id,
				email: user.email,
				iat: loginTime,
				exp: expirationTime,
				ip: currentIp,
				igt: loginType,
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
			return ctx.json(200);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
