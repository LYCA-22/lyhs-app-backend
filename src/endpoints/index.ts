import { Hono } from 'hono';
import { fromHono } from 'chanfana';
import { AppOptions } from '../index';
import { ServiceStatus } from './status';
import { registerAuthRoute } from './auth';
import { registerUserRoute } from './user';

export function createRouter() {
	const router = new Hono<AppOptions>();
	return fromHono(router);
}

export function registerEndpoints() {
	const router = createRouter();
	router.get('/status', (ctx) => ServiceStatus(ctx));

	router.route('/auth', registerAuthRoute());
	router.route('/user', registerUserRoute());
	return router;
}
