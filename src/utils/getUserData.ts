import { AppContext } from '..';
import { userData } from '../types';

export async function getUserInfo(userId: string, ctx: AppContext): Promise<userData | Response> {
	const env = ctx.env;

	try {
		const queryResult = await env.DATABASE.prepare(
			'SELECT id, name, email, type, level, class, grade, role, auth_person FROM accountData WHERE id = ?',
		)
			.bind(userId)
			.all();

		if (!queryResult.results || queryResult.results.length === 0) {
			return ctx.json({ error: 'Invalid user' }, 404);
		}

		const userRecord = queryResult.results[0] as unknown as userData;
		return userRecord;
	} catch (error) {
		if (error instanceof Error) {
			console.error('Error verifying session:', error.message);
			return ctx.json({ error: `Error verifying session: ${error.message}` }, 500);
		}
		return ctx.json({ error: 'Unknown error while verifying session' }, 500);
	}
}
