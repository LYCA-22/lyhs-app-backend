import { AppContext } from '..';
import { errorHandler, KnownErrorCode } from './error';
import { globalErrorHandler } from './errorHandler';

export async function checkService(serviceName: string, ctx: AppContext) {
	const service = await ctx.env.DATABASE.prepare('SELECT status FROM services WHERE name = ?').bind(serviceName).run();
	const data = service.results[0];
	if (!data.status) {
		throw new errorHandler(KnownErrorCode.SERVICE_UNAVAILABLE);
	}
}
