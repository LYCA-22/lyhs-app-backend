import { AppContext } from '../..';
import { verifyJWT } from '../../utils/jwtTool';
import { hashPassword } from '../../utils/pswHash';
import { JWTPayload } from '../../types';
import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';

export class resetPassword extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '重設密碼',
		tags: ['密碼管理'],
		description: '提供使用者在忘記密碼的情況下重設密碼。',
		request: {
			body: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								token: {
									type: 'string',
									description: 'JWT token for password reset',
								},
								newPassword: {
									type: 'string',
									description: 'New password for the user',
								},
							},
							required: ['token', 'newPassword'],
						},
					},
				},
			},
		},
		responses: {
			200: {
				description: '密碼重設成功',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								message: {
									type: 'string',
									description: 'Success message',
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
								error: {
									type: 'string',
									description: 'Error message',
								},
							},
						},
					},
				},
			},
			401: {
				description: '無效的權杖',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
									description: 'Error message',
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
									description: 'Error message',
								},
							},
						},
					},
				},
			},
		},
	};

	async handle(ctx: AppContext) {
		try {
			const env = ctx.env;
			const JWT_SECRET = env.JWT_SECRET;
			const { token, newPassword }: { token: string; newPassword: string } = await ctx.req.json();
			if (!token) {
				return ctx.json({ error: 'Token is missing' }, 400);
			}
			const payload = (await verifyJWT(token, JWT_SECRET)) as JWTPayload | null;
			if (!payload) {
				return ctx.json({ error: 'Invalid token' }, 401);
			}
			const { email } = payload;
			if (!newPassword) {
				return ctx.json({ error: 'Missing new password' }, 400);
			}
			const hashedPassword = await hashPassword(newPassword);
			await env.DATABASE.prepare('UPDATE accountData SET password = ? WHERE email = ?').bind(hashedPassword, email).run();
			return ctx.json({ message: 'Password updated successfully' }, 200);
		} catch (error) {
			if (error instanceof Error) {
				console.error('Failed to reset password:', error.message);
				return ctx.json({ error: error.message }, 500);
			}
		}
	}
}
