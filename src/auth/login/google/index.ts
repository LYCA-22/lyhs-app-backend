import { createResponse } from '../../..';
import { Env, TokenResponse, UserInfo } from '../../../types';
import { parseUserAgent } from '..';

export async function googleLogin(request: Request, env: Env) {
	const { DATABASE, sessionKV } = env;
	const googleClientSecret = env.googleClientSecret;
	const googleClientId = env.googleClientId;
	const userAgent = request.headers.get('User-Agent') || '';
	const { browser: browserInfo, os: osInfo } = parseUserAgent(userAgent);
	const clientIp =
		request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || request.headers.get('X-Real-IP') || 'unknown';
	const { flow, grant_value, redirect_uri } = (await request.json()) as {
		flow: string;
		grant_value: string;
		redirect_uri: string;
	};

	if (flow !== 'authorization_code') {
		return createResponse({ error: 'Invalid flow type' }, 400);
	}

	try {
		const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				code: grant_value,
				client_id: googleClientId,
				client_secret: googleClientSecret,
				redirect_uri: redirect_uri,
				grant_type: 'authorization_code',
			}),
		});

		if (!tokenResponse.ok) {
			throw new Error('Failed to exchange authorization code for access token');
		}

		const tokenData: TokenResponse = await tokenResponse.json();
		const { access_token } = tokenData;

		const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
			headers: {
				Authorization: `Bearer ${access_token}`,
			},
		});

		if (!userInfoResponse.ok) {
			throw new Error('Failed to fetch user info from Google');
		}

		const userInfo = await userInfoResponse.json();
		const { email } = userInfo as UserInfo;
		const user = await DATABASE.prepare('SELECT * FROM accountData WHERE email = ?').bind(email).first();
		if (!user) {
			return createResponse({ error: 'User not found' }, 404);
		}
		const sessionId = crypto.randomUUID();
		const loginTime = new Date(Date.now()).toISOString();
		const expirationTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
		const sessionData = JSON.stringify({
			userId: user.id,
			email: user.email,
			loginTime: loginTime,
			expirationTime: expirationTime,
			browser: browserInfo.name,
			ip: clientIp,
			os: osInfo.name,
		});
		await sessionKV.put(sessionId, sessionData, { expirationTtl: 24 * 60 * 60 });
		return createResponse({ sessionId: sessionId }, 200);
	} catch (error: any) {
		console.error('Error Login Google account:', error);
		return createResponse({ error: error }, 500);
	}
}
