import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../..';
import { userData } from '../../types';
import { hashPassword } from '../../utils/pswHash';

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
		const { email, password, name, Class, grade }: userData = await ctx.req.json();

		try {
			const existingUser = await env.DATABASE.prepare('SELECT * FROM accountData WHERE email = ?').bind(email).first();
			if (existingUser) {
				return ctx.json({ error: 'Account already exists' }, 409);
			}

			const userId = crypto.randomUUID();
			const hashedPassword = await hashPassword(password);

			await env.DATABASE.prepare(
				`
				INSERT INTO accountData (id, email, password, name, type, class, grade)
				VALUES (?, ?, ?, ?, ?, ?, ?)
			`,
			)
				.bind(userId, email, hashedPassword, name, 'normal', Class, grade)
				.run();

			return ctx.json({ message: 'User registered successfully' }, 200);
		} catch (error: unknown) {
			console.error('Error during registration:', error);
			const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
			return ctx.json({ error: `Error: ${errorMessage}` }, 500);
		}
	}
}
