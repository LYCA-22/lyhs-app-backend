import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';

interface PushSubscription {
	endpoint: string;
	keys: {
		p256dh: string;
		auth: string;
	};
}

export class PushNews extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '建立廣播訊息',
		tags: ['校園資訊'],
	};

	async sendPushNotification(subscription: PushSubscription, payload: string, vapidKeys: { publicKey: string; privateKey: string }) {
		// Web Push 需要特定的加密和格式，使用另一個伺服器來處理這部分
		const pushService = 'https://plus.lyhsca.org/api/v1/send';

		try {
			const response = await fetch(pushService, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					subscription,
					payload,
					vapidDetails: {
						subject: 'mailto:contact@lyhsca.org',
						publicKey: vapidKeys.publicKey,
						privateKey: vapidKeys.privateKey,
					},
				}),
			});

			if (!response.ok) {
				throw new Error(`Push service responded with ${response.status}: ${await response.text()}`);
			}

			return await response.json();
		} catch (error) {
			console.error('Failed to send push notification:', error);
			throw error;
		}
	}

	async handle(ctx: AppContext) {
		try {
			const {
				title,
				content,
			}: {
				title: string;
				content: string;
			} = await ctx.req.json();
			const env = ctx.env;

			if (!title || !content) {
				return ctx.json({ error: 'Missing required fields' }, 400);
			}

			const vapidKeys = {
				publicKey: env.VAPID_PUBLIC_KEY,
				privateKey: env.VAPID_PRIVATE_KEY,
			};

			const { results: subscriptions } = await ctx.env.DATABASE.prepare('SELECT subscription FROM subscriptions').all<{
				subscription: string;
			}>();

			if (!subscriptions || !subscriptions.length) {
				return ctx.json({ message: 'No subscriptions found' }, 200);
			}

			const payload = JSON.stringify({ title, content });

			const results = [];
			for (const row of subscriptions) {
				try {
					const subscription = JSON.parse(row.subscription) as PushSubscription;
					console.log('Sending to subscription:', JSON.stringify(subscription).substring(0, 100) + '...');

					// 使用我們的推送服務發送通知
					await this.sendPushNotification(subscription, payload, vapidKeys);
					results.push({ status: 'fulfilled' });
				} catch (err) {
					console.error('Error sending to subscription:', err);
					results.push({ status: 'rejected', reason: err });
				}
			}

			return ctx.json({
				success: results.filter((r) => r.status === 'fulfilled').length,
				failed: results.filter((r) => r.status === 'rejected').length,
			});
		} catch (error) {
			console.error('Push notification error:', error);
			if (error instanceof Error) {
				console.error('Error message:', error.message);
				console.error('Error stack:', error.stack);
			}
			return ctx.json(
				{
					error: 'Failed to send notification',
					message: error instanceof Error ? error.message : String(error),
				},
				500,
			);
		}
	}
}
