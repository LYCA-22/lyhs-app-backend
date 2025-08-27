import { OpenAPIRoute } from 'chanfana';
import { AppContext } from '../../..';
import { globalErrorHandler } from '../../../utils/errorHandler';

export class ListAnnouncement extends OpenAPIRoute {
	async handle(ctx: AppContext) {
		try {
			const result = await ctx.env.DATABASE.prepare('SELECT * FROM announcement').all();

			const datas = result.results.map((item) => ({
				id: item.id,
				title: item.title,
				content: item.content,
				info: JSON.parse(item.info as string),
				imgData: item.imgData,
				createdAt: item.createdAt,
				updatedAt: item.updatedAt,
			}));
			return ctx.json({ data: datas }, 200);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
