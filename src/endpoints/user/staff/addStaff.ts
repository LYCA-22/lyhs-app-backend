import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { codeData, userData } from '../../../types';
import { AppContext } from '../../..';
import { hashPassword } from '../../../utils/pswHash';

export class addStaff extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '管理人員帳號註冊',
		tags: ['管理人員帳號'],
		request: {
			body: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								code: { type: 'string' },
								email: { type: 'string' },
								name: { type: 'string' },
								password: { type: 'string' },
								Class: { type: 'string' },
								grade: { type: 'string' },
								role: { type: 'string' },
							},
							required: ['code', 'email', 'name', 'password', 'Class', 'grade', 'role'],
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
								message: { type: 'string' },
							},
							example: {
								message: 'User registered successfully',
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
							example: {
								error: 'Code is required',
							},
						},
					},
				},
			},
			404: {
				description: '無效的代碼',
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
			409: {
				description: '帳號已存在',
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
			const body = (await ctx.req.json()) as userData;
			const { code, email, name, password, Class, grade, role } = body;

			if (!code) {
				return ctx.json({ error: 'Code is required' }, 400);
			}

			const codeData = await env.DATABASE.prepare(`SELECT * FROM register_codes WHERE registerCode = ?`)
				.bind(code)
				.first<codeData | null>();
			if (!codeData) {
				return ctx.json({ error: 'Invalid code' }, 404);
			}

			const existingUser = await env.DATABASE.prepare('SELECT * FROM accountData WHERE email = ?').bind(email).first();
			if (existingUser) {
				return ctx.json({ error: 'The email already exists' }, 409);
			}

			const hashedPassword = await hashPassword(password);
			const userId = crypto.randomUUID();
			const auth_person = codeData.createUserEmail;

			await env.DATABASE.prepare(
				`
				INSERT INTO accountData (id, email, password, name, type, level, class, grade, role, auth_person)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`,
			)
				.bind(userId, email, hashedPassword, name, 'staff', codeData.level, Class, grade, role, auth_person)
				.run();

			if (codeData.vuli && codeData.user_number !== 1) {
				const newUserNumber = codeData.user_number - 1;
				await env.DATABASE.prepare(`UPDATE register_codes SET user_number = ? WHERE registerCode = ?`).bind(newUserNumber, code).run();
			} else {
				await env.DATABASE.prepare(`DELETE FROM register_codes WHERE registerCode = ?`).bind(code).run();
			}
			return ctx.json({ message: 'User registered successfully' }, 200);
		} catch (error) {
			if (error instanceof Error) {
				console.error('Error in addStaff', error.message);
				return ctx.json({ error: `Error in addStaff ${error.message}` }, 500);
			}
			console.error(error);
			return ctx.json({ error: 'Internal server error' }, 500);
		}
	}
}
