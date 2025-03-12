import { createRouter } from '../..';
import { AddPcs } from './add';

export function registerPcsRoute() {
	const router = createRouter();

	router.post('/add', AddPcs);
	return router;
}
