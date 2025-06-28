import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';
import { verifySession } from '../../../utils/verifySession';

export class deleteStaffCode extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '刪除管理人員註冊代碼',
		tags: ['管理人員帳號'],
		security: [
			{
				sessionId: [],
			},
		],
		requestBody: {
			content: {
				'application/json': {
					schema: {
						type: 'object',
						properties: {
							vuli: {
								type: 'boolean',
								example: true,
							},
							level: {
								type: 'string',
								example: 'L1',
							},
						},
						required: ['vuli', 'level'],
					},
				},
			},
		},
		responses: {
			'200': {
				description: '成功刪除管理人員註冊代碼',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								code: {
									type: 'string',
									example: 'ABC123',
								},
							},
						},
					},
				},
			},
			'400': {
				description: '請求資料格式錯誤',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
									example: 'Invalid level or information',
								},
							},
						},
					},
				},
			},
			'403': {
				description: '帳號等級權限不足',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
									example: 'Unauthorized',
								},
							},
						},
					},
				},
			},
			'404': {
				description: '請求帳號不存在',
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
				description: '發生不明錯誤',
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
		const code = ctx.req.query('code');
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
				return ctx.json({ error: 'User not found' }, 404);
			}

			const { level } = userData;

			if (level !== 'A1') {
				console.error('Unauthorized access attempt');
				return ctx.json({ error: 'Forbidden' }, 403);
			}

			// 檢查註冊代碼是否存在
			const existingCode = await env.DATABASE.prepare(`SELECT registerCode FROM register_codes WHERE registerCode = ?`)
				.bind(code)
				.first<{ registerCode: string }>();

			if (!existingCode) {
				return ctx.json({ error: 'Registration code not found' }, 404);
			}

			// 刪除註冊代碼
			await env.DATABASE.prepare(`DELETE FROM register_codes WHERE registerCode = ?`).bind(code).run();
			return ctx.json(
				{
					message: '註冊代碼已成功刪除',
					deletedCode: code,
				},
				200,
			);
		} catch (e) {
			if (e instanceof Error) {
				console.error('Error creating code:', e);
				return ctx.json({ error: e.message }, 500);
			}
			console.error('Unexpected error:', e);
			return ctx.json({ error: 'Internal server error' }, 500);
		}
	}
}
