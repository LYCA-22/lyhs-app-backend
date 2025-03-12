import { createRouter } from '../..';
import { addProject } from './add';
import { deleteProject } from './delete';
import { getMailDetail } from './detail';
import { getProjectList } from './list';
import { searchMail } from './search';
import { updateProject } from './update';

export function registerSrmRoutes() {
	const router = createRouter();

	router.post('/add', addProject);
	router.delete('/delete', deleteProject);
	router.get('/list', getProjectList);
	router.put('/update', updateProject);
	router.get('/detail', getMailDetail);
	router.get('/search', searchMail);

	return router;
}
