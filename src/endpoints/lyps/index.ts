import { createRouter } from '..';
import { AppRouter } from '../..';
import { listAd } from './listAd';

export function registerLypsRoute(): AppRouter {
	const router = createRouter();

	router.get('/list', listAd);
	return router;
}
