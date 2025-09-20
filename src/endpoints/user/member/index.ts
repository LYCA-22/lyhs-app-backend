import { createRouter } from '../..';
import { AppRouter } from '../../..';
import { addMember } from './addMember';
import { deleteMember } from './deleteMember';
import { listMember } from './listMember';
import { updateMemberStatus } from './updateMemberStatus';

export function registerMemberRoute(): AppRouter {
	const router = createRouter();

	router.post('/add', addMember);
	router.get('/list', listMember);
	router.put('/updateStatus', updateMemberStatus);
	router.delete('/', deleteMember);
	return router;
}
