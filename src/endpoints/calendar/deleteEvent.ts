import { OpenAPIRoute, OpenAPIRouterType, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../..';
import { verifySession } from '../../utils/verifySession';
import { globalErrorHandler } from '../../utils/errorHandler';
import { errorHandler, KnownErrorCode } from '../../utils/error';

export class deleteEvent extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '刪除活動',
		tags: ['行事曆'],
		security: [{ sessionId: [] }],
		responses: {
			200: {
				description: '成功刪除活動',
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
			const id = ctx.req.query('id');
			if (!id) {
				throw new errorHandler(KnownErrorCode.MISSING_REQUIRED_FIELDS);
			}
			await env.DATABASE.prepare('DELETE FROM calendar WHERE id = ?').bind(id).run();
			return ctx.json({ message: 'successful' }, 200);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
