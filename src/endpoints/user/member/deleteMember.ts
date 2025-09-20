import { OpenAPIRoute } from 'chanfana';
import { AppContext } from '../../..';
import { globalErrorHandler } from '../../../utils/errorHandler';
import { verifySession } from '../../../utils/verifySession';
import { userData } from '../../../types';
import { getUserById } from '../../../utils/getUserData';
import { errorHandler, KnownErrorCode } from '../../../utils/error';

export class deleteMember extends OpenAPIRoute {
	async handle(ctx: AppContext) {
		try {
			const id = ctx.req.query('id');
			const userId = await verifySession(ctx);
			const results = (await getUserById(userId as string, ctx)) as userData;

			const userType = results.type;
			if (userType !== 'staff') {
				throw new errorHandler(KnownErrorCode.FORBIDDEN);
			}

			await ctx.env.DATABASE.prepare('DELETE FROM member_info WHERE id = ?').bind(id).run();

			return ctx.json(200);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
