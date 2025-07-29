import { AppContext } from '../../..';
import { verifySession } from '../../../utils/verifySession';
import { studentData } from '../../../types';
import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { globalErrorHandler } from '../../../utils/errorHandler';
import { errorHandler, KnownErrorCode } from '../../../utils/error';

export class deleteProject extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '刪除信件',
		tags: ['學權信箱'],
		description: '此操作僅限於學權信箱的承辦人或 A1 等級用戶',
		security: [{ sessionId: [] }],
		responses: {
			200: {
				description: '信件已成功刪除',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								message: { type: 'string' },
							},
							required: ['message'],
						},
					},
				},
			},
			400: {
				description: '缺少必要的參數',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: { type: 'string' },
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
								error: { type: 'string' },
							},
							required: ['error'],
						},
					},
				},
			},
			404: {
				description: '找不到信件',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: { type: 'string' },
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
								error: { type: 'string' },
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
			const userId = await verifySession(ctx);

			const code = ctx.req.query('code');
			if (!code) {
				throw new errorHandler(KnownErrorCode.MISSING_REQUIRED_FIELDS);
			}

			const { results } = await env.DATABASE.prepare('SELECT level FROM accountData WHERE id = ?').bind(userId).all();
			if (!results || results.length === 0) {
				throw new errorHandler(KnownErrorCode.USER_NOT_FOUND);
			}

			const projectData = (await env.mailKV.get(code, { type: 'json' })) as studentData;
			if (!projectData) {
				throw new errorHandler(KnownErrorCode.SRM_RESOURCE_NOT_FOUND);
			}

			if (projectData.handler === '') {
				const userLevel = results[0].level;
				if (userLevel === 'A1') {
					await env.mailKV.delete(code);
					return ctx.json({ message: 'Project deleted successfully' }, 200);
				} else {
					throw new errorHandler(KnownErrorCode.FORBIDDEN);
				}
			} else {
				if (projectData.handler === userId || results[0].level === 'A1') {
					await env.mailKV.delete(code);
					return ctx.json({ message: 'Project deleted successfully' }, 200);
				} else {
					throw new errorHandler(KnownErrorCode.FORBIDDEN);
				}
			}
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
