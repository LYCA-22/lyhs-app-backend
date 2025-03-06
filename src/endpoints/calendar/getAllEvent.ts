import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../..';

export class getAllEvents extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '獲取林園高中所有活動',
		tags: ['行事曆'],
		responses: {
			200: {
				description: '獲取行事曆成功',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								data: {
									type: 'object',
									properties: {
										success: {
											type: 'boolean',
											description: '操作是否成功',
										},
										meta: {
											type: 'object',
											properties: {
												served_by: { type: 'string' },
												served_by_region: { type: 'string' },
												served_by_primary: { type: 'boolean' },
												timings: {
													type: 'object',
													properties: {
														sql_duration_ms: { type: 'number' },
													},
												},
												duration: { type: 'number' },
												changes: { type: 'number' },
												last_row_id: { type: 'number' },
												changed_db: { type: 'boolean' },
												size_after: { type: 'number' },
												rows_read: { type: 'number' },
												rows_written: { type: 'number' },
												result: {
													type: 'array',
													items: {
														type: 'object',
														properties: {
															id: { type: 'string' },
															title: { type: 'string' },
															description: { type: 'string' },
															date: { type: 'string' },
															office: { type: 'string' },
														},
													},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
			500: {
				description: '發生錯誤',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: { type: 'string' },
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
			const statement = await env.DATABASE.prepare('SELECT * FROM calendar').all();
			return ctx.json({ data: statement }, 200);
		} catch (error: any) {
			console.error('Error fetching events:', error);
			return ctx.json({ error: error.message }, 500);
		}
	}
}
