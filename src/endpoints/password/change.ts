import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../..';
import { UserChangePasswordData, userData, sessionKVData } from '../../types';
import { hashPassword, verifyPassword } from '../../utils/hashPsw';
import { verifySession } from '../../utils/verifySession';

export class changePassword extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '變更密碼',
		description: '提供使用者在已登入的情況下修改密碼。',
		tags: ['密碼管理'],
		security: [{ sessionId: [] }],
		request: {
			body: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								oldPassword: { type: 'string' },
								newPassword: { type: 'string' },
							},
							required: ['oldPassword', 'newPassword'],
						},
					},
				},
			},
		},
		responses: {
			200: {
				description: '密碼修改成功',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								message: { type: 'string' },
							},
							required: ['message'],
							example: {
								message: 'Password updated successfully',
							},
						},
					},
				},
			},
			401: {
				description: '原密碼錯誤',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: { type: 'string' },
							},
							required: ['error'],
							example: {
								error: 'Incorrect Old Password',
							},
						},
					},
				},
			},
			404: {
				description: '使用者不存在',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: { type: 'string' },
							},
							required: ['error'],
							example: {
								error: 'User Not Found',
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
							required: ['error'],
							example: {
								error: 'Internal Server Error',
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
			const { oldPassword, newPassword }: UserChangePasswordData = await ctx.req.json();

			if (!oldPassword || !newPassword) {
				return ctx.json({ error: 'Information Missing' }, 400);
			}

			const result = await verifySession(ctx);
			if (result instanceof Response) {
				return result;
			}

			const storedUser: userData | null = await env.DATABASE.prepare('SELECT * FROM accountData WHERE id = ?').bind(result).first();
			if (!storedUser) {
				return ctx.json({ error: 'User Not Found' }, 404);
			}

			const isPasswordCorrect = async (password: string, hashedPassword: string) => {
				return await verifyPassword(password, hashedPassword);
			};
			const isOldPasswordValid = await isPasswordCorrect(oldPassword, storedUser.password);
			if (!isOldPasswordValid) {
				return ctx.json({ error: 'Incorrect Old Password' }, 401);
			}

			const hashedNewPassword = await hashPassword(newPassword);
			await env.DATABASE.prepare('UPDATE accountData SET password = ? WHERE email = ?').bind(hashedNewPassword, storedUser.email).run();

			return ctx.json({ message: 'Password updated successfully' }, 200);
		} catch (error) {
			if (error instanceof Error) {
				console.error('Error changing password:', error.message);
				return ctx.json({ error: `Error changing password: ${error.message}` }, 500);
			}
			console.error(error);
			return ctx.json({ error: 'Internal Server Error' }, 500);
		}
	}
}
