import { createRouter } from '../..';
import { AppRouter } from '../../..';
import { addMember } from './addMember';
import { listMember } from './listMember';

export function registerMemberRoute(): AppRouter {
	const router = createRouter();

	router.post('/add', addMember);
	router.get('/list', listMember);
	return router;
}
