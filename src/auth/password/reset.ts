import { Env, UserChangePasswordData } from '../../types';
import { createResponse } from '../../index';
import { hashPassword, verifyJWT } from '../index';

interface JWTPayload {
	email: string;
	exp: number | string;
}

export async function resetPassword(request: Request, env: Env) {
	const { DATABASE, JWT_SECRET } = env;
	const params = new URL(request.url).searchParams;
	const token = params.get('token');

	if (!token) {
		return createResponse({ error: '缺少 token' }, 400);
	}

	const payload = (await verifyJWT(token, JWT_SECRET)) as JWTPayload | null;
	if (!payload) {
		return createResponse({ error: '無效的 token' }, 401);
	}

	const { email } = payload;
	const { newPassword } = (await request.json()) as UserChangePasswordData;

	if (!newPassword) {
		return createResponse({ error: '請輸入新密碼' }, 400);
	}

	const hashedPassword = await hashPassword(newPassword);

	await DATABASE.prepare('UPDATE accountData SET password = ? WHERE email = ?').bind(hashedPassword, email).run();

	return createResponse({ message: '密碼更新成功' }, 200);
}
