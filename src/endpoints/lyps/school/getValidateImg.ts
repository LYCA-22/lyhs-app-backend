import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';

interface img {
	height: number;
	width: number;
	message: null;
	src: string;
}

function getSetCookieHeaders(headers: Headers): string[] {
	const cookies: string[] = [];
	headers.forEach((value, key) => {
		if (key.toLowerCase() === 'set-cookie') {
			cookies.push(value);
		}
	});
	return cookies;
}

export class getValidateImg extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '獲取高雄市校務系統驗證碼圖片',
		tags: ['校務系統'],
		description: '獲取高雄市校務系統驗證碼圖片與相關 Cookie',
		responses: {
			200: {
				description: '成功獲取驗證碼圖片與相關 Cookie',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								message: { type: 'string' },
								src: { type: 'string' },
								JSEESIONID: { type: 'string' },
								SRV: { type: 'string' },
							},
							required: ['message', 'src', 'cookie'],
						},
					},
				},
			},
		},
	};

	async handle(ctx: AppContext) {
		const img = await fetch('https://highschool.kh.edu.tw/Validate.action');
		const img_src: img = await img.json();

		const setCookies = getSetCookieHeaders(img.headers);
		const cookieString = setCookies.map((c) => c.split(';')[0]).join('; ');
		const JSEESIONID = cookieString.split('; ')[0].split('=')[1];
		const SRV = cookieString.split('; ')[1].split('=')[1];

		return ctx.json({ message: 'success', src: img_src.src, JSEESIONID: JSEESIONID, SRV: SRV }, 200);
	}
}
