import { OpenAPIRoute, OpenAPIRouteSchema, Uuid } from 'chanfana';
import { AppContext } from '../..';
import { userData, userDataRaw } from '../../types';
import { hashPassword } from '../../utils/hashPsw';
import { globalErrorHandler } from '../../utils/errorHandler';
import { errorHandler, KnownErrorCode } from '../../utils/error';

export class userRegister extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '帳號註冊',
		tags: ['會員帳號'],
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
								password: {
									type: 'string',
								},
								name: {
									type: 'string',
									minLength: 2,
									maxLength: 100,
								},
								Class: {
									type: 'string',
									minLength: 2,
									maxLength: 100,
								},
								grade: {
									type: 'string',
									minLength: 2,
									maxLength: 100,
								},
							},
						},
					},
				},
			},
		},
		responses: {
			200: {
				description: '註冊成功',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								message: {
									type: 'string',
								},
							},
							example: {
								message: 'User registered successfully',
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
								message: {
									type: 'string',
								},
							},
							example: {
								message: 'Internal server error',
							},
						},
					},
				},
			},
		},
	};

	async handle(ctx: AppContext) {
		const env = ctx.env;
		const { email, password, name, Class, grade, number, stu_id }: userData = await ctx.req.json();

		try {
			const existingUser = await env.DATABASE.prepare('SELECT * FROM accountData WHERE email = ?').bind(email).first();
			if (existingUser) {
				throw new errorHandler(KnownErrorCode.USER_ALREADY_EXISTS);
			}

			const hashedPassword = await hashPassword(password);

			await env.DATABASE.prepare(
				`
				INSERT INTO accountData (email, password, name, number, type, class, grade, stu_id, oauth)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			`,
			)
				.bind(email, hashedPassword, name, number, 'stu', Class, grade, stu_id, `GOOGLE`)
				.run();

			return ctx.json({ message: 'User registered successfully' }, 200);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
