import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../..';
import { verifySession } from '../../utils/verifySession';

export class getUserNum extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '獲取使用者數量',
		description: '此操作僅限擁有管理權限的帳號。',
		tags: ['系統管理'],
		security: [{ sessionId: [] }],
		responses: {
			200: {
				description: '成功獲取使用者帳號數量',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								data: {
									type: 'object',
									properties: {
										'COUNT(*)': {
											type: 'number',
											description: '使用者帳號數量',
										},
									},
									required: ['userNum'],
								},
							},
							required: ['data'],
						},
					},
				},
			},
			500: {
				description: '伺服器內部錯誤',
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
							required: ['error'],
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
			const userNum = await env.DATABASE.prepare('SELECT COUNT(*) FROM accountData').first();
			return ctx.json({ data: userNum }, 200);
		} catch (error) {
			if (error instanceof Error) {
				console.error(error.message);
				return ctx.json({ error: `Error in getUserNum: ${error.message}` }, 500);
			}
			console.error(error);
			return ctx.json({ error: 'Internal Server Error' }, 500);
		}
	}
}
