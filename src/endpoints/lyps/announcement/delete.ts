import { OpenAPIRoute } from 'chanfana';
import { AppContext } from '../../..';
import { globalErrorHandler } from '../../../utils/errorHandler';
import { verifySession } from '../../../utils/verifySession';

export class DeleteAnnouncement extends OpenAPIRoute {
	async handle(ctx: AppContext) {
		try {
			const id = ctx.req.query('id');
			await verifySession(ctx);

			await ctx.env.DATABASE.prepare('DELETE FROM announcement WHERE id = ?').bind(id).run();

			return ctx.json(200);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
