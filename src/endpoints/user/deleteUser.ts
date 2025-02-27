import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../..';
import { verifySession } from '../../utils/verifySession';

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
			const result = await verifySession(ctx);
			if (result instanceof Response) {
				return result;
			}

			await env.DATABASE.prepare('DELETE FROM accountData WHERE id = ?').bind(result).run();
			await env.sessionKV.delete(`user:${result}:sessions`);
			return ctx.json({ message: 'Account deleted successfully' }, 200);
		} catch (error) {
			if (error instanceof Error) {
				console.log('Error in deleting user:', error.message);
				return ctx.json({ error: `Error in deleting user: ${error.message}` }, 500);
			}
			return ctx.json({ error: 'Unknown error' }, 500);
		}
	}
}
