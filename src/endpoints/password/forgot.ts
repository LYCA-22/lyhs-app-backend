import { sign } from 'jsonwebtoken';
import { AppContext } from '../..';

export async function forgot(ctx: AppContext) {
	const env = ctx.env;
	const JWT_SECRET = env.JWT_SECRET;
	const apiKey = env.RESNED_APIKEY;
	const fromAddress = 'noreply@lyhsca.org';

	try {
		const { email }: { email: string } = await ctx.req.json();

		const user = await env.DATABASE.prepare('SELECT * FROM accountData WHERE email = ?').bind(email).first();
		if (!user) {
			return ctx.json({ error: '找不到該用戶' }, 404);
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

		return ctx.json({ message: '密碼重設郵件已發送' }, 200);
	} catch (error: any) {
		console.error('發送郵件錯誤:', error);
		return ctx.json({ error: `發送郵件失败: ${error.message}` }, 500);
	}
}
