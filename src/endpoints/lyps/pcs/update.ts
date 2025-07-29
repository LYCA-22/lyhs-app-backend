import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';
import { verifySession } from '../../../utils/verifySession';
import { getUserById } from '../../../utils/getUserData';
import { globalErrorHandler } from '../../../utils/errorHandler';

export class updatePcs extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '更新政見資料',
		tags: ['班聯會內部管理'],
		security: [{ sessionId: [] }],
		request: {
			body: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								id: {
									type: 'string',
								},
								status: { type: 'string' },
								final_status: { type: 'string' },
								public: { type: 'boolean' },
							},
						},
					},
				},
			},
		},
		responses: {
			200: {
				description: '更新政見成功',
			},
			400: {
				description: '缺少資料',
			},
			403: {
				description: '帳號權限不足',
			},
			500: {
				description: '伺服器內部錯誤',
			},
		},
	};

	async handle(ctx: AppContext) {
		const env = ctx.env;
		try {
			const { id, status, final_status, public: isPublic } = await ctx.req.json();
			if (!id || !status || !final_status || !isPublic) {
				return ctx.json({ error: 'Missing Data' }, 400);
			}

			const userId = await verifySession(ctx);

			const userData = await getUserById(userId as string, ctx);
			if (userData instanceof Response) {
				return userData;
			}
			if (!(userData.type !== 'stu' && (userData.level === 'A1' || userData.level === 'L3'))) {
				return new Response('Forbidden', { status: 403 });
			}

			await env.DATABASE.prepare('UPDATE policies SET status = ?, final_status = ?, public = ?, updated_at = ? WHERE id = ?')
				.bind(status, final_status, isPublic ? 1 : 0, new Date().toISOString(), id)
				.run();

			return ctx.json({ message: 'Update successfully' }, 200);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
