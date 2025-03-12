import { createRouter } from '../..';
import { PushNews } from './push';
import { SubscribePush } from './subscribe';

export function registerRadioRoutes() {
	const router = createRouter();

	router.post('/push', PushNews);
	router.post('/subscribe', SubscribePush);
	return router;
}
