import { createRouter } from '..';
import { AppRouter } from '../..';
import { getClassList } from './school/getClassList';
import { getSessionKey } from './school/getSessionKey';
import { getValidateImg } from './school/getValidateImg';
import { listAd } from './ad/list';
import { registerPcsRoute } from './pcs';
import { registerRadioRoutes } from './radio';
import { registerRepairRoutes } from './repair';
import { registerSrmRoutes } from './srm';
import { getYearData } from './school/getYearData';
import { getScore } from './school/getScore';

export function registerLypsRoute(): AppRouter {
	const router = createRouter();

	router.get('/list', listAd);
	router.route('/srm', registerSrmRoutes());
	router.route('/radio', registerRadioRoutes());
	router.route('/pcs', registerPcsRoute());
	router.route('/repair', registerRepairRoutes());
	router.get('/school/validate', getValidateImg);
	router.post('/school/session', getSessionKey);
	router.post('/school/classlist', getClassList);
	router.post('/school/year', getYearData);
	router.post('/school/score', getScore);
	return router;
}
