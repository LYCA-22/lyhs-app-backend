import { OpenAPIRoute } from 'chanfana';
import { AppContext } from '../..';
import { globalErrorHandler } from '../../utils/errorHandler';
import { verifySession } from '../../utils/verifySession';

export class updateUserInfo extends OpenAPIRoute {
	async handle(ctx: AppContext) {
		try {
			const { name, Class, grade, number, stuId } = await ctx.req.json();
			const userId = await verifySession(ctx);

			await ctx.env.DATABASE.prepare('UPDATE accountData SET name = ?, Class = ?, grade = ?, number = ?, stuId = ? WHERE id = ?')
				.bind(name, Class, grade, number, stuId, userId)
				.run();

			return ctx.json(200);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
