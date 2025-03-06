import { OpenAPIRoute, OpenAPIRouterType, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../..';
import { verifySession } from '../../utils/verifySession';

export class addEvent extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '新增活動',
		tags: ['行事曆'],
		security: [{ sessionId: [] }],
		responses: {
			200: {
				description: '成功新增活動',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								message: {
									type: 'string',
									description: '成功訊息',
								},
							},
						},
					},
				},
			},
			400: {
				description: '錯誤的請求',
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

			const { id, title, description, date, office }: { id: string; title: string; description: string; date: string; office: string } =
				await ctx.req.json();
			if (!id || !title || !description || !date || !office) {
				return ctx.json({ error: 'Missing required fields' }, 400);
			}
			await env.DATABASE.prepare('INSERT INTO calendar (id, title, description, date, office) VALUES (?, ?, ?, ?, ?)')
				.bind(id, title, description, date, office)
				.run();
			return ctx.json({ message: 'successful' }, 200);
		} catch (error: any) {
			console.error('Error adding event:', error);
			return ctx.json({ error: error.message }, 500);
		}
	}
}
