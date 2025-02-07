import { createResponse } from '../../index';
import { hashPassword } from '../index';
import { Env, userData } from '../../types';

// 一般用戶註冊
export async function userRegister(request: Request, env: Env) {
	const { DATABASE } = env;
	const { email, password, name, Class, grade }: userData = await request.json();

	try {
		const existingUser = await DATABASE.prepare('SELECT * FROM accountData WHERE email = ?').bind(email).first();
		if (existingUser) {
			return createResponse({ error: '此帳號已經存在' }, 409);
		}

		const userId = crypto.randomUUID();
		const hashedPassword = await hashPassword(password);

		await DATABASE.prepare(
			`
			INSERT INTO accountData (id, email, password, name, type, class, grade)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`,
		)
			.bind(userId, email, hashedPassword, name, 'normal', Class, grade)
			.run();

		return createResponse({ message: 'User registered successfully' }, 201);
	} catch (error: unknown) {
		console.error('Error during registration:', error);
		const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
		return createResponse({ error: `Error: ${errorMessage}` }, 500);
	}
}
