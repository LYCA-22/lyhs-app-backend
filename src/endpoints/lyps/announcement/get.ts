import { OpenAPIRoute } from 'chanfana';
import { AppContext } from '../../..';
import { globalErrorHandler } from '../../../utils/errorHandler';

export class GetAnnouncement extends OpenAPIRoute {
	async handle(ctx: AppContext) {
		try {
			const id = ctx.req.query('id');
			const result = await ctx.env.DATABASE.prepare('SELECT * FROM announcement WHERE id = ?').bind(id).all();

			const item = result.results[0];
			const datas = {
				id: item.id,
				title: item.title,
				content: item.content,
				info: JSON.parse(item.info as string),
				imgData: item.imgData,
				createdAt: item.createdAt,
				updatedAt: item.updatedAt,
			};
			return ctx.json({ data: datas }, 200);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
