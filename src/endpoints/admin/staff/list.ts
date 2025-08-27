import { OpenAPIRoute } from 'chanfana';
import { AppContext } from '../../..';
import { AuthorizationHelper, globalErrorHandler } from '../../../utils/errorHandler';
import { verifySession } from '../../../utils/verifySession';

export class listStaff extends OpenAPIRoute {
	async handle(ctx: AppContext) {
		try {
			const userId = await verifySession(ctx);
			const { results } = await ctx.env.DATABASE.prepare('SELECT type FROM accountData WHERE id = ?').bind(userId).all();
			AuthorizationHelper.requireStaff((results[0].type as string) || '');

			const data = await ctx.env.DATABASE.prepare('SELECT name, email, level, class, grade, number, role FROM accountData WHERE type = ?')
				.bind('staff')
				.all();

			return ctx.json({ data: data }, 200);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
