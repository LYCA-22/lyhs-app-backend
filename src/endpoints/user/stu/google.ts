import { OpenAPIRoute } from 'chanfana';
import { AppContext } from '../../..';
import { errorHandler, KnownErrorCode } from '../../../utils/error';
import { TokenResponse } from '../../../types';
import { globalErrorHandler } from '../../../utils/errorHandler';

export class getGoogleStuInfo extends OpenAPIRoute {
	async handle(ctx: AppContext) {
		const env = ctx.env;
		const googleClientSecret = env.googleClientSecret;
		const googleClientId = env.googleClientId;
		const { flow, grant_value, redirect_uri } = (await ctx.req.json()) as {
			flow: string;
			grant_value: string;
			redirect_uri: string;
		};

		try {
			if (flow !== 'authorization_code') {
				throw new errorHandler(KnownErrorCode.GOOGLE_API_ERROR);
			}

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
				throw new errorHandler(KnownErrorCode.GOOGLE_AUTH_FAILED);
			}

			// 取得GOOGLE帳號資料，並與資料庫進行對比
			const userInfo = await userInfoResponse.json();
			return ctx.json({ data: userInfo }, 200);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
