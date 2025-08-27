import { OpenAPIRoute } from 'chanfana';
import { AppContext } from '../../..';
import { globalErrorHandler } from '../../../utils/errorHandler';
import { verifySession } from '../../../utils/verifySession';

export class addNewAnnouncement extends OpenAPIRoute {
	async handle(ctx: AppContext) {
		try {
			const { title, content, isPriority, imgData, link, haveLink } = await ctx.req.json();
			const userId = await verifySession(ctx);
			const info = {
				isPriority: isPriority,
				link: {
					haveLink: haveLink,
					link: link,
				},
				created_info: {
					created_userId: userId,
				},
			};

			await ctx.env.DATABASE.prepare('INSERT INTO announcement (title, content, info, imgData) VALUES (?, ?, ?, ?)')
				.bind(title, content, JSON.stringify(info), imgData)
				.run();

			return ctx.json(200);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
