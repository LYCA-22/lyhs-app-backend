import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';

export class deleteCase extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '刪除報修案件',
		tags: ['校園資訊'],
		parameters: [
			{
				name: 'id',
				in: 'path',
				required: true,
				description: '報修案件 ID',
				schema: { type: 'string' },
			},
		],
		responses: {
			200: {
				description: '成功刪除報修案件',
				content: {
					'application/json': {
						schema: { type: 'object', properties: { message: { type: 'string' } } },
					},
				},
			},
			400: {
				description: '缺少必要的報修案件 ID',
				content: {
					'application/json': {
						schema: { type: 'object', properties: { error: { type: 'string' } } },
					},
				},
			},
			404: {
				description: '找不到報修案件',
				content: {
					'application/json': {
						schema: { type: 'object', properties: { error: { type: 'string' } } },
					},
				},
			},
			500: {
				description: '內部伺服器錯誤',
				content: {
					'application/json': {
						schema: { type: 'object', properties: { error: { type: 'string' } } },
					},
				},
			},
		},
	};

	async handle(ctx: AppContext) {
		const env = ctx.env;
		try {
			const id = ctx.req.param('id');
			if (!id) {
				return ctx.json({ error: 'Missing necessary case ID' }, 400);
			}
			const checkResult = await env.DATABASE.prepare('SELECT id FROM repair_cases WHERE id = ?').bind(id).first();

			if (!checkResult) {
				return ctx.json({ error: 'Case not found' }, 404);
			}

			const result = await env.DATABASE.prepare('DELETE FROM repair_cases WHERE id = ?').bind(id).run();
			if (result.success) {
				return ctx.json({ message: 'Case deleted successfully' }, 200);
			} else {
				return ctx.json({ error: 'Failed to delete case' }, 500);
			}
		} catch (error) {
			console.error(error);
			return ctx.json({ error: 'Internal server error' }, 500);
		}
	}
}
