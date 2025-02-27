import { AppContext } from '../../..';
import { verifySession } from '../../../utils/verifySession';
import { codeData } from '../../../types';
import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';

export class listCode extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '列出所有管理人員註冊代碼',
		tags: ['管理人員帳號'],
		security: [
			{
				sessionId: [],
			},
		],
		responses: {
			'200': {
				description: '獲取資料成功',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								data: {
									type: 'array',
									items: {
										type: 'object',
										properties: {
											createUserId: { type: 'string', example: 'user123' },
											createUserEmail: {
												type: 'string',
												example: 'user@example.com',
											},
											vuli: { type: 'boolean', example: true },
											level: {
												type: 'string',
												example: 'admin',
											},
											user_number: {
												type: 'number',
												example: 123456,
											},
											createdTime: { type: 'string', example: '2023-01-01T00:00:00Z' },
											registerCode: { type: 'string', example: 'ABC123', minLength: 6, maxLength: 10 },
										},
									},
								},
							},
						},
					},
				},
			},
			'403': {
				description: '帳號權限不夠',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
									example: 'Forbidden',
								},
							},
						},
					},
				},
			},
			'404': {
				description: '找不到用戶資料',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
									example: 'User not found',
								},
							},
						},
					},
				},
			},
			'500': {
				description: '伺服器錯誤',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
									example: 'Internal server error',
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
			if (result instanceof Response) {
				return result;
			}

			const userData = await env.DATABASE.prepare(`SELECT level, email FROM accountData WHERE id = ?`)
				.bind(result)
				.first<{ level: string; email: string }>();

			if (!userData) {
				console.error('User not found');
				return ctx.json({ error: 'User not found' }, 404);
			}

			if (userData.level !== 'A1') {
				console.error('Unauthorized access attempt');
				return ctx.json({ error: 'Forbidden' }, 403);
			}

			const allCodeData = await env.DATABASE.prepare(`SELECT * FROM register_codes`).all<codeData[]>();

			return ctx.json({ data: allCodeData }, 200);
		} catch (error) {
			console.error('Server error:', error);
			return ctx.json({ error: 'Internal server error' }, 500);
		}
	}
}
