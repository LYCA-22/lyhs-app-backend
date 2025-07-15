import { createRouter } from '../..';
import { getClassList } from './getYearScore';
import { getScore } from './getScore';
import { getSessionKey } from './getSessionKey';
import { getValidateImg } from './getValidateImg';
import { getYearData } from './getYearData';
import { OpenIdLogin } from './openid';
import { getAllSeme } from './getAllseme';
import { getAbsence } from './getAbsence';

export function registerSchoolRoutes() {
	const router = createRouter();
	router.get('/validate', getValidateImg);
	router.post('/session', getSessionKey);
	router.post('/yearScore', getClassList);
	router.post('/semeScore', getAllSeme);
	router.post('/year', getYearData);
	router.post('/score', getScore);
	router.post('/openid', OpenIdLogin);
	router.post('/absence', getAbsence);
	return router;
}
