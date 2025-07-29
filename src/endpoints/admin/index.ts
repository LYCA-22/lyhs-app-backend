import { createRouter } from '..';
import { getUserNum } from './getUserNum';
import { registerServiceRoutes } from './service';

export function registerAdminRoutes() {
	const router = createRouter();

	router.get('/account/total', getUserNum);
	router.route('/service', registerServiceRoutes());
	return router;
}
