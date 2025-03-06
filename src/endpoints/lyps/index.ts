import { createRouter } from '..';
import { AppRouter } from '../..';
import { listAd } from './ad/list';
import { addProject } from './srm/add';
import { deleteProject } from './srm/delete';
import { getMailDetail } from './srm/detail';
import { getProjectList } from './srm/list';
import { searchMail } from './srm/search';
import { updateProject } from './srm/update';

export function registerLypsRoute(): AppRouter {
	const router = createRouter();

	router.get('/list', listAd);
	router.post('/srm/add', addProject);
	router.delete('/srm/delete', deleteProject);
	router.get('/srm/list', getProjectList);
	router.put('/srm/update', updateProject);
	router.get('/srm/detail', getMailDetail);
	router.get('/srm/search', searchMail);
	return router;
}
