import { createRouter } from '../..';
import { getClassList } from './getYearScore';
import { getScore } from './getScore';
import { getYearData } from './getYearData';
import { OpenIdLogin } from './openid';
import { getAllSeme } from './getAllseme';
import { getAbsence } from './getAbsence';
import { getOpenId } from './getOpenId';

export function registerSchoolRoutes() {
	const router = createRouter();
	router.post('/yearScore', getClassList);
	router.post('/semeScore', getAllSeme);
	router.post('/year', getYearData);
	router.post('/score', getScore);
	router.post('/openid', OpenIdLogin);
	router.get('/getId', getOpenId);
	router.post('/absence', getAbsence);
	return router;
}
