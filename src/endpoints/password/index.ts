import { AppRouter } from '../..';
import { createRouter } from '..';
import { forgotPassword } from './forgot';
import { resetPassword } from './reset';
import { changePassword } from './change';

export function registerPswRoute(): AppRouter {
	const router = createRouter();

	router.post('/forgot', forgotPassword);
	router.put('/reset', resetPassword);
	router.put('/change', changePassword);
	return router;
}
