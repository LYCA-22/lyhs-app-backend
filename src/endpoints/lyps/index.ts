import { createRouter } from '..';
import { AppRouter } from '../..';
import { listAd } from './ad/list';
import { registerPcsRoute } from './pcs';
import { registerRadioRoutes } from './radio';
import { registerSrmRoutes } from './srm';

export function registerLypsRoute(): AppRouter {
	const router = createRouter();

	router.get('/list', listAd);
	router.route('/srm', registerSrmRoutes());
	router.route('/radio', registerRadioRoutes());
	router.route('/pcs', registerPcsRoute());
	return router;
}
