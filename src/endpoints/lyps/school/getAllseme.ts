import { OpenAPIRoute } from 'chanfana';
import { AppContext } from '../../..';
import { errorHandler, KnownErrorCode } from '../../../utils/error';
import { globalErrorHandler } from '../../../utils/errorHandler';

export class getAllSeme extends OpenAPIRoute {
	async handle(ctx: AppContext) {
		const { sessionKey, jsessionId, srv } = await ctx.req.json();

		if (!sessionKey || !jsessionId || !srv) {
			throw new errorHandler(KnownErrorCode.MISSING_REQUIRED_FIELDS);
		}

		try {
			const res = await fetch(
				`https://highschool.kh.edu.tw/A0410S_StdSemeView_select.action?queryKind=a0410s&statusM=15&_search=false&nd=1751641303922&rows=-1&page=1&sidx=syear%2Cseme&sord=asc&session_key=${sessionKey}`,
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

			return ctx.json({ result: result }, 200);
		} catch (error) {
			return globalErrorHandler(error as Error, ctx);
		}
	}
}
