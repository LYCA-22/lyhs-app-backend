import { createRouter } from '..';
import { getAllEvents } from './getAllEvent';
import { addEvent } from './addEvent';
import { subscribe } from './subscribe';

export function registerCalendarRoutes() {
	const router = createRouter();

	router.get('/events', getAllEvents);
	router.post('/event', addEvent);
	router.get('/sub', subscribe);
	return router;
}
