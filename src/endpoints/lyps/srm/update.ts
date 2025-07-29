import { AppContext } from '../../..';
import { verifySession } from '../../../utils/verifySession';
import { studentData } from '../../../types';
import { OpenAPIRoute, OpenAPIRouterType, OpenAPIRouteSchema } from 'chanfana';
import { globalErrorHandler } from '../../../utils/errorHandler';
import { errorHandler, KnownErrorCode } from '../../../utils/error';

export class updateProject extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '更新學權信箱資訊',
		description: '更新學權信箱的處理者和狀態',
		tags: ['學權信箱'],
		security: [{ sessionId: [] }],
		request: {
			body: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								code: { type: 'string' },
								handler: { type: 'string' },
								status: { type: 'string' },
							},
							required: ['code', 'handler', 'status'],
						},
					},
				},
			},
		},
		responses: {
			200: {
				description: '更新成功',
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
				description: '資料不完整',
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
				description: '無此學權信箱',
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
		const { code, handler, status }: { code: string; handler: string; status: string } = await ctx.req.json();
		if (!code || !handler || !status) {
			throw new errorHandler(KnownErrorCode.MISSING_REQUIRED_FIELDS);
		}

		try {
			await verifySession(ctx);

			const projectData = (await env.mailKV.get(code, { type: 'json' })) as studentData;
			if (!projectData) {
				return ctx.json({ error: 'Invalid code' }, 404);
			}
			projectData.handler = handler;
			projectData.status = status;
			projectData.updatedTime = new Date().toISOString();
			await env.mailKV.put(code, JSON.stringify(projectData));
			return ctx.json({ message: 'Project updated successfully' }, 200);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
