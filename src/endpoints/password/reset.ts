import { AppContext } from '../..';
import { verifyJWT } from '../../utils/jwtTool';
import { hashPassword } from '../../utils/pswHash';

interface JWTPayload {
	email: string;
	exp: number | string;
}

export async function reset(ctx: AppContext) {
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
