import { createRouter } from '..';
import { getAllFiles } from './getAllPhotos';

export function registerOpenFileRoute() {
	const router = createRouter();

	router.get('/photos/:date', getAllFiles);
	return router;
}
