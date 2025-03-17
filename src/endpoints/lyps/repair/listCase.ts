import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';

export class listCases extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '列出所有報修案件',
		tags: ['校園資訊'],
		responses: {
			200: {
				description: '成功獲取列表',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								status: { type: 'string' },
								data: { type: 'array', items: { type: 'object' } },
							},
						},
					},
				},
			},
			500: {
				description: '內部伺服器錯誤',
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
			const caseData = await env.DATABASE.prepare('SELECT * FROM Repairs ORDER BY created_at DESC').all();
			return ctx.json({ status: 'success', data: caseData.results }, 200);
		} catch (error) {
			console.error(error);
			return ctx.json({ error: 'Internal Server Error' }, 500);
		}
	}
}
