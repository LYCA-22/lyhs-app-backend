import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';
import { studentData } from '../../../types';

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
		if (!code) {
			return ctx.json({ error: 'Code is missing' }, 400);
		}

		try {
			const projectData = (await env.mailKV.get(code, { type: 'json' })) as studentData;
			if (!projectData) {
				return ctx.json({ error: 'Invalid code' }, 404);
			}
			return ctx.json({ data: projectData }, 200);
		} catch (e: any) {
			console.error('Error during view project:', e.message);
			return ctx.json({ error: `Error: ${e.message}` }, 500);
		}
	}
}
