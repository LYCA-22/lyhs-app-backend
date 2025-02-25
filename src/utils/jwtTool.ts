import { sign, verify } from 'jsonwebtoken';

export async function generateJWT(payload: any, secret: string): Promise<string> {
	return new Promise((resolve, reject) => {
		sign(payload, secret, { expiresIn: '2h' }, (err, token) => {
			if (err) reject(err);
			resolve(token!);
		});
	});
}

export async function verifyJWT(token: string, secret: string): Promise<any> {
	return new Promise((resolve, reject) => {
		verify(token, secret, (err, decoded) => {
			if (err) reject(err);
			resolve(decoded);
		});
	});
}
