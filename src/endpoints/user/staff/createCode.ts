import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';
import { verifySession } from '../../../utils/verifySession';
import { globalErrorHandler } from '../../../utils/errorHandler';

export class createStaffCode extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '建立管理人員註冊代碼',
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
				description: '成功建立管理人員註冊代碼',
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
		const env = ctx.env;
		const { vuli, new_level } = await ctx.req.json();

		if (new_level === 'A1' || typeof vuli !== 'boolean') {
			return ctx.json({ error: 'Invalid level or information' }, 400);
		}

		try {
			const userId = await verifySession(ctx);

			const userData = await env.DATABASE.prepare(`SELECT level, email FROM accountData WHERE id = ?`)
				.bind(userId)
				.first<{ level: string; email: string }>();

			if (!userData) {
				return ctx.json({ error: 'User not found' }, 404);
			}

			const { level, email } = userData;

			if (level !== 'A1') {
				console.error('Unauthorized access attempt');
				return ctx.json({ error: 'Forbidden' }, 403);
			}

			const code = Array.from(crypto.getRandomValues(new Uint8Array(6)))
				.map((n) => n % 10)
				.join('');
			const codeData = {
				createUserId: userId,
				createUserEmail: email,
				vuli: vuli,
				level: new_level,
				user_number: vuli ? 10 : 1,
				registerCode: code,
			};

			await env.DATABASE.prepare(
				`INSERT INTO register_codes (created_userId, created_email, vuli, level, number, code)
				VALUES (?, ?, ?, ?, ?, ?)`,
			)
				.bind(codeData.createUserId, codeData.createUserEmail, codeData.vuli, codeData.level, codeData.user_number, codeData.registerCode)
				.run();
			return ctx.json({ code: code }, 200);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
