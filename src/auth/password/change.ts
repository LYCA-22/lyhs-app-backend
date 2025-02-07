import { Env, UserChangePasswordData, userData, sessionKVData } from '../../types';
import { createResponse } from '../../index';
import { hashPassword } from '../index';

// 修改密碼
export async function changePassword(request: Request, env: Env) {
	const { DATABASE, sessionKV } = env;
	const { oldPassword, newPassword }: UserChangePasswordData = await request.json();

	if (!oldPassword || !newPassword) {
		return createResponse({ error: '未輸入新密碼與舊密碼' }, 400);
	}

	const authHeader = request.headers.get('Authorization');
	if (!authHeader) {
		return createResponse({ error: '找不到帳戶token，請重新登入後重試' }, 401);
	}

	const sessionId = authHeader.split(' ')[1];
	if (!sessionId) {
		return createResponse({ error: '無效的 token 格式' }, 401);
	}

	const user = (await sessionKV.get(sessionId, { type: 'json' })) as sessionKVData | null;
	if (!user) {
		return createResponse({ error: '無效的 session，請重新登入' }, 401);
	}

	// 獲取存儲的用戶信息
	const storedUser: userData | null = await DATABASE.prepare('SELECT * FROM accountData WHERE email = ?').bind(user.email).first();
	if (!storedUser) {
		return createResponse({ error: '找不到該用戶' }, 404);
	}

	// 驗證舊密碼
	const isPasswordCorrect = async (password: string, hashedPassword: string) => {
		const hashedInputPassword = await hashPassword(password);
		return hashedInputPassword === hashedPassword;
	};
	const isOldPasswordValid = await isPasswordCorrect(oldPassword, storedUser.password);
	if (!isOldPasswordValid) {
		return createResponse({ error: '舊密碼輸入錯誤' }, 400);
	}

	// 哈希新密碼並更新資料庫
	const hashedNewPassword = await hashPassword(newPassword);
	await DATABASE.prepare('UPDATE accountData SET password = ? WHERE email = ?').bind(hashedNewPassword, storedUser.email).run();

	return createResponse({ message: '密碼更新成功' }, 200);
}
