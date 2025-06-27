import { OpenAPIRoute } from 'chanfana';
import { AppContext } from '../../..';

export class getScore extends OpenAPIRoute {
	async handle(ctx: AppContext) {
		const { sessionKey, jsessionId, srv, itemId } = await ctx.req.json();

		if (!sessionKey || !jsessionId || !srv || !itemId) {
			return ctx.json({ error: 'No information' }, 404);
		}

		try {
			const res = await fetch(
				`
				https://highschool.kh.edu.tw/A0410S_OpenItemScoreView_selectA0410s.action?itemId=${itemId}&_search=false&nd=1748777267358&rows=-1&page=1&sidx=syear&sord=asc&session_key=${sessionKey}`,
				{
					method: 'POST',
					headers: {
						'User-Agent':
							'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
						Accept: 'application/json, text/javascript, */*; q=0.01',
						'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
						'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
						Origin: 'https://highschool.kh.edu.tw',
						Referer: 'https://highschool.kh.edu.tw/Index.action',
						cookie: `JSESSIONID=${jsessionId}; SRV=${srv}`,
					},
				},
			);

			const result = await res.json();

			const res2 = await fetch(
				`

				https://highschool.kh.edu.tw/A0410S_ItemScoreStat_select.action?itemId=${itemId}&_search=false&nd=1748777267358&rows=-1&page=1&sidx=syear&sord=asc&session_key=${sessionKey}`,
				{
					method: 'POST',
					headers: {
						'User-Agent':
							'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
						Accept: 'application/json, text/javascript, */*; q=0.01',
						'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
						'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
						Origin: 'https://highschool.kh.edu.tw',
						Referer: 'https://highschool.kh.edu.tw/Index.action',
						cookie: `JSESSIONID=${jsessionId}; SRV=${srv}`,
					},
				},
			);

			const result2 = await res2.json();

			return ctx.json({ result: result, state: result2 }, 200);
		} catch (e) {
			if (e instanceof Error) {
				return ctx.json({ error: e }, 500);
			}
		}
	}
}
