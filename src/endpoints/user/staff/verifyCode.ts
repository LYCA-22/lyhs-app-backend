import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';
import { codeData } from '../../../types';
import { globalErrorHandler } from '../../../utils/errorHandler';
import { errorHandler, KnownErrorCode } from '../../../utils/error';

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
			const { code } = await ctx.req.json();
			if (!code) {
				throw new errorHandler(KnownErrorCode.MISSING_REQUIRED_FIELDS);
			}

			const codeData = await env.DATABASE.prepare(`SELECT * FROM register_codes WHERE code = ?`).bind(code).first<codeData | null>();
			if (!codeData) {
				throw new errorHandler(KnownErrorCode.INVALID_STAFF_CODE);
			}

			return ctx.json({ code: code }, 200);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
