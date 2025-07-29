import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../..';
import { verifySession } from '../../utils/verifySession';
import { getUserById } from '../../utils/getUserData';
import { userData } from '../../types';
import { globalErrorHandler } from '../../utils/errorHandler';

export class UpdateEvent extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '更新行事曆事件',
		tags: ['行事曆'],
		request: {
			body: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								id: {
									type: 'string',
									description: '事件ID',
								},
								title: {
									type: 'string',
									description: '事件標題',
								},
								description: {
									type: 'string',
									description: '事件描述',
								},
								date: {
									type: 'string',
									description: '事件日期',
								},
								office: {
									type: 'string',
									description: '辦公室',
								},
							},
							required: ['id', 'title', 'description', 'date', 'office'],
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
								message: {
									type: 'string',
									description: '更新成功訊息',
								},
							},
							required: ['message'],
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
		const { id, title, description, date, office }: { id: string; title: string; description: string; date: string; office: string } =
			await ctx.req.json();
		try {
			const userId = await verifySession(ctx);
			if (userId instanceof Response) {
				return userId;
			}
			const userData: userData | Response = await getUserById(userId as string, ctx);
			if (userData instanceof Response) {
				return userData;
			}
			if (userData.type !== 'staff') {
				return ctx.json({ error: 'User not authorized' }, 403);
			}
			await env.DATABASE.prepare('UPDATE calendar SET title = ?, description = ?, date = ?, office=? WHERE id = ?')
				.bind(title, description, date, office, id)
				.run();
			return ctx.json({ message: 'Event update successful' }, 200);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
