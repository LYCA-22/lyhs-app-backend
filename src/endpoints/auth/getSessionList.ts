import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../..';
import { verifySession } from '../../utils/verifySession';
import { globalErrorHandler } from '../../utils/errorHandler';

export class getSessionList extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '獲取 Session 列表',
		tags: ['身份驗證'],
		description: '獲取當前用戶的所有 Session',
		security: [{ sessionId: [] }],
		responses: {
			200: {
				description: '成功獲取 Session 列表',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								data: {
									type: 'array',
									items: {
										type: 'object',
										properties: {
											loginTime: { type: 'string' },
											expirationTime: { type: 'string' },
											browser: { type: 'string' },
											ip: { type: 'string' },
											os: { type: 'string' },
										},
									},
								},
							},
						},
					},
				},
			},
			404: {
				description: '找不到用戶 Session 資料',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: { type: 'string' },
							},
							example: { error: 'Session not found' },
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
							example: { error: 'Internal server error' },
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

			const sessionData = await env.sessionKV.get(`user:${result}:sessions`);
			if (!sessionData) {
				return ctx.json({ error: `No session data found` }, 404);
			}

			const sessions = JSON.parse(sessionData);
			return ctx.json({ data: sessions });
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
