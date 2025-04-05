import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';

export class getDetailCase extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '獲取詳細資訊',
		tags: ['校園資訊'],
		parameters: [
			{
				name: 'id',
				in: 'query',
				required: true,
				schema: {
					type: 'string',
					format: 'uuid',
				},
			},
		],
		responses: {
			200: {
				description: '成功獲取詳細資訊',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								status: {
									type: 'string',
									enum: ['success', 'error'],
								},
								data: {
									type: 'object',
									properties: {
										id: {
											type: 'string',
											format: 'uuid',
										},
										title: {
											type: 'string',
										},
										description: {
											type: 'string',
										},
										status: {
											type: 'string',
											enum: ['pending', 'in_progress', 'completed'],
										},
										created_at: {
											type: 'string',
											format: 'date-time',
										},
										updated_at: {
											type: 'string',
											format: 'date-time',
										},
									},
								},
							},
						},
					},
				},
			},
			404: {
				description: '找不到該案件',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
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
			const id = ctx.req.query('id');
			if (!id) {
				return ctx.json({ error: 'Missing ID' }, 400);
			}
			const result = await env.DATABASE.prepare('SELECT * FROM Repairs WHERE id = ?').bind(id).all();

			if (!result) {
				return ctx.json({ error: 'Case Not Found' }, 404);
			}

			return ctx.json({ status: 'success', data: result }, 200);
		} catch (error) {
			if (error instanceof Error) {
				console.error(error);
				return ctx.json({ error: error.message });
			}
		}
	}
}
