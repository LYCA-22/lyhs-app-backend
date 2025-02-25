import { AppContext } from '../..';
import { userData } from '../../types';
import { hashPassword } from '../../utils/pswHash';

export async function userRegister(ctx: AppContext) {
	const env = ctx.env;
	const { email, password, name, Class, grade }: userData = await ctx.req.json();

	try {
		const existingUser = await env.DATABASE.prepare('SELECT * FROM accountData WHERE email = ?').bind(email).first();
		if (existingUser) {
			return ctx.json({ error: 'Account already exists' }, 409);
		}

		const userId = crypto.randomUUID();
		const hashedPassword = await hashPassword(password);

		await env.DATABASE.prepare(
			`
			INSERT INTO accountData (id, email, password, name, type, class, grade)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`,
		)
			.bind(userId, email, hashedPassword, name, 'normal', Class, grade)
			.run();

		return ctx.json({ message: 'User registered successfully' }, 200);
	} catch (error: unknown) {
		console.error('Error during registration:', error);
		const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
		return ctx.json({ error: `Error: ${errorMessage}` }, 500);
	}
}
