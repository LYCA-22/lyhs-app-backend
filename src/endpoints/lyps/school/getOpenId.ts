import { OpenAPIRoute } from 'chanfana';
import { AppContext } from '../../..';
import { globalErrorHandler } from '../../../utils/errorHandler';

export class getOpenId extends OpenAPIRoute {
	async handle(ctx: AppContext) {
		try {
			const grade = ctx.req.query('grade') as string;
			const classId = ctx.req.query('class') as string;
			const response = await fetch('https://openid.kh.edu.tw/fetchdataStuadm?classes/ly/114a', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
			});
			const data = (await response.json()) as string[];
			const classInfo = data[parseInt(grade)][parseInt(classId)];
			const response2 = await fetch(
				`https://openid.kh.edu.tw/fetchdataStuadm?students/ly/${classInfo[0]}/${classInfo[2]}/${classInfo[5]}/${classInfo[4]}/${classInfo[3]}/simple`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
				},
			);
			const data2 = await response2.json();
			return ctx.json({ data: data2 });
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
