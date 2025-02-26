import { createRouter } from '..';
import { AppRouter } from '../..';
import { listAd } from './ad/list';
import { addProject } from './srm/add';
import { deleteProject } from './srm/delete';
import { getProjectList } from './srm/list';
import { updateProject } from './srm/update';

export function registerLypsRoute(): AppRouter {
	const router = createRouter();

	router.get('/list', (ctx) => listAd(ctx));
	router.put('/srm/add', (ctx) => addProject(ctx));
	router.delete('/srm/delete', (ctx) => deleteProject(ctx));
	router.get('/srm/list', (ctx) => getProjectList(ctx));
	router.put('/srm/update', (ctx) => updateProject(ctx));
	return router;
}
