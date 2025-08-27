import { createRouter } from '../..';
import { deleteStaff } from './delete';
import { listStaff } from './list';

export function registerStaffRoutes() {
	const router = createRouter();

	router.delete('/', deleteStaff);
	router.get('/list', listStaff);
	return router;
}
