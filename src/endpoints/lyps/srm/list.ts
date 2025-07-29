import { AppContext } from '../../..';
import { verifySession } from '../../../utils/verifySession';
import { studentData, userData } from '../../../types';
import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { getUserById } from '../../../utils/getUserData';
import { globalErrorHandler } from '../../../utils/errorHandler';
import { errorHandler, KnownErrorCode } from '../../../utils/error';

export class getProjectList extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '獲取學權信箱列表',
		tags: ['學權信箱'],
		description: '獲取學權信箱列表需要等級為 L3 或 A1 的帳號。',
		responses: {
			200: {
				description: '成功獲取學權信箱列表',
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
											id: { type: 'string' },
											searchCode: { type: 'string' },
											title: { type: 'string' },
											status: { type: 'string' },
											createdTime: { type: 'string' },
											handler: { type: 'string' },
											email: { type: 'string' },
										},
									},
								},
							},
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
						},
					},
				},
			},
			404: {
				description: '找不到請求用戶帳號',
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
		try {
			const userId = await verifySession(ctx);
			const results = (await getUserById(userId as string, ctx)) as userData;

			const userLevel = results.level;
			if (userLevel !== 'A1' && userLevel !== 'L3') {
				throw new errorHandler(KnownErrorCode.FORBIDDEN);
			}

			const projectsList = await env.mailKV.list();
			const allProjects = [];

			for (const key of projectsList.keys) {
				const projectData = (await env.mailKV.get(key.name, { type: 'json' })) as studentData;
				if (projectData) {
					const simplifiedData = {
						id: projectData.id,
						searchCode: projectData.searchCode,
						title: projectData.title,
						status: projectData.status,
						createdTime: projectData.createdTime,
						handler: projectData.handler,
						email: projectData.email,
					};
					allProjects.push(simplifiedData);
				}
			}

			return ctx.json({ data: allProjects }, 200);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
