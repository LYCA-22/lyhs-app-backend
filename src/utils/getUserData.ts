import { AppContext } from '..';
import { RoleKey, userData, userDataRaw, UserRole } from '../types';
import { httpReturn, KnownErrorCode } from './error';

// 私有輔助函數：處理用戶數據轉換
function transformUserData(userRecord: userDataRaw): userData {
	// 處理角色轉換
	let roleNameArray: RoleKey[] = [];
	let roleValueArray: UserRole[] = [];
	let oauth: string[] = [];

	if (userRecord.role) {
		const roleKeys = userRecord.role
			.split(',')
			.map((r) => r.trim())
			.filter((r) => r in UserRole) as RoleKey[];

		roleNameArray = roleKeys;
		roleValueArray = roleKeys.map((key) => UserRole[key as keyof typeof UserRole]);
	}

	if (userRecord.oauth) {
		oauth = userRecord.oauth.split(',').map((o) => o.trim());
	}

	return {
		...userRecord,
		role: roleNameArray,
		roleName: roleValueArray,
		oauth: oauth,
	};
}

// 私有輔助函數：執行數據庫查詢
async function executeUserQuery(query: string, param: string, ctx: AppContext): Promise<userData | Response> {
	try {
		const queryResult = await ctx.env.DATABASE.prepare(query).bind(param).all();

		if (!queryResult.results || queryResult.results.length === 0) {
			return httpReturn(ctx, KnownErrorCode.USER_NOT_FOUND);
		}

		const userRecord = queryResult.results[0] as unknown as userDataRaw;
		console.log(userRecord);
		return transformUserData(userRecord);
	} catch (error) {
		console.error('Database error in user query:', {
			error: error instanceof Error ? error.message : 'Unknown error',
			query,
			param,
			timestamp: new Date().toISOString(),
		});
		return httpReturn(ctx, KnownErrorCode.DATABASE_QUERY_FAILED, {
			error: error instanceof Error ? error.message : 'Unknown error',
			query,
			param,
			timestamp: new Date().toISOString(),
		});
	}
}

// 公開函數：通過 ID 獲取用戶
export async function getUserById(userId: string, ctx: AppContext): Promise<userData | Response> {
	const query = 'SELECT id, name, email, type, level, class, grade, role, number, created_person, oauth FROM accountData WHERE id = ?';
	return executeUserQuery(query, userId, ctx);
}

// 公開函數：通過 Email 獲取用戶
export async function getUserByEmail(email: string, ctx: AppContext): Promise<userData | Response> {
	const query = 'SELECT id, name, email, type, level, class, grade, role, created_person, oauth FROM accountData WHERE email = ?';
	return executeUserQuery(query, email, ctx);
}
