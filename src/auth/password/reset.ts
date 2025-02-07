import { Env, UserChangePasswordData } from '../../types';
import { createResponse } from '../../index';
import { hashPassword, verifyJWT } from '../index';

interface JWTPayload {
	email: string;
	exp: number | string;
}

export async function resetPassword(request: Request, env: Env) {
	try {
		const { DATABASE } = env;
		const JWT_SECRET = env.JWT_SECRET;
		const { token, newPassword }: { token: string; newPassword: string } = await request.json();
		if (!token) {
			return createResponse({ error: '缺少 token' }, 400);
		}
		const payload = (await verifyJWT(token, JWT_SECRET)) as JWTPayload | null;
		if (!payload) {
			return createResponse({ error: '無效的 token' }, 401);
		}
		const { email } = payload;
		if (!newPassword) {
			return createResponse({ error: '缺少新密碼' }, 400);
		}
		const hashedPassword = await hashPassword(newPassword);
		await DATABASE.prepare('UPDATE accountData SET password = ? WHERE email = ?').bind(hashedPassword, email).run();
		return createResponse({ message: '密碼更新成功' }, 200);
	} catch (e: any) {
		console.error('Failed to reset password:', e);
		return createResponse({ error: e.message }, 500);
	}
}
