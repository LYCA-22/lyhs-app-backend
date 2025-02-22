import type { AppContext } from '..';

export async function ServiceStatus(ctx: AppContext) {
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
