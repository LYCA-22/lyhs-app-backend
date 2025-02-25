import { AppContext } from '../../..';
import { verifySession } from '../../../utils/verifySession';
import { codeData } from '../../../types';

export async function listCode(ctx: AppContext) {
	const env = ctx.env;

	try {
		const result = await verifySession(ctx);
		if (result instanceof Response) {
			return result;
		}

		const userData = await env.DATABASE.prepare(`SELECT level, email FROM accountData WHERE id = ?`)
			.bind(result)
			.first<{ level: string; email: string }>();

		if (!userData) {
			console.error('User not found');
			return ctx.json({ error: 'User not found' }, 404);
		}

		if (userData.level !== 'A1') {
			console.error('Unauthorized access attempt');
			return ctx.json({ error: 'Forbidden' }, 403);
		}

		const allCodeData = await env.DATABASE.prepare(`SELECT * FROM register_codes`).all<codeData[]>();

		return ctx.json({ data: allCodeData }, 200);
	} catch (error) {
		console.error('Server error:', error);
		return ctx.json({ error: 'Internal server error' }, 500);
	}
}
