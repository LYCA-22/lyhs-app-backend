import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';
import { verifySession } from '../../../utils/verifySession';
import { studentData } from '../../../types';
import { globalErrorHandler } from '../../../utils/errorHandler';
import { errorHandler, KnownErrorCode } from '../../../utils/error';

export class getMailDetail extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '獲取學權信箱詳細資訊',
		description: '此操作僅限系統管理員操作',
		tags: ['學權信箱'],
		security: [{ sessionId: [] }],
		responses: {
			200: {
				description: '成功獲取學權信箱詳細資訊',
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
				description: '缺少代碼資訊',
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
			403: {
				description: '權限不足',
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
			404: {
				description: '項目不存在',
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
			500: {
				description: '伺服器錯誤',
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
		const code = ctx.req.query('code');

		try {
			if (!code) {
				throw new errorHandler(KnownErrorCode.MISSING_REQUIRED_FIELDS);
			}

			const userId = await verifySession(ctx);

			const { results } = await env.DATABASE.prepare('SELECT level, name FROM accountData WHERE id = ?').bind(userId).all();
			if (!results || results.length === 0) {
				throw new errorHandler(KnownErrorCode.USER_NOT_FOUND);
			}

			const userLevel = results[0].level;
			if (userLevel !== 'A1' && userLevel !== 'L3') {
				throw new errorHandler(KnownErrorCode.FORBIDDEN);
			}
			const userName = results[0].name;

			const projectData = (await env.mailKV.get(code, { type: 'json' })) as studentData;
			if (!projectData) {
				throw new errorHandler(KnownErrorCode.SRM_RESOURCE_NOT_FOUND);
			}

			if (userLevel === 'A1') {
				return ctx.json(projectData, 200);
			}

			if (projectData.handler === '') {
				throw new errorHandler(KnownErrorCode.UNKNOWN_ERROR);
			}

			if (projectData.handler !== userName) {
				throw new errorHandler(KnownErrorCode.FORBIDDEN);
			}

			return ctx.json({ data: projectData }, 200);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
