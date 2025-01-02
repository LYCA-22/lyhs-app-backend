import { Env, BetaNewUserData } from "../../types";
import {createResponse} from "../../index";
export async function addNewUser(request: Request, env: Env) {
	const { DATABASE } = env;
	const { email, name }: BetaNewUserData = await request.json();
	const created_time = new Date().toISOString();

	try	{
		await DATABASE.prepare('INSERT INTO `lyhs-plus-beta-user-list` (email, name, created_time) VALUES (?, ?, ?)').bind(email, name, created_time).run();
		return createResponse({ message: 'User registered successfully' }, 200);
	} catch (e) {
		console.error("Error during add user:", e);
		return createResponse({ error: `Error: ${e.message}` }, 500);
	}
}
