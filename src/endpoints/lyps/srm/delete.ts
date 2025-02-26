import { AppContext } from '../../..';
import { verifySession } from '../../../utils/verifySession';
import { studentData } from '../../../types';

export async function deleteProject(ctx: AppContext) {
	const env = ctx.env;
	const result = await verifySession(ctx);
	if (result instanceof Response) {
		return result;
	}

	try {
		const code = ctx.req.param('code');
		if (!code) {
			return ctx.json({ error: 'Code is missing' }, 400);
		}

		const { results } = await env.DATABASE.prepare('SELECT level FROM accountData WHERE id = ?').bind(result).all();
		if (!results || results.length === 0) {
			return ctx.json({ error: 'Invalid user' }, 404);
		}

		const projectData = (await env.mailKV.get(code, { type: 'json' })) as studentData;
		if (!projectData) {
			return ctx.json({ error: 'Invalid code' }, 404);
		}

		if (projectData.handler === '') {
			const userLevel = results[0].level;
			if (userLevel === 'A1') {
				await env.mailKV.delete(code);
				return ctx.json({ message: 'Project deleted successfully' }, 200);
			} else {
				return ctx.json({ error: 'Permission denied' }, 403);
			}
		} else {
			if (projectData.handler === result || results[0].level === 'A1') {
				await env.mailKV.delete(code);
				return ctx.json({ message: 'Project deleted successfully' }, 200);
			} else {
				return ctx.json({ error: 'Permission denied' }, 403);
			}
		}
	} catch (e) {
		if (e instanceof Error) {
			console.error('Error during delete project:', e.message);
			return ctx.json({ error: `Error during delete project:: ${e.message}` }, 500);
		}
		console.error('Error during delete project:', e);
		return ctx.json({ error: 'Internal server error' }, 500);
	}
}
