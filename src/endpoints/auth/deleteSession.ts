import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../..';
import { verifySession } from '../../utils/verifySession';
import { UserSession } from '../../types';

export class deleteSession extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '刪除 SessionId 資料',
		tags: ['身份驗證'],
		security: [{ sessionId: [] }],
		responses: {
			200: {
				description: 'SessionId 資料已成功刪除',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								message: {
									type: 'string',
								},
							},
							example: {
								message: 'Session deleted',
							},
						},
					},
				},
			},
			400: {
				description: '缺少欲刪除的 SessionId',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
								},
							},
							example: {
								error: 'SessionId is required',
							},
						},
					},
				},
			},
			500: {
				description: '發生不明錯誤',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
								},
							},
							example: {
								error: 'Unknown error',
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
			const delSessionId = ctx.req.param('sessionId');
			if (!delSessionId) {
				return ctx.json({ error: 'SessionId is required' }, 400);
			}

			const result = await verifySession(ctx);
			if (result instanceof Response) {
				return result;
			}

			await env.sessionKV.delete(`session:${delSessionId}:data`);

			const existingSessions = await env.sessionKV.get(`user:${result}:sessions`);
			if (existingSessions) {
				let sessionList: UserSession[] = JSON.parse(existingSessions);
				sessionList = sessionList.filter((session) => session.sessionId !== delSessionId);
				if (sessionList.length > 0) {
					await env.sessionKV.put(`user:${result}:sessions`, JSON.stringify(sessionList));
				} else {
					await env.sessionKV.delete(`user:${result}:sessions`);
				}
			}

			return ctx.json({ message: 'Session deleted' }, 200);
		} catch (error) {
			if (error instanceof Error) {
				console.error('Error in deleteSession:', error.message);
				return ctx.json({ error: error.message }, 500);
			}
			console.error(error);
			return ctx.json({ error: 'Unknown error' }, 500);
		}
	}
}
