import { AppContext } from '../../..';
import { studentData } from '../../../types';

export async function addProject(ctx: AppContext) {
	const env = ctx.env;
	const { email, name, type, title, description, Class, number, solution }: studentData = await ctx.req.json();

	if (!email || !name || !type || !title || !description || !Class || !number || !solution) {
		return ctx.json({ error: 'Information missing' }, 400);
	}

	const code = Array.from(crypto.getRandomValues(new Uint8Array(6)))
		.map((n) => n % 10)
		.join('');
	const projectId = crypto.randomUUID();
	const createdTime = new Date().toISOString();
	const updatedTime = createdTime;

	try {
		const projectData = JSON.stringify({
			id: projectId,
			searchCode: code,
			email: email,
			name: name,
			class: Class,
			number: number,
			title: title,
			description: description,
			type: type,
			solution: solution,
			handler: '',
			status: '已接收到案件回報。',
			createdTime: createdTime,
			updatedTime: updatedTime,
		});
		await env.mailKV.put(code, projectData);
		return ctx.json({ code: code }, 201);
	} catch (e) {
		if (e instanceof Error) {
			console.error('Error during add project:', e.message);
			return ctx.json({ error: `Error: ${e.message}` }, 500);
		}
		console.error('Error during add project:', e);
		return ctx.json({ error: `Unknown error during project addition` }, 500);
	}
}
