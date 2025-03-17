import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';

export class addCase extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '新增報修案件',
		tags: ['校園資訊'],
		request: {
			body: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								title: { type: 'string' },
								description: { type: 'string' },
								category: { type: 'string' },
							},
							required: ['title', 'description', 'category'],
						},
					},
				},
			},
		},
		responses: {
			200: {
				description: '案件新增成功',
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
						},
					},
				},
			},
		},
	};

	async handle(ctx: AppContext) {
		const { title, description, category } = await ctx.req.json();
		const env = ctx.env;
		try {
			await env.DATABASE.prepare('INSERT INTO Repairs (title, description, category, status) VALUES (?, ?, ?, ?)')
				.bind(title, description, category, '已收到回報')
				.run();
			return ctx.json({ message: 'Case added successfully' }, 200);
		} catch (e) {
			if (e instanceof Error) {
				console.error(e.message);
				return ctx.json({ error: `Error in adding case: ${e.message}` }, 500);
			}
			console.error(e);
			return ctx.json({ error: 'Unknown error.' }, 500);
		}
	}
}
