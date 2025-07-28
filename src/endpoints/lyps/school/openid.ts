import { OpenAPIRoute } from 'chanfana';
import { AppContext } from '../../..';
import { globalErrorHandler } from '../../../utils/errorHandler';
import { getSetCookieHeaders } from './getValidateImg';
import { errorHandler, KnownErrorCode } from '../../../utils/error';
import { checkService } from '../../../utils/checkService';

interface OpenIdLoginData {
	userId: string;
	password: string;
}

export class OpenIdLogin extends OpenAPIRoute {
	async handle(ctx: AppContext) {
		try {
			await checkService('school_system', ctx);

			const { userId, password }: OpenIdLoginData = await ctx.req.json();
			if (!userId || !password) {
				throw new errorHandler(KnownErrorCode.MISSING_REQUIRED_FIELDS);
			}

			const headers = {
				'User-Agent':
					'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
				Accept:
					'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
				'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
				'Content-Type': 'application/x-www-form-urlencoded',
				Origin: 'https://highschool.kh.edu.tw',
				Referer: 'https://highschool.kh.edu.tw/Login.action',
			};

			const getOpenIdUrl = await fetch('https://highschool.kh.edu.tw/OpenIdLogin.action?school=124311D', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				redirect: 'manual',
			});
			const location = getOpenIdUrl.headers.get('location');
			const infos = getSetCookieHeaders(getOpenIdUrl.headers);
			if (!infos || infos.length < 2) {
				throw new errorHandler(KnownErrorCode.INVALID_SCHOOL_SESSION, 'Missing required cookies');
			}
			const cookieString = infos.map((c) => c.split(';')[0]).join('; ');

			const cookieParts = cookieString.split('; ');
			if (cookieParts.length < 2) {
				throw new errorHandler(KnownErrorCode.INVALID_SCHOOL_SESSION, 'Cookie string does not contain expected parts');
			}

			const JSEESIONID = cookieParts[0]?.split('=')[1];
			const SRV = cookieParts[1]?.split('=')[1];

			if (!JSEESIONID || !SRV) {
				throw new errorHandler(KnownErrorCode.INVALID_SCHOOL_SESSION, 'Failed to extract JSEESIONID or SRV');
			}

			const getOpenIdCookies = await fetch(`https://${location?.split(':')[1]}`, {
				method: 'POST',
				headers: {
					...headers,
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				redirect: 'manual',
			});
			const setCookies = getSetCookieHeaders(getOpenIdCookies.headers).toString();
			const firstLogin = await fetch(`https://${location?.split(':')[1]}&userid=${userId}&password=${password}&_loginAction=T`, {
				method: 'POST',
				headers: {
					...headers,
					'Content-Type': 'application/x-www-form-urlencoded',
					Cookie: setCookies,
				},
				redirect: 'manual',
			});

			const confirmForm = new URLSearchParams({
				isReturnTo: 'return_to',
				'check.fullname': '1',
				'check.gender': '1',
				'check.dob': '1',
				'check.email': '1',
				'check.edu.person.guid': '1',
				'check.edu.school.id': '1',
				'check.edu.school.titleStr.1': '1',
			});

			const secondConfirm = await fetch(firstLogin.url, {
				method: 'POST',
				headers: {
					...headers,
					Cookie: setCookies,
				},
				body: confirmForm.toString(),
				redirect: 'manual',
			});

			const finalLocation = secondConfirm.headers.get('location');

			const getHtml = await fetch(finalLocation as string, {
				method: 'POST',
				headers: {
					...headers,
					Cookie: setCookies,
				},
			});

			const html = await getHtml.text();
			console.log(html);
			const match = html.match(/<input[^>]*name=["']session_key["'][^>]*value=["']([^"']+)["']/);
			const sessionKey = match?.[1];
			if (!sessionKey) {
				throw new errorHandler(KnownErrorCode.INVALID_SCHOOL_SESSION);
			}

			return ctx.json({ message: 'success', session_key: sessionKey, JSEESIONID: JSEESIONID, SRV: SRV });
		} catch (error) {
			return globalErrorHandler(error as Error, ctx);
		}
	}
}
