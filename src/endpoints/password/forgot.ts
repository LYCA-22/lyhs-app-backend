import { sign } from 'jsonwebtoken';
import { AppContext } from '../..';
import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';

export class forgotPassword extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '發送重設密碼郵件',
		description: '提供使用者在忘記密碼的情況下，重設密碼。',
		tags: ['密碼管理'],
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
									description: '使用者的電子郵件地址',
								},
							},
							required: ['email'],
						},
					},
				},
			},
		},
		responses: {
			400: {
				description: '請求格式錯誤',
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
							example: {
								error: 'Email is required',
							},
						},
					},
				},
			},
			404: {
				description: '使用者未找到',
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
							example: {
								error: 'User not found',
							},
						},
					},
				},
			},
			200: {
				description: '成功發送重設密碼郵件',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								message: {
									type: 'string',
									description: '成功訊息',
								},
							},
							required: ['message'],
							example: {
								message: 'Email sent successfully',
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
									description: '錯誤訊息',
								},
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
		const JWT_SECRET = env.JWT_SECRET;
		const apiKey = env.RESNED_APIKEY;
		const fromAddress = 'noreply@lyhsca.org';

		try {
			const { email }: { email: string } = await ctx.req.json();
			if (!email) {
				return ctx.json({ error: 'Email is required' }, 400);
			}

			const user = await env.DATABASE.prepare('SELECT * FROM accountData WHERE email = ?').bind(email).first();
			if (!user) {
				return ctx.json({ error: 'User not found' }, 404);
			}

			const payload = {
				email: user.email,
				exp: Math.floor(Date.now() / 1000) + 10 * 60,
			};
			const token = sign(payload, JWT_SECRET);

			const resetUrl = `https://auth.lyhsca.org/password/reset?token=${token}`;
			const emailContent = `
            <p>您好，</p>
            <p>請點擊以下連結來重設您的密碼：</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <p>此連結將在一段時間後失效。若您未曾請求重設密碼，請忽略此郵件。</p>
            <p>LYHS+ 開發團隊敬上</p>
            <p>【此郵件由系統自動發送，請勿回覆】</p>
        `;

			const response = await fetch('https://api.resend.com/emails', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					from: fromAddress,
					to: email,
					subject: 'LYHS+ 密碼重設請求',
					html: emailContent,
				}),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Send Email Error: ${errorText}`);
			}

			return ctx.json({ message: 'Email sent successfully' }, 200);
		} catch (error) {
			if (error instanceof Error) {
				console.error('Error in sending email:', error.message);
				return ctx.json({ error: `Error in sending email: ${error.message}` }, 500);
			}
			console.error('Unknown error:', error);
			return ctx.json({ error: 'Internal Server Error' }, 500);
		}
	}
}
