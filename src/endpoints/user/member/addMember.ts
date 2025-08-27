import { OpenAPIRoute } from 'chanfana';
import { AppContext } from '../../..';
import { verifySession } from '../../../utils/verifySession';
import { getUserById } from '../../../utils/getUserData';
import { userData } from '../../../types';
import { errorHandler, KnownErrorCode } from '../../../utils/error';
import { globalErrorHandler } from '../../../utils/errorHandler';

export interface memberDataRaw {
	name: string;
	stu_id: string;
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
	status: {
		lyps: {
			isLypsUser: boolean;
			isconnected: boolean;
			connected_at: string;
		};
	};
	lyps_id: string;
}

export class addMember extends OpenAPIRoute {
	async handle(ctx: AppContext) {
		try {
			const { data } = (await ctx.req.json()) as { data: memberDataRaw[] };

			const userId = await verifySession(ctx);
			const results = (await getUserById(userId as string, ctx)) as userData;

			const userType = results.type;
			if (userType !== 'staff') {
				throw new errorHandler(KnownErrorCode.FORBIDDEN);
			}

			for (const member of data) {
				await ctx.env.DATABASE.prepare('INSERT INTO member_info (name, stu_id, info, status, lyps_id) VALUES (?, ?, ?, ?, ?)')
					.bind(member.name, member.stu_id, JSON.stringify(member.info), JSON.stringify(member.status), member.lyps_id)
					.run();
			}

			return ctx.json(200);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
