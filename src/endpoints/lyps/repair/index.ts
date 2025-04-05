import { createRouter } from '../..';
import { addCase } from './addCase';
import { deleteCase } from './deleteCase';
import { listCases } from './listCase';
import { updateCase } from './updateCase';
import { getDetailCase } from './getCaseDetail';

export function registerRepairRoutes() {
	const router = createRouter();
	router.post('/add', addCase);
	router.put('/update', updateCase);
	router.get('/list', listCases);
	router.delete('/case', deleteCase);
	router.get('/detail', getDetailCase);
	return router;
}
