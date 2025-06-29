import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';
import { verifySession } from '../../../utils/verifySession';
import { getUserById } from '../../../utils/getUserData';

export class AddPcs extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '新增政見資料',
		tags: ['班聯會內部管理'],
		security: [{ sessionId: [] }],
		request: {
			body: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								title: { type: 'string', description: '政見名稱' },
								description: { type: 'string', description: '政見說明' },
								progress: { type: 'number', description: '政見進度數值' },
								type: { type: 'string', description: '政見類型' },
							},
						},
					},
				},
			},
		},
		responses: {
			200: {
				description: '新增成功',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								message: { type: 'string', description: '新增成功訊息' },
							},
						},
					},
				},
			},
			400: {
				description: '請求格式錯誤',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: { type: 'string', description: '錯誤訊息' },
							},
						},
					},
				},
			},
			403: {
				description: '權限不足',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: { type: 'string', description: '錯誤訊息' },
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
								error: { type: 'string', description: '錯誤訊息' },
							},
						},
					},
				},
			},
		},
	};

	async handle(ctx: AppContext) {
		const env = ctx.env;
		const { title, description, progress, type }: { title: string; description: string; progress: number; type: string } =
			await ctx.req.json();

		if (!title || !description || !progress || !type) {
			return ctx.json({ error: 'Missing required fields' }, 400);
		}

		try {
			const userId = await verifySession(ctx);

			const results = await getUserById(userId as string, ctx);
			if (results instanceof Response) {
				return results;
			}

			const userData = results;
			if (userData.type !== 'staff') {
				return ctx.json({ error: 'Forbidden' }, 403);
			}

			const time = Date.now().toString();

			await env.DATABASE.prepare(
				`INSERT INTO policies (title, description, progress, type, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?)`,
			)
				.bind(title, description, progress, type, time, time)
				.run();

			return ctx.json({ message: 'PCS added successfully' }, 200);
		} catch (e) {
			if (e instanceof Error) {
				console.error(e);
				return ctx.json({ error: 'Error in Adding PCS: ' + e.message }, 500);
			}
		}
	}
}
