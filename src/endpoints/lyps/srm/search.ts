import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';
import { studentData } from '../../../types';
import { globalErrorHandler } from '../../../utils/errorHandler';
import { errorHandler, KnownErrorCode } from '../../../utils/error';

export class searchMail extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '搜尋學權信箱信件',
		description: '此操作不需要任何身份驗證',
		tags: ['學權信箱'],
		responses: {
			200: {
				description: '信件搜尋成功',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								data: {
									type: 'object',
									properties: {
										id: { type: 'string' },
										searchCode: { type: 'string' },
										email: { type: 'string' },
										name: { type: 'string' },
										type: { type: 'string' },
										title: { type: 'string' },
										description: { type: 'string' },
										Class: { type: 'string' },
										number: { type: 'string' },
										solution: { type: 'string' },
										handler: { type: 'string' },
										status: { type: 'string' },
										createdTime: { type: 'string' },
										updatedTime: { type: 'string' },
									},
								},
							},
						},
					},
				},
			},
			400: {
				description: '缺少資訊',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: { type: 'string' },
							},
						},
					},
				},
			},
			404: {
				description: '信件不存在',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: { type: 'string' },
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
								error: { type: 'string' },
							},
						},
					},
				},
			},
		},
	};

	async handle(ctx: AppContext) {
		const env = ctx.env;
		const code = ctx.req.query('code');

		try {
			if (!code) {
				throw new errorHandler(KnownErrorCode.MISSING_REQUIRED_FIELDS);
			}

			const projectData = (await env.mailKV.get(code, { type: 'json' })) as studentData;
			if (!projectData) {
				throw new errorHandler(KnownErrorCode.PCS_PROJECT_NOT_FOUND);
			}
			return ctx.json({ data: projectData }, 200);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
