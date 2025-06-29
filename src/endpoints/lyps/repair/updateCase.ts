import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';
import { verifySession } from '../../../utils/verifySession';
import { getUserById } from '../../../utils/getUserData';
import { userData } from '../../../types';

export class updateCase extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '更新報修案件',
		tags: ['校園資訊'],
		request: {
			body: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								id: { type: 'string' },
								status: { type: 'string' },
							},
							required: ['id', 'status'],
						},
					},
				},
			},
		},
		responses: {
			200: {
				description: '案件更新成功',
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
			401: {
				description: '未授權',
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
			500: {
				description: '內部伺服器錯誤',
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
		},
	};

	async handle(ctx: AppContext) {
		const env = ctx.env;
		const { status, id } = await ctx.req.json();

		try {
			const userId = await verifySession(ctx);
			if (userId instanceof Response) {
				return userId;
			}
			const userData: userData | Response = await getUserById(userId as string, ctx);
			if (userData instanceof Response) {
				return userData;
			}
			if (!(userData.type !== 'stu' && (userData.level === 'A1' || userData.level === 'S1'))) {
				return new Response('Unauthorized', { status: 401 });
			}

			await env.DATABASE.prepare('UPDATE Repairs SET status = ? WHERE id = ?').bind(status, id).run();
			return ctx.json({ message: 'Case updated successfully' }, 200);
		} catch (error) {
			console.error(error);
			return new Response('Internal Server Error', { status: 500 });
		}
	}
}
