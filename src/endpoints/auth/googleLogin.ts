import { AppContext } from '../..';
import { parseUserAgent } from '.';
import { TokenResponse, UserInfo, UserSession } from '../../types';
import { getIPv6Prefix } from '../../utils/getIPv6Prefix';
import { cleanupExpiredSessions } from '../../utils/cleanSessions';
import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';

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
		const { browser: browserInfo, os: osInfo } = parseUserAgent(userAgent);
		const clientIp = ctx.req.header('CF-Connecting-IP') || ctx.req.header('X-Forwarded-For') || ctx.req.header('X-Real-IP') || 'unknown';
		const { flow, grant_value, redirect_uri } = (await ctx.req.json()) as {
			flow: string;
			grant_value: string;
			redirect_uri: string;
		};

		if (flow !== 'authorization_code') {
			return ctx.json({ error: 'Invalid flow type' }, 400);
		}

		try {
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
				throw new Error('Failed to fetch user info from Google');
			}

			const userInfo = await userInfoResponse.json();
			const { email } = userInfo as UserInfo;
			const user = await env.DATABASE.prepare('SELECT * FROM accountData WHERE email = ?').bind(email).first();
			if (!user) {
				return ctx.json({ error: 'User not found' }, 404);
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
			const userSessionData: UserSession = {
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
			return ctx.json({ sessionId: sessionId, userId: user.id }, 200);
		} catch (error: any) {
			console.error('Error Login Google account', error);
			return ctx.json({ error: error }, 500);
		}
	}
}
