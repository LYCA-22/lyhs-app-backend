import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';
import { verifySession } from '../../../utils/verifySession';
import { studentData } from '../../../types';

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

		if (!code) {
			return ctx.json({ error: 'Code is missing' }, 400);
		}

		const result = await verifySession(ctx);
		if (result instanceof Response) {
			return result;
		}

		const { results } = await env.DATABASE.prepare('SELECT level, name FROM accountData WHERE id = ?').bind(result).all();
		if (!results || results.length === 0) {
			return ctx.json({ error: 'Invalid user' }, 404);
		}

		const userLevel = results[0].level;
		if (userLevel !== 'A1' && userLevel !== 'L3') {
			return ctx.json({ error: 'Permission denied' }, 403);
		}
		const userName = results[0].name;

		try {
			const projectData = (await env.mailKV.get(code, { type: 'json' })) as studentData;
			if (!projectData) {
				return ctx.json({ error: 'Invalid code' }, 404);
			}

			if (userLevel === 'A1') {
				return ctx.json(projectData, 200);
			}

			if (projectData.handler === '') {
				return ctx.json({ error: 'Project not assigned' }, 403);
			}

			if (projectData.handler !== userName) {
				return ctx.json({ error: 'Permission denied' }, 403);
			}

			return ctx.json({ data: projectData }, 200);
		} catch (e) {
			if (e instanceof Error) {
				console.error('Error during get project:', e.message);
				return ctx.json({ error: `Error: ${e.message}` }, 500);
			}
			console.error('Error during get project:', e);
			return ctx.json({ error: 'Internal server error' }, 500);
		}
	}
}
