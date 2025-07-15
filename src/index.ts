import { Hono, Context } from 'hono';
import { HonoOpenAPIRouterType } from 'chanfana';
import { configureOpenApi } from './core/openapi';
import { registerEndpoints } from './endpoints';
import { EnvConfig } from './utils/env';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

export type AppOptions = { Bindings: EnvConfig };
export type AppRouter = HonoOpenAPIRouterType<AppOptions>;
export type AppContext = Context<AppOptions>;

const app = new Hono<AppOptions>();
const openapi = configureOpenApi(app);

openapi
	.use(
		cors({
			origin: [
				'https://chat.lyhsca.org',
				'https://admin.lyhsca.org',
				'https://auth.lyhsca.org',
				'https://app.lyhsca.org',
				'http://172.20.10.2:3000',
				'https://events.lyhsca.org',
			],
			credentials: true,
		}),
	)
	.use(logger());

openapi.route('/v1', registerEndpoints());

export default {
	fetch: app.fetch,
};
