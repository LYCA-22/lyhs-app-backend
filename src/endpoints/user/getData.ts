import { AppContext } from '../..';
import { userData } from '../../types';
import { verifySession } from '../../utils/verifySession';

export async function getUserData(ctx: AppContext) {
	try {
		const result = await verifySession(ctx);
		if (result instanceof Response) {
			return result;
		}
		const userId = result as string;

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
