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
					<!DOCTYPE html>
					<html lang="zh-TW">
					<head>
					    <meta charset="UTF-8">
					    <meta name="viewport" content="width=device-width, initial-scale=1.0">
					    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
					    <meta name="color-scheme" content="light">
					    <meta name="supported-color-schemes" content="light">
					    <title>重設密碼</title>
					    <style>
					        body {
					            background-color: #f9f9f9;
					            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
					            margin: 0;
					            padding: 0;
					            -webkit-text-size-adjust: none;
					            text-size-adjust: none;
					            color: #333333;
					        }

					        .container {
					            max-width: 600px;
					            margin: 20px auto;
					            background-color: #ffffff;
					            border-radius: 8px;
					            overflow: hidden;
					            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
					        }

					        .header {
					            background-color: #3B82F6;
					            padding: 20px;
					            text-align: center;
					        }

					        .logo {
					            font-size: 24px;
					            font-weight: bold;
					            color: #ffffff;
					            margin: 0;
					        }

					        .content {
					            padding: 30px;
					            line-height: 1.6;
					        }

					        .reset-button {
					            display: inline-block;
					            background-color: #3B82F6;
					            color: #ffffff !important;
					            text-decoration: none;
					            font-weight: 600;
					            padding: 12px 24px;
					            border-radius: 6px;
					            margin: 20px 0;
					            text-align: center;
					        }

					        .reset-link {
					            word-break: break-all;
					            color: #3B82F6;
					            margin-bottom: 20px;
					            display: block;
					        }

					        .footer {
					            background-color: #f5f5f5;
					            padding: 15px;
					            text-align: center;
					            font-size: 12px;
					            color: #6B7280;
					        }

					        .note {
					            font-size: 14px;
					            color: #6B7280;
					            font-style: italic;
					            margin-top: 20px;
					            padding-top: 15px;
					            border-top: 1px solid #eaeaea;
					        }
					    </style>
					</head>
					<body>
					    <div class="container">
					        <div class="header">
					            <h1 class="logo">LYHS Plus 重設密碼請求</h1>
					        </div>
					        <div class="content">
					            <p>您好，</p>

					            <p>我們收到了您的密碼重設請求。請點擊下方按鈕重設您的密碼：</p>

					            <a href="${resetUrl}" class="reset-button">重設密碼</a>

					            <p>如果上方按鈕無法點擊，請複製以下連結至瀏覽器：</p>

					            <a href="${resetUrl}" class="reset-link">${resetUrl}</a>

					            <p>此連結將在24小時後失效。若您未曾請求重設密碼，請忽略此郵件，您的帳戶安全不會受到影響。</p>

					            <p>如有任何問題，請聯繫我們的客服團隊。</p>

					            <p>謝謝！</p>

					            <p>LYHS+ 開發團隊敬上</p>

					            <p class="note">【此郵件由系統自動發送，請勿回覆】</p>
					        </div>
					        <div class="footer">
					            <p>© 2025 LYHS+ 版權所有</p>
					        </div>
					    </div>
					</body>
					</html>
        `;

			const response = await fetch('https://api.resend.com/emails', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					from: 'LYHS+ <noreply@lyhsca.org>',
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
