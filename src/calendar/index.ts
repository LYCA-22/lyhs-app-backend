import { Env } from '../types';
import { createResponse } from '..';

export async function getAllEvents(env: Env) {
	const { DATABASE } = env;
	try {
		const statement = await DATABASE.prepare('SELECT * FROM calendar').all();
		return createResponse({ data: statement }, 200);
	} catch (error: any) {
		console.error('Error fetching events:', error);
		return createResponse({ error: error.message }, 500);
	}
}

export async function addEvent(env: Env, request: Request) {
	const { DATABASE } = env;
	const { id, title, description, date, office }: { id: string; title: string; description: string; date: string; office: string } =
		await request.json();
	try {
		await DATABASE.prepare('INSERT INTO calendar (id, title, description, date, office) VALUES (?, ?, ?, ?, ?)')
			.bind(id, title, description, date, office)
			.run();
		return createResponse({ message: 'successful' }, 200);
	} catch (error: any) {
		console.error('Error adding event:', error);
		return createResponse({ error: error.message }, 500);
	}
}

export async function deleteEvent(env: Env, request: Request) {
	const { DATABASE } = env;
	const { id }: { id: string } = await request.json();
	try {
		await DATABASE.prepare('DELETE FROM calendar WHERE id = ?').bind(id).run();
		return createResponse({ message: 'successful' }, 200);
	} catch (error: any) {
		console.error('Error deleting event:', error);
		return createResponse({ error: error.message }, 400);
	}
}

export async function updateEvent(env: Env, request: Request) {
	const { DATABASE } = env;
	const { id, title, description, date, office }: { id: string; title: string; description: string; date: string; office: string } =
		await request.json();
	try {
		await DATABASE.prepare('UPDATE calendar SET title = ?, description = ?, date = ?, office=? WHERE id = ?')
			.bind(title, description, date, office, id)
			.run();
		return createResponse({ message: 'successful' }, 200);
	} catch (error: any) {
		console.error('Error updating event:', error);
		return createResponse({ error: error.message }, 400);
	}
}
