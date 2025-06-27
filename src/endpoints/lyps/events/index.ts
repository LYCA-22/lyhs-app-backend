import { createRouter } from '../..';
import { Apply } from './apply';

export function registerEventsRoute() {
	const router = createRouter();

	router.post('/apply', Apply);
	return router;
}
