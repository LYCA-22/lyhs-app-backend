import { createRouter } from '../..';
import { adjustService } from './adjust';
import { getServices } from './getService';

export function registerServiceRoutes() {
	const router = createRouter();

	router.get('/all', getServices);
	router.post('/adjust', adjustService);
	return router;
}
