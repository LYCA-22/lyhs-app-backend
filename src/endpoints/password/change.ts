import { AppContext } from '../..';
import { UserChangePasswordData, userData, sessionKVData } from '../../types';
import { hashPassword } from '../../utils/pswHash';
import { verifySession } from '../../utils/verifySession';

// 修改密碼
export async function change(ctx: AppContext) {
	const env = ctx.env;
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
		const hashedInputPassword = await hashPassword(password);
		return hashedInputPassword === hashedPassword;
	};
	const isOldPasswordValid = await isPasswordCorrect(oldPassword, storedUser.password);
	if (!isOldPasswordValid) {
		return ctx.json({ error: 'Incorrect Old Password' }, 401);
	}

	const hashedNewPassword = await hashPassword(newPassword);
	await env.DATABASE.prepare('UPDATE accountData SET password = ? WHERE email = ?').bind(hashedNewPassword, storedUser.email).run();

	return ctx.json({ message: 'Password updated successfully' }, 200);
}
