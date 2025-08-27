import { createRouter } from '..';
import { getUserList } from './getUserList';
import { getUserNum } from './getUserNum';
import { registerServiceRoutes } from './service';
import { registerStaffRoutes } from './staff';

export function registerAdminRoutes() {
	const router = createRouter();

	router.get('/account/total', getUserNum);
	router.get('/account/list', getUserList);
	router.route('/service', registerServiceRoutes());
	router.route('/staff', registerStaffRoutes());
	return router;
}
