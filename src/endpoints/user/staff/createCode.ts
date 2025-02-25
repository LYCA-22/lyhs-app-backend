import { AppContext } from '../../..';
import { verifySession } from '../../../utils/verifySession';

export async function createStaffCode(ctx: AppContext) {
	const env = ctx.env;
	let vuli: boolean; // 大量授權
	let new_level: string; // 新帳號權限

	const body: { vuli: boolean; level: string } = await ctx.req.json();
	vuli = body.vuli;
	new_level = body.level;

	if (body.level === 'A1' || typeof vuli !== 'boolean') {
		return ctx.json({ error: 'Invalid level or information' }, 400);
	}

	try {
		const result = await verifySession(ctx);
		if (result instanceof Response) {
			return result;
		}
		const userData = await env.DATABASE.prepare(`SELECT level, email FROM accountData WHERE id = ?`)
			.bind(result)
			.first<{ level: string; email: string }>();

		if (!userData) {
			return ctx.json({ error: 'User not found' }, 404);
		}

		const { level, email } = userData;

		if (level !== 'A1') {
			console.error('Unauthorized access attempt');
			return ctx.json({ error: 'Forbidden' }, 403);
		}

		const code = Array.from(crypto.getRandomValues(new Uint8Array(6)))
			.map((n) => n % 10)
			.join('');
		const codeData = {
			createUserId: result,
			createUserEmail: email,
			vuli: vuli,
			level: new_level,
			user_number: vuli ? 10 : 1,
			createdTime: new Date().toISOString(),
			registerCode: code,
		};
		const id = crypto.randomUUID();

		await env.DATABASE.prepare(
			`INSERT INTO register_codes (createUserId, createUserEmail, vuli, level, user_number, createdTime, registerCode)
			VALUES (?, ?, ?, ?, ?, ?, ?)`,
		)
			.bind(
				codeData.createUserId,
				codeData.createUserEmail,
				codeData.vuli,
				codeData.level,
				codeData.user_number,
				codeData.createdTime,
				codeData.registerCode,
			)
			.run();
		return ctx.json({ code: code }, 200);
	} catch (e) {
		if (e instanceof Error) {
			console.error('Error creating code:', e);
			return ctx.json({ error: e.message }, 500);
		}
		console.error('Unexpected error:', e);
		return ctx.json({ error: 'Internal server error' }, 500);
	}
}
