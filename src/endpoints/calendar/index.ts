import { createRouter } from '..';
import { getAllEvents } from './getAllEvent';
import { addEvent } from './addEvent';
import { subscribe } from './subscribe';
import { UpdateEvent } from './updateEvent';
import { deleteEvent } from './deleteEvent';

export function registerCalendarRoutes() {
	const router = createRouter();

	router.get('/events', getAllEvents);
	router.post('/event', addEvent);
	router.delete('/event', deleteEvent);
	router.get('/sub', subscribe);
	router.put('/update', UpdateEvent);
	return router;
}
