import { sign, verify } from 'jsonwebtoken';
import { Env } from '../types';
import { userLogin, veritySession } from './login';
import { changePassword } from './password/change';
import { forgotPassword } from './password/forgot';
import { resetPassword } from './password/reset';
import { googleLogin } from './login/google';
import { Logout } from './logout';
import { userRegister } from './signUp/normal';
import { createResponse } from '..';
import { createStaffCode, verifyStaffCode, addNewStaff, listAllStaffCode, deleteStaffCode } from './signUp/staff';

export async function handleAuthRoute(req: Request, env: Env) {
	try {
		const url = new URL(req.url);
		if (req.method === 'POST') {
			if (url.pathname.endsWith('/login')) {
				return await userLogin(req, env);
			} else if (url.pathname.endsWith('/password/change')) {
				return await changePassword(req, env);
			} else if (url.pathname.endsWith('/password/forgot')) {
				return await forgotPassword(req, env);
			} else if (url.pathname.endsWith('/federated/Google/link')) {
				return await googleLogin(req, env);
			} else if (url.pathname.endsWith('/password/reset')) {
				return await resetPassword(req, env);
			} else if (url.pathname.endsWith('/register')) {
				return await userRegister(req, env);
			} else if (url.pathname.endsWith('/createCode')) {
				return await createStaffCode(req, env);
			} else if (url.pathname.endsWith('/verifyStaffCode')) {
				return await verifyStaffCode(req, env);
			} else if (url.pathname.endsWith('/addStaff')) {
				return await addNewStaff(req, env);
			} else if (url.pathname.endsWith('/logout')) {
				return await Logout(req, env);
			} else if (url.pathname.endsWith('/getAllCode')) {
				return await listAllStaffCode(req, env);
			}
		} else if (req.method === 'DELETE') {
			if (url.pathname.endsWith('/code/delete')) {
				return await deleteStaffCode(req, env);
			}
		} else if (req.method === 'GET') {
			if (url.pathname.endsWith('/verity')) {
				return await veritySession(req, env);
			}
		}
	} catch (error) {
		console.error('發生錯誤:', error);
		return createResponse({ error: '發生不明錯誤' }, 500);
	}
}

// 密碼哈希化
export async function hashPassword(password: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => ('00' + b.toString(16)).slice(-2)).join('');
}
// 生成 JWT
export async function generateJWT(payload: any, secret: string): Promise<string> {
	return new Promise((resolve, reject) => {
		sign(payload, secret, { expiresIn: '2h' }, (err, token) => {
			if (err) reject(err);
			resolve(token!);
		});
	});
}
// 驗證 JWT
export async function verifyJWT(token: string, secret: string): Promise<any> {
	return new Promise((resolve, reject) => {
		verify(token, secret, (err, decoded) => {
			if (err) reject(err);
			resolve(decoded);
		});
	});
}
