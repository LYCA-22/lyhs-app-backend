import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import type { AppContext } from '..';

export class ServiceStatus extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '取得服務狀態',
		tags: ['基礎建設'],
		description: 'LYHS+ 系統運作狀態',
		responses: {
			'200': {
				description: '請求成功',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								status: {
									type: 'string',
									example: 'operational',
								},
								version: {
									type: 'string',
									example: '1.0.0',
								},
								service: {
									type: 'object',
									properties: {
										database: {
											type: 'object',
											properties: {
												status: {
													type: 'string',
													example: 'connected',
												},
												latency: {
													type: 'string',
													example: '854ms',
												},
											},
										},
									},
								},
								timestamp: {
									type: 'string',
									example: '2025-02-22T15:13:29.274Z',
								},
								environment: {
									type: 'string',
									example: 'production',
								},
							},
						},
					},
				},
			},
			'500': {
				description: '發生不明錯誤',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
									example: 'Error check service status',
								},
							},
						},
					},
				},
			},
		},
	};

	async handle(ctx: AppContext) {
		try {
			const dbStatus = await checkDatabaseConnection(ctx);
			return ctx.json(
				{
					status: dbStatus.status === 'connected' ? 'operational' : 'degraded',
					version: '1.0.0',
					services: {
						database: dbStatus,
					},
					timestamp: new Date().toISOString(),
					environment: 'production',
				},
				200,
			);
		} catch (error) {
			return ctx.json(
				{
					status: 'degraded',
					error: 'System status check failed',
					timestamp: new Date().toISOString(),
				},
				500,
			);
		}
	}
}

async function checkDatabaseConnection(ctx: AppContext) {
	try {
		const startTime = Date.now();
		await ctx.env.DATABASE.prepare('SELECT 1').run();
		const endTime = Date.now();

		return {
			status: 'connected',
			latency: `${endTime - startTime}ms`,
		};
	} catch (error: any) {
		return {
			status: 'disconnected',
			error: error.message,
		};
	}
}
