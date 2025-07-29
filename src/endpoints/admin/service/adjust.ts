import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';
import { globalErrorHandler } from '../../../utils/errorHandler';
import { verifySession } from '../../../utils/verifySession';
import { getUserById } from '../../../utils/getUserData';
import { errorHandler, KnownErrorCode } from '../../../utils/error';

export class adjustService extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '更新服務狀態',
		description: '此操作僅限擁有管理權限(A1)的帳號。',
		tags: ['系統管理'],
		request: {
			body: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								name: {
									type: 'string',
								},
								status: {
									type: 'integer',
								},
							},
							required: ['name', 'status'],
						},
					},
				},
			},
		},
	};
	async handle(ctx: AppContext) {
		try {
			const { name, status } = await ctx.req.json();
			const userId = (await verifySession(ctx)) as string;
			const { results } = await ctx.env.DATABASE.prepare('SELECT level FROM accountData WHERE id = ?').bind(userId).all();
			if (!results || results.length === 0) {
				return ctx.json({ error: 'Invalid user' }, 404);
			}

			const level = results[0].level;
			if (level !== 'A1') {
				throw new errorHandler(KnownErrorCode.FORBIDDEN);
			}

			await ctx.env.DATABASE.prepare('UPDATE services SET status = ? WHERE name = ?').bind(status, name).run();
			return ctx.json({ message: 'Service status updated successfully' }, 200);
		} catch (error) {
			return globalErrorHandler(error as Error, ctx);
		}
	}
}
