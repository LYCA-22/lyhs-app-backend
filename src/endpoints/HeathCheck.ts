import { AppContext } from '..';

export async function healthCheck(ctx: AppContext) {
	return ctx.json(
		{
			status: 'healthy',
			timestamp: new Date().toISOString(),
		},
		200,
	);
}
