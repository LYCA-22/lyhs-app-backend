import { AppContext } from '../../..';
import { verifySession } from '../../../utils/verifySession';
import { studentData } from '../../../types';

export async function getProjectList(ctx: AppContext) {
	const env = ctx.env;
	try {
		const result = await verifySession(ctx);
		if (result instanceof Response) {
			return result;
		}

		const { results } = await env.DATABASE.prepare('SELECT level FROM accountData WHERE id = ?').bind(result).all();
		if (!results || results.length === 0) {
			return ctx.json({ error: 'Invalid user' }, 404);
		}

		const userLevel = results[0].level;
		if (userLevel !== 'A1' && userLevel !== 'L3') {
			return ctx.json({ error: 'Permission denied' }, 403);
		}

		const projectsList = await env.mailKV.list();
		const allProjects = [];

		for (const key of projectsList.keys) {
			const projectData = (await env.mailKV.get(key.name, { type: 'json' })) as studentData;
			if (projectData) {
				const simplifiedData = {
					id: projectData.id,
					searchCode: projectData.searchCode,
					title: projectData.title,
					status: projectData.status,
					createdTime: projectData.createdTime,
					handler: projectData.handler,
					email: projectData.email,
				};
				allProjects.push(simplifiedData);
			}
		}

		return ctx.json({ data: allProjects }, 200);
	} catch (e: any) {
		if (e instanceof Error) {
			console.error('Error during get project:', e.message);
			return ctx.json({ error: `Error: ${e.message}` }, 500);
		}
		console.error('Error during get project:', e);
		return ctx.json({ error: `Unknown error` }, 500);
	}
}
