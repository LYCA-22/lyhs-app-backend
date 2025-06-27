import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';

interface login {
	loginId: string;
	password: string;
	captcha: string;
	JSESSIONID: string;
	SRV: string;
}

export class getSessionKey extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '獲取校務系統 Session',
		tags: ['校務系統'],
		description: '獲取高雄市校務行政系統 Session Key',
		request: {
			body: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								loginId: { type: 'string' },
								password: { type: 'string' },
								captcha: { type: 'string' },
								JSESSIONID: { type: 'string' },
								SRV: { type: 'string' },
							},
							required: ['loginId', 'password', 'captcha', 'JSESSIONID', 'SRV'],
						},
					},
				},
			},
		},
		responses: {
			200: {
				description: 'Success',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								message: { type: 'string' },
								session_key: { type: 'string' },
							},
							required: ['message', 'sessionKey', 'JSESSIONID', 'SRV'],
						},
					},
				},
			},
		},
	};

	async handle(ctx: AppContext) {
		const { loginId, password, captcha, JSESSIONID, SRV }: login = await ctx.req.json();
		if (!loginId || !password || !captcha) {
			return ctx.json({ message: 'error', error: 'Missing required fields' });
		}

		try {
			const headers = {
				'User-Agent':
					'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
				Accept:
					'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
				'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
				'Content-Type': 'application/x-www-form-urlencoded',
				Origin: 'https://highschool.kh.edu.tw',
				Referer: 'https://highschool.kh.edu.tw/Login.action',
				cookie: `JSESSIONID=${JSESSIONID};SRV=${SRV};`,
			};

			const body = new URLSearchParams({
				schNo: '124311D',
				loginId,
				password,
				validateCode: captcha,
				formToken: '',
				formt: '',
				sub: '',
				idToken: '',
				sessionState: '',
				client_id: '',
			});

			const res = await fetch('https://highschool.kh.edu.tw/Login.action', {
				method: 'POST',
				headers: headers,
				body: body.toString(),
			});
			const text = await res.text();

			const match = text.match(/<input[^>]*name=["']session_key["'][^>]*value=["']([^"']+)["']/);
			const sessionKey = match?.[1];

			return ctx.json({ message: 'success', session_key: sessionKey });
		} catch (error) {
			if (error instanceof Error) {
				return ctx.json({ message: 'error', error: error.message });
			}
		}
	}
}
