import { OpenAPIRoute, OpenAPIRouterType, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../..';
import { verifySession } from '../../utils/verifySession';
import { globalErrorHandler } from '../../utils/errorHandler';
import { errorHandler, KnownErrorCode } from '../../utils/error';

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
			await verifySession(ctx);

			const {
				title,
				description,
				start_time,
				end_time,
				office,
				all_day,
				location,
			}: { title: string; description: string; start_time: string; end_time: string; office: string; all_day: boolean; location: string } =
				await ctx.req.json();
			if (!id || !title || !description || !date || !office) {
				throw new errorHandler(KnownErrorCode.MISSING_REQUIRED_FIELDS);
			}
			await env.DATABASE.prepare('INSERT INTO calendar (id, title, description, date, office) VALUES (?, ?, ?, ?, ?)')
				.bind(id, title, description, date, office)
				.run();
			return ctx.json({ message: 'successful' }, 200);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
