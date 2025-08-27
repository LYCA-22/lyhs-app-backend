import { createRouter } from '..';
import { AppRouter } from '../..';
import { listAd } from './ad/list';
import { registerAnnouncementRoutes } from './announcement';
import { registerPcsRoute } from './pcs';
import { registerRadioRoutes } from './radio';
import { registerRepairRoutes } from './repair';
import { registerSchoolRoutes } from './school';
import { registerSrmRoutes } from './srm';

export function registerLypsRoute(): AppRouter {
	const router = createRouter();

	router.get('/list', listAd);
	router.route('/srm', registerSrmRoutes());
	router.route('/radio', registerRadioRoutes());
	router.route('/pcs', registerPcsRoute());
	router.route('/repair', registerRepairRoutes());
	router.route('/school', registerSchoolRoutes());
	router.route('/announcement', registerAnnouncementRoutes());
	return router;
}
