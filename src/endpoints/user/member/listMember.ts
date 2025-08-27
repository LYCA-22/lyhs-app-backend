import { OpenAPIRoute } from 'chanfana';
import { AppContext } from '../../..';
import { verifySession } from '../../../utils/verifySession';
import { getUserById } from '../../../utils/getUserData';
import { userData } from '../../../types';
import { errorHandler, KnownErrorCode } from '../../../utils/error';
import { globalErrorHandler } from '../../../utils/errorHandler';

export class listMember extends OpenAPIRoute {
	async handle(ctx: AppContext) {
		try {
			const userId = await verifySession(ctx);
			const results = (await getUserById(userId as string, ctx)) as userData;

			const userType = results.type;
			if (userType !== 'staff') {
				throw new errorHandler(KnownErrorCode.FORBIDDEN);
			}

			const result = await ctx.env.DATABASE.prepare('SELECT * FROM member_info').all();

			const memberList = result.results.map((member) => ({
				id: member.id,
				name: member.name,
				stu_id: member.stu_id,
				info: JSON.parse(member.info as string),
				status: JSON.parse(member.status as string),
				lyps_id: member.lyps_id,
			}));

			return ctx.json({ data: memberList });
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
