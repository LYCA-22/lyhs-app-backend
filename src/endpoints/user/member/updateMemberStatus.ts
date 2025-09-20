import { OpenAPIRoute } from 'chanfana';
import { AppContext } from '../../..';
import { globalErrorHandler } from '../../../utils/errorHandler';
import { errorHandler, KnownErrorCode } from '../../../utils/error';
import { getUserById } from '../../../utils/getUserData';
import { verifySession } from '../../../utils/verifySession';
import { userData } from '../../../types';

interface updateData {
	id: string;
	info: {
		stu: {
			name: string;
			number: number;
			class: string;
			grade: string;
		};
		school: {
			id: number;
			full_name: string;
			short_name: string;
			hd: 'ms.ly.kh.edu.tw';
		};
		memberShip: {
			isActive: boolean;
			actived_at: string;
			underTaker: string;
			updated_at: string;
		};
	};
}

export class updateMemberStatus extends OpenAPIRoute {
	async handle(ctx: AppContext) {
		try {
			const { ids }: { ids: updateData[] } = await ctx.req.json();
			const userId = await verifySession(ctx);
			const results = (await getUserById(userId as string, ctx)) as userData;

			const userType = results.type;
			if (userType !== 'staff') {
				throw new errorHandler(KnownErrorCode.FORBIDDEN);
			}

			for (const user of ids) {
				await ctx.env.DATABASE.prepare('UPDATE member_info SET info = ? WHERE id = ?').bind(JSON.stringify(user.info), user.id).run();
			}

			return ctx.json(200);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
