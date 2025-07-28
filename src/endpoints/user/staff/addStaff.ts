import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { codeData, userData } from '../../../types';
import { AppContext } from '../../..';
import { hashPassword } from '../../../utils/hashPsw';
import { globalErrorHandler } from '../../../utils/errorHandler';
import { errorHandler, KnownErrorCode } from '../../../utils/error';

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
			const body = await ctx.req.json();
			const { code, email, name, password, Class, grade, role } = body;

			if (!code || !email || !name || !password || !Class || !grade) {
				throw new errorHandler(KnownErrorCode.MISSING_REQUIRED_FIELDS);
			}

			const codeData = await env.DATABASE.prepare(`SELECT * FROM register_codes WHERE code = ?`).bind(code).first<codeData | null>();

			if (!codeData) {
				throw new errorHandler(KnownErrorCode.INVALID_STAFF_CODE);
			}

			const existingUser = await env.DATABASE.prepare('SELECT * FROM accountData WHERE email = ?').bind(email).first();
			if (existingUser) {
				throw new errorHandler(KnownErrorCode.USER_ALREADY_EXISTS);
			}

			const hashedPassword = await hashPassword(password);
			const created_person = codeData.create_email;
			let type = 'staff';

			await env.DATABASE.prepare(
				`
				INSERT INTO accountData (email, password, name, type, level, class, grade, role, created_person)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			`,
			)
				.bind(email, hashedPassword, name, type, codeData.level, Class, grade, role, '')
				.run();

			if (codeData.vuli && codeData.number !== 1) {
				const newUserNumber = codeData.number - 1;
				await env.DATABASE.prepare(`UPDATE register_codes SET number = ? WHERE code = ?`).bind(newUserNumber, code).run();
			} else {
				await env.DATABASE.prepare(`DELETE FROM register_codes WHERE code = ?`).bind(code).run();
			}

			return ctx.json({ message: 'User registered successfully' }, 200);
		} catch (error) {
			return globalErrorHandler(error as Error, ctx);
		}
	}
}
