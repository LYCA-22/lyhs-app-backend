import { OpenAPIRoute } from 'chanfana';
import { AppContext } from '../../..';
import { verifySession } from '../../../utils/verifySession';
import { globalErrorHandler } from '../../../utils/errorHandler';

export class getServices extends OpenAPIRoute {
	async handle(ctx: AppContext) {
		try {
			await verifySession(ctx);
			const service = await ctx.env.DATABASE.prepare('SELECT * FROM services').all();
			return ctx.json({ data: service.results }, 200);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
