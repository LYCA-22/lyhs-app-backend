import { createRouter } from '../..';
import { addNewAnnouncement } from './add';
import { DeleteAnnouncement } from './delete';
import { GetAnnouncement } from './get';
import { ListAnnouncement } from './list';

export function registerAnnouncementRoutes() {
	const router = createRouter();
	router.post('/add', addNewAnnouncement);
	router.get('/list', ListAnnouncement);
	router.delete('/delete', DeleteAnnouncement);
	router.get('/', GetAnnouncement);
	return router;
}
