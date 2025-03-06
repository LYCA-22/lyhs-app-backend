import { createRouter } from '..';
import { getUserNum } from './getUserNum';

export function registerAdminRoutes() {
	const router = createRouter();

	router.get('/account/total', getUserNum);
	return router;
}
