import { createRouter } from '..';
import { AppRouter } from '../..';
import { getUserData } from './getData';
import { createStaffCode } from './staff/createCode';
import { userRegister } from './userAdd';
import { listCode } from './staff/listCode';
import { verifyCode } from './staff/verifyCode';
import { addStaff } from './staff/addStaff';
import { DeleteUser } from './deleteUser';
import { deleteStaffCode } from './staff/deleteCode';
import { getGoogleStuInfo } from './stu/google';
import { registerMemberRoute } from './member';
import { updateUserInfo } from './updateUserInfo';

export function registerUserRoute(): AppRouter {
	const router = createRouter();

	router.get('/me', getUserData);
	router.post('/update', updateUserInfo);
	router.get('/staff/code/list', listCode);
	router.post('/staff/code/verify', verifyCode);
	router.post('/add', userRegister);
	router.put('/staff/code/create', createStaffCode);
	router.post('/staff/add', addStaff);
	router.delete('/', DeleteUser);
	router.delete('/staff/code', deleteStaffCode);
	router.post('/stu/google', getGoogleStuInfo);
	router.route('/member', registerMemberRoute());
	return router;
}
