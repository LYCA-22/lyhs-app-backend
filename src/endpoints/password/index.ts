import { AppRouter } from '../..';
import { createRouter } from '..';
import { forgot } from './forgot';
import { reset } from './reset';
import { change } from './change';

export function registerPswRoute(): AppRouter {
	const router = createRouter();

	router.post('/forgot', (ctx) => forgot(ctx));
	router.post('/reset', (ctx) => reset(ctx));
	router.post('/change', (ctx) => change(ctx));
	return router;
}
