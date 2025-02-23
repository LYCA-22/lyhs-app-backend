import { createRouter } from '..';
import { AppContext, AppRouter } from '../..';
import { userLogin } from './login';
import { userLogout } from './logout';
import { veritySession as VS } from '../../util/veritySession';

export function registerAuthRoute(): AppRouter {
	const router = createRouter();

	router.post('/login', (ctx) => userLogin(ctx));
	router.post('/logout', (ctx) => userLogout(ctx));
	router.get('/verity', (ctx) => veritySession(ctx));
	return router;
}

export async function hashPassword(password: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => ('00' + b.toString(16)).slice(-2)).join('');
}

async function veritySession(ctx: AppContext) {
	try {
		const result = await VS(ctx);
		if (result instanceof Response) {
			return result;
		}
		return ctx.json({ message: 'Session verified' }, 200);
	} catch (error) {
		if (error instanceof Error) {
		}
	}
}
