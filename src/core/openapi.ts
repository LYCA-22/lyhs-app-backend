import { Hono } from 'hono';
import { AppOptions, AppRouter } from '..';
import { fromHono, RouterOptions } from 'chanfana';

export function configureOpenApi(app: Hono<AppOptions>) {
	const options: RouterOptions = {
		docs_url: '/swagger',
		redoc_url: '/redoc',
		schema: {
			openapi: '3.0.0',
			info: {
				title: '林園高中校園資訊整合系統 API 技術文件',
				version: '1.0.0',
				contact: {
					name: 'Zhicheng',
					url: 'https://lyhsca.org',
					email: 'cheng@lyhsca.org',
				},
			},
			servers: [
				{
					url: 'https://api.lyhsca.org',
					description: 'Production',
				},
				{
					url: 'http://localhost:8787',
					description: 'development',
				},
			],
		},
	};
	const openapi = fromHono(app, options);

	registerSecurity(openapi);
	addDocumentUI(app);

	return openapi;
}

function registerSecurity(openapi: AppRouter): void {
	openapi.registry.registerComponent('securitySchemes', 'sessionId', {
		type: 'http',
		scheme: 'bearer',
		description: 'Bearer token for authenticated users',
	});
	openapi.registry.registerComponent('securitySchemes', 'userId', {
		type: 'http',
		scheme: 'bearer',
		description: 'User Account ID',
	});
}

function addDocumentUI(app: Hono<AppOptions>) {
	const html = `<!doctype html>
<html>
  <head>
    <title>LYHS+｜API 技術文件</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  </head>
  <body>
    <script id="api-reference" data-url="openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.25"></script>
  </body>
</html>`;

	const favicon = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="500" zoomAndPan="magnify" viewBox="0 0 375 374.999991" height="500" preserveAspectRatio="xMidYMid meet" version="1.0"><defs><clipPath id="0fa1b9dbcc"><path d="M 58.5 0 L 316.5 0 C 348.808594 0 375 26.191406 375 58.5 L 375 316.5 C 375 348.808594 348.808594 375 316.5 375 L 58.5 375 C 26.191406 375 0 348.808594 0 316.5 L 0 58.5 C 0 26.191406 26.191406 0 58.5 0 Z M 58.5 0 " clip-rule="nonzero"/></clipPath><clipPath id="6344e771ce"><path d="M 142.03125 81.636719 L 301.3125 81.636719 L 301.3125 293.183594 L 142.03125 293.183594 Z M 142.03125 81.636719 " clip-rule="nonzero"/></clipPath><clipPath id="3d5f92224e"><path d="M 142.03125 240.089844 L 142.03125 134.898438 L 301.3125 81.804688 L 301.3125 293.183594 Z M 142.03125 240.089844 " clip-rule="nonzero"/></clipPath><clipPath id="aa6be5c228"><path d="M 73.667969 112.453125 L 142.011719 112.453125 L 142.011719 263 L 73.667969 263 Z M 73.667969 112.453125 " clip-rule="nonzero"/></clipPath><clipPath id="74c2ee3fe4"><path d="M 142.011719 135.234375 L 142.011719 240.21875 L 73.667969 262.996094 L 73.667969 112.453125 Z M 142.011719 135.234375 " clip-rule="nonzero"/></clipPath></defs><g clip-path="url(#0fa1b9dbcc)"><rect x="-37.5" width="450" fill="#ffffff" y="-37.499999" height="449.999989" fill-opacity="1"/></g><g clip-path="url(#6344e771ce)"><g clip-path="url(#3d5f92224e)"><path fill="#358185" d="M 142.03125 293.183594 L 142.03125 81.636719 L 301.3125 81.636719 L 301.3125 293.183594 Z M 142.03125 293.183594 " fill-opacity="1" fill-rule="nonzero"/></g></g><g clip-path="url(#aa6be5c228)"><g clip-path="url(#74c2ee3fe4)"><path fill="#55b6bc" d="M 142.011719 112.453125 L 142.011719 263.023438 L 73.667969 263.023438 L 73.667969 112.453125 Z M 142.011719 112.453125 " fill-opacity="1" fill-rule="nonzero"/></g></g><path stroke-linecap="butt" transform="matrix(0, -1.887997, 1.887997, 0, 132.584307, 248.411028)" fill="none" stroke-linejoin="miter" d="M 0.000461991 4.999547 L 72.019986 4.999547 " stroke="#ffffff" stroke-width="10" stroke-opacity="1" stroke-miterlimit="4"/></svg>`;

	app.get('/docs', () => {
		return new Response(html, { headers: { 'Content-Type': 'text/html' }, status: 200 });
	});
	app.get('/', (ctx) => {
		return ctx.redirect('/docs');
	});
	app.get('/favicon.svg', () => {
		return new Response(favicon, { headers: { 'Content-Type': 'image/svg+xml' }, status: 200 });
	});
}
