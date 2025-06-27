import { sign, SignOptions, verify } from 'jsonwebtoken';

export async function generateJWT(payload: any, secret: string, expiresIn: string = '2h'): Promise<string> {
	return new Promise((resolve, reject) => {
		const options: SignOptions = { expiresIn: expiresIn as any };
		sign(payload, secret, options, (err, token) => {
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
