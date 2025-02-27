import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';
import { codeData } from '../../../types';

export class verifyCode extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '驗證註冊人員代碼',
		tags: ['管理人員帳號'],
		request: {
			body: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								code: {
									type: 'string',
									description: '註冊人員代碼',
								},
							},
						},
					},
				},
			},
		},
		responses: {
			200: {
				description: '驗證成功',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								code: {
									type: 'string',
									description: '註冊人員代碼',
								},
							},
						},
					},
				},
			},
			400: {
				description: '代碼格式錯誤',
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
							example: {
								error: 'Code cannot be empty',
							},
						},
					},
				},
			},
			404: {
				description: '代碼不存在',
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
							example: {
								error: 'Invalid code',
							},
						},
					},
				},
			},
			500: {
				description: '發生不明錯誤',
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
			const body: { code: string } = await ctx.req.json();
			const code = body.code;
			if (!code) {
				return ctx.json({ error: 'Code cannot be empty' }, 400);
			}
			const codeData = await env.DATABASE.prepare(`SELECT * FROM register_codes WHERE registerCode = ?`)
				.bind(code)
				.first<codeData | null>();
			if (!codeData) {
				return ctx.json({ error: 'Invalid code' }, 404);
			}
			return ctx.json({ code: code }, 200);
		} catch (error) {
			if (error instanceof Error) {
				console.error('Error in verifyCode', error.message);
				return ctx.json({ error: `Error in verifyCode:${error.message}` }, 500);
			}
			console.error('Unknown error');
			return ctx.json({ error: 'Unknown error' }, 500);
		}
	}
}
