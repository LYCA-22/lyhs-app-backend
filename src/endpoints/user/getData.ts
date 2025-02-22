import { AppContext } from '../..';
import { userData } from '../../types';
import { veritySession } from '..';

export async function getUserData(ctx: AppContext) {
	try {
		// 呼叫 veritySession 進行 token 驗證
		const result = await veritySession(ctx);
		// 若 veritySession 回傳的是 Response 物件，代表驗證失敗，直接回傳該錯誤訊息
		if (result instanceof Response) {
			return result;
		}
		const userId = result as string;

		// 從資料庫中取得用戶資料
		const user = (await ctx.env.DATABASE.prepare(
			'SELECT id, name, email, type, level, class, grade, role, auth_person FROM accountData WHERE id = ?',
		)
			.bind(userId)
			.first()) as userData;

		if (!user) {
			return ctx.json({ error: 'User not found' }, 404);
		}

		return ctx.json({ data: user }, 200);
	} catch (error) {
		if (error instanceof Error) {
			console.error('Error fetching user data:', error);
			return ctx.json({ error: `Error: ${error.message}` }, 500);
		}
		return ctx.json({ error: 'Unknown error' }, 500);
	}
}
