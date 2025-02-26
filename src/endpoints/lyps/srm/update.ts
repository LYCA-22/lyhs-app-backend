import { AppContext } from '../../..';
import { verifySession } from '../../../utils/verifySession';
import { studentData } from '../../../types';

export async function updateProject(ctx: AppContext) {
	const env = ctx.env;
	const result = await verifySession(ctx);
	if (result instanceof Response) {
		return result;
	}

	const { code, handler, status }: { code: string; handler: string; status: string } = await ctx.req.json();
	if (!code || !handler || !status) {
		return ctx.json({ error: 'Data is missing' }, 400);
	}

	try {
		const projectData = (await env.mailKV.get(code, { type: 'json' })) as studentData;
		if (!projectData) {
			return ctx.json({ error: 'Invalid code' }, 404);
		}
		projectData.handler = handler;
		projectData.status = status;
		projectData.updatedTime = new Date().toISOString();
		await env.mailKV.put(code, JSON.stringify(projectData));
		return ctx.json({ message: 'Project updated successfully' }, 200);
	} catch (e: any) {
		if (e instanceof Error) {
			console.error('Error during update project:', e.message);
			return ctx.json({ error: `Error: ${e.message}` }, 500);
		}
		console.error('Error during update project:', e);
		return ctx.json({ error: 'Internal server error' }, 500);
	}
}
