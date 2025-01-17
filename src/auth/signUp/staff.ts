import { createResponse } from '../../index';
import { hashPassword } from '../index';
import { Env, userData, codeData } from '../../types';

// 產生Staff授權碼
export async function createStaffCode(request: Request, env: Env) {
	const { DATABASE, KV, StaffKV } = env;

	// 驗證請求格式
	const sessionId = request.headers.get('Authorization');
	if (!sessionId?.startsWith('Bearer ')) {
		console.error('SessionId is missing or malformed');
		return createResponse({ error: 'SessionId is missing or malformed' }, 400);
	}

	// 驗證請求體
	let vuli: boolean;
	let new_level: string;
	try {
		const body: { vuli: boolean; level: string } = await request.json();
		vuli = body.vuli;
		if (body.level === 'A1') {
			return createResponse({ error: '授權碼權限過高，無法完成請求。' }, 400);
		}
		new_level = body.level;
		if (typeof vuli !== 'boolean') {
			throw new Error('Invalid vl parameter');
		}
	} catch (error) {
		console.error('Invalid request body', error);
		return createResponse({ error: 'Invalid request body' }, 400);
	}

	const token = sessionId.slice(7);

	try {
		const sessionData = await KV.get(token, { type: 'json' });

		// sessionData 是否存在
		if (!sessionData) {
			console.error(`Invalid or expired token: ${token}`); // 添加日志
			return createResponse({ error: 'Invalid or expired token' }, 401);
		}

		const { userId } = sessionData as { userId: string };

		// 獲取用戶資訊
		const userData = await DATABASE.prepare(`SELECT level, email FROM accountData WHERE id = ?`)
			.bind(userId)
			.first<{ level: string; email: string }>();

		if (!userData) {
			console.error('User not found');
			return createResponse({ error: 'User not found' }, 404);
		}
		const { level, email } = userData;

		if (level !== 'A1') {
			console.error('Unauthorized access attempt');
			return createResponse({ error: 'Unauthorized' }, 403);
		}

		// 創建邀請碼
		const code = Array.from(crypto.getRandomValues(new Uint8Array(6)))
			.map((n) => n % 10)
			.join('');
		const codeData = {
			createUserId: userId,
			createUserEmail: email,
			vuli: vuli,
			level: new_level,
			user_number: vuli ? 10 : 1,
			createdTime: new Date().toISOString(),
		};

		await StaffKV.put(code, JSON.stringify(codeData), {
			expirationTtl: 60 * 60 * 24,
		});

		return createResponse({ code: code }, 200);
	} catch (error) {
		console.error('Server error:', error);
		return createResponse({ error: 'Internal server error' }, 500);
	}
}

// 驗證授權碼
export async function verifyStaffCode(request: Request, env: Env) {
	const { StaffKV } = env;
	try {
		const body: { code: string } = await request.json();
		const code = body.code;
		const codeData = (await StaffKV.get(code, { type: 'json' })) as codeData | null;
		if (!codeData) {
			return createResponse({ error: 'Invalid code' }, 404);
		}
		return createResponse({ code: code }, 200);
	} catch (error) {
		console.error('Invalid request body', error);
		return createResponse({ error: 'Invalid request body' }, 400);
	}
}

// 驗證授權碼後，新增Staff
export async function addNewStaff(request: Request, env: Env) {
	const { StaffKV, DATABASE } = env;

	try {
		const body = (await request.json()) as userData;
		const { code, email, name, password, Class, grade, role } = body;

		const existingUser = await DATABASE.prepare('SELECT * FROM accountData WHERE email = ?').bind(email).first();
		if (existingUser) {
			return createResponse({ error: '此帳號已經存在' }, 409);
		}

		// 驗證必要欄位
		if (!code) {
			return createResponse({ error: 'Code is required' }, 400);
		}

		// 檢查驗證碼
		const codeData = await StaffKV.get<codeData>(code, { type: 'json' });
		if (!codeData) {
			return createResponse({ error: 'Invalid code' }, 404);
		}

		const hashedPassword = await hashPassword(password);
		const userId = crypto.randomUUID();
		const auth_person = codeData.createUserEmail;

		await DATABASE.prepare(
			`
			INSERT INTO accountData (id, email, password, name, type, level, class, grade, role, auth_person)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`,
		)
			.bind(userId, email, hashedPassword, name, 'staff', codeData.level, Class, grade, role, auth_person)
			.run();

		if (codeData.vuli && codeData.user_number !== 1) {
			const newCodeData = {
				...codeData,
				user_number: codeData.user_number - 1,
			};
			await StaffKV.put(code, JSON.stringify(newCodeData));
		} else {
			await StaffKV.delete(code);
		}
		return createResponse({ message: 'User registered successfully' }, 201);
	} catch (error) {
		console.error('Invalid request body', error);
		return createResponse({ error: 'Invalid request body' }, 400);
	}
}
