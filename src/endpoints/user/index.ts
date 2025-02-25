import { createRouter } from '..';
import { AppRouter } from '../..';
import { getUserData } from './getData';
import { createStaffCode } from './staff/createCode';
import { userRegister } from './userAdd';
import { listCode } from './staff/listCode';

export function registerUserRoute(): AppRouter {
	const router = createRouter();

	router.get('/data', (ctx) => getUserData(ctx));
	router.post('/add', (ctx) => userRegister(ctx));
	router.put('/staff/code/create', (ctx) => createStaffCode(ctx));
	router.get('/staff/code/list', (ctx) => listCode(ctx));
	return router;
}
