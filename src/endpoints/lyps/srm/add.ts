import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';
import { studentData } from '../../../types';
import { checkService } from '../../../utils/checkService';
import { globalErrorHandler } from '../../../utils/errorHandler';

export class addProject extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '新增信件',
		tags: ['學權信箱'],
		request: {
			body: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								email: {
									type: 'string',
									format: 'email',
								},
								name: {
									type: 'string',
								},
								class: {
									type: 'string',
								},
								number: {
									type: 'string',
								},
								title: {
									type: 'string',
								},
								description: {
									type: 'string',
								},
								type: {
									type: 'string',
								},
								solution: {
									type: 'string',
								},
							},
							required: ['email', 'name', 'type', 'title', 'description', 'class', 'number', 'solution'],
						},
					},
				},
			},
		},
		responses: {
			201: {
				description: '新增成功',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								code: {
									type: 'string',
								},
							},
						},
					},
				},
			},
			400: {
				description: '請求參數錯誤',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
								},
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
								error: {
									type: 'string',
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
		const { email, name, type, title, description, Class, number, solution }: studentData = await ctx.req.json();

		if (!email || !name || !type || !title || !description || !Class || !number || !solution) {
			return ctx.json({ error: 'Information missing' }, 400);
		}

		try {
			await checkService('stu_mail', ctx);

			const code = Array.from(crypto.getRandomValues(new Uint8Array(6)))
				.map((n) => n % 10)
				.join('');
			const projectId = crypto.randomUUID();
			const createdTime = new Date().toISOString();
			const updatedTime = createdTime;

			const projectData = JSON.stringify({
				id: projectId,
				searchCode: code,
				email: email,
				name: name,
				class: Class,
				number: number,
				title: title,
				description: description,
				type: type,
				solution: solution,
				handler: '',
				status: '已接收到案件回報。',
				createdTime: createdTime,
				updatedTime: updatedTime,
			});
			await env.mailKV.put(code, projectData);
			return ctx.json({ code: code }, 201);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
