import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';
import { globalErrorHandler } from '../../../utils/errorHandler';

export class SubscribePush extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '訂閱推送通知',
		tags: ['校園資訊'],
	};

	async handle(ctx: AppContext) {
		try {
			const { subscription } = await ctx.req.json();
			const db = ctx.env.DATABASE;

			if (!subscription) {
				return ctx.json({ error: 'Missing subscription data' }, 400);
			}

			await db.prepare('INSERT INTO subscriptions (subscription) VALUES (?)').bind(JSON.stringify(subscription)).run();

			return ctx.json({ success: true });
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
