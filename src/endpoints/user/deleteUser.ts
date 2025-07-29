import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../..';
import { verifySession } from '../../utils/verifySession';
import { globalErrorHandler } from '../../utils/errorHandler';

export class DeleteUser extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '刪除帳號',
		tags: ['會員帳號'],
		security: [{ sessionId: [] }],
		responses: {
			200: {
				description: '帳號刪除成功',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								message: {
									type: 'string',
								},
							},
							required: ['message'],
							example: {
								message: 'Account deleted successfully',
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
							required: ['error'],
							example: {
								error: 'Internal server error',
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
			const userId = await verifySession(ctx);

			await env.DATABASE.prepare('DELETE FROM accountData WHERE id = ?').bind(userId).run();
			await env.sessionKV.delete(`user:${userId}:sessions`);

			return ctx.json({ message: 'Account deleted successfully' }, 200);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
