import { createRouter } from '..';
import { getServices } from './getService';
import { getUserNum } from './getUserNum';

export function registerAdminRoutes() {
	const router = createRouter();

	router.get('/account/total', getUserNum);
	router.get('/service', getServices);
	return router;
}
