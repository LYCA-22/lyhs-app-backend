import { OpenAPIRoute } from 'chanfana';
import { AppContext } from '../../..';
import { AuthorizationHelper, globalErrorHandler } from '../../../utils/errorHandler';
import { verifySession } from '../../../utils/verifySession';
import { errorHandler, KnownErrorCode } from '../../../utils/error';

export class deleteStaff extends OpenAPIRoute {
	async handle(ctx: AppContext) {
		const { id } = await ctx.req.json();
		try {
			if (!id) throw new errorHandler(KnownErrorCode.MISSING_REQUIRED_FIELDS);
			await verifySession(ctx);

			await ctx.env.DATABASE.prepare('DELETE FROM accountData WHERE id = ?').bind(id).run();
			return ctx.json({ message: 'Staff deleted successfully' }, 200);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
