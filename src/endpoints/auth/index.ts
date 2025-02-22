import { createRouter } from '..';
import { AppRouter } from '../..';
import { userLogin } from './login';
import { userLogout } from './logout';

export function registerAuthRoute(): AppRouter {
	const router = createRouter();

	router.post('/login', (ctx) => userLogin(ctx));
	router.post('/logout', (ctx) => userLogout(ctx));
	return router;
}

export async function hashPassword(password: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => ('00' + b.toString(16)).slice(-2)).join('');
}
