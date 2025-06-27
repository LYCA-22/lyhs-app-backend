import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../..';
import type { UserSession } from '../../types';
import { verifySession } from '../../utils/verifySession';

export class userLogout extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '登出帳號',
		tags: ['身份驗證'],
		description: '登出使用者',
		security: [{ sessionId: [] }],
		responses: {
			200: {
				description: '登出成功',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								message: { type: 'string' },
							},
							required: ['message'],
						},
					},
				},
			},
			400: {
				description: '缺少驗證資訊',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: { type: 'string' },
							},
							required: ['error'],
							example: {
								error: 'Missing Authorization header',
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
								error: { type: 'string' },
							},
							required: ['error'],
							example: {
								error: 'Internal Server Error',
							},
						},
					},
				},
			},
		},
	};

	async handle(ctx: AppContext) {
		const env = ctx.env;
		try {
			const result = await verifySession(ctx);
			if (result instanceof Response) {
				return result;
			}

			const sessionId = ctx.req.header('Session-Id');
			if (!sessionId) {
				return ctx.json({ error: 'Missing sessionId header' }, 400);
			}

			await env.sessionKV.delete(`session:${sessionId}:data`);

			const existingSessions = await env.sessionKV.get(`user:${result}:sessions`);
			if (existingSessions) {
				let sessionList: UserSession[] = JSON.parse(existingSessions);
				sessionList = sessionList.filter((session) => session.sessionId !== sessionId);
				if (sessionList.length > 0) {
					await env.sessionKV.put(`user:${result}:sessions`, JSON.stringify(sessionList));
				} else {
					await env.sessionKV.delete(`user:${result}:sessions`);
				}
			}

			return ctx.json({ message: 'Logout successful' }, 200);
		} catch (error) {
			if (error instanceof Error) {
				console.error('Error during logout:', error);
				return ctx.json({ error: `Error: ${error.message}` }, 500);
			}
			console.error('Error during logout:', error);
			return ctx.json({ error: 'Internal server error' }, 500);
		}
	}
}
