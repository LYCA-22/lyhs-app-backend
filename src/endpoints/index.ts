import { Hono } from 'hono';
import { fromHono } from 'chanfana';
import { AppOptions } from '../index';
import { ServiceStatus } from './status';
import { registerAuthRoute } from './auth';
import { registerUserRoute } from './user';
import { registerPswRoute } from './password';
import { registerLypsRoute } from './lyps';
import { registerAdminRoutes } from './admin';
import { registerCalendarRoutes } from './calendar';

export function createRouter() {
	const router = new Hono<AppOptions>();
	return fromHono(router);
}

export function registerEndpoints() {
	const router = createRouter();
	router.get('/status', ServiceStatus);

	router.route('/auth', registerAuthRoute());
	router.route('/user', registerUserRoute());
	router.route('/psw', registerPswRoute());
	router.route('/lyps', registerLypsRoute());
	router.route('/cal', registerCalendarRoutes());
	router.route('/admin', registerAdminRoutes());
	return router;
}
