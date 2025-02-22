import { createRouter } from '..';
import { AppRouter } from '../..';
import { getUserData } from './getData';

export function registerUserRoute(): AppRouter {
	const router = createRouter();

	router.get('/data', (ctx) => getUserData(ctx));
	return router;
}
