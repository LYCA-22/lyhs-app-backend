import { createRouter } from '../..';
import { AddPcs } from './add';
import { updatePcs } from './update';

export function registerPcsRoute() {
	const router = createRouter();

	router.post('/add', AddPcs);
	router.put('/update', updatePcs);
	return router;
}
