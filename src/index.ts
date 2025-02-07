import { handleAuthRoute } from './auth';
import { getAllAnnouncements } from './lyhs-plus/school-announcements/index';
import { addProject, deleteProject, updateProject, getProjectList, viewProject, getProjectData } from './mailbox/student';
import { Env } from './types';
import { addNewUser } from './lyhs-plus/web-beta-user-list';

import { openapiSpec } from './openapi';
import { getAllEvents, addEvent, deleteEvent, updateEvent } from './calendar/index';

export default {
	async fetch(request: Request, env: Env) {
		return handleRequest(request, env);
	},
};

async function handleRequest(request: Request, env: Env) {
	try {
		const url = new URL(request.url);
		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: CORS_HEADERS });
		}

		// 導引到帳號相關的路由
		if (url.pathname.startsWith('/auth')) {
			return await handleAuthRoute(request, env);
		}

		if (request.method === 'POST') {
			if (url.pathname === '/mail/project/add') {
				return await addProject(request, env);
			} else if (url.pathname === '/mail/project/update') {
				return await updateProject(request, env);
			} else if (url.pathname === '/mail/project/view') {
				return await viewProject(request, env);
			} else if (url.pathname === '/mail/project/list') {
				return await getProjectList(request, env);
			} else if (url.pathname === '/mail/project/detail') {
				return await getProjectData(request, env);
			} else if (url.pathname === '/auth/getAllCode') {
				return await listAllStaffCode(request, env);
			} else if (url.pathname === '/event/add') {
				return await addEvent(env, request);
			} else if (url.pathname === '/event/delete') {
				return await deleteEvent(env, request);
			} else if (url.pathname === '/event/update') {
				return await updateEvent(env, request);
			} else if (url.pathname.endsWith('/addNewBetaUser')) {
				return await addNewUser(request, env);
			}
		}

		if (request.method === 'GET') {
			if (request.url.endsWith('/getAD')) {
				return await getAllAnnouncements();
			} else if (request.url.endsWith('/getFiles')) {
				return await fetchSharePointFiles(env);
			} else if (url.pathname === '/getView') {
				return await getViewUrl(request, env);
			} else if (url.pathname === '/status') {
				return await getSystemStatus(env);
			} else if (url.pathname === '/health') {
				return await healthCheck(env);
			} else if (url.pathname === '/test') {
				return await Test();
			} else if (url.pathname === '/event/all') {
				return await getAllEvents(env);
			}
		}

		if (request.method === 'DELETE') {
			if (url.pathname === '/mail/project/delete') {
				return await deleteProject(request, env);
			}
		}

		if (request.method === 'GET') {
			if (url.pathname === '/openapi.yaml') {
				return new Response(openapiSpec, {
					headers: { 'Content-Type': 'application/yaml' },
				});
			} else if (url.pathname === '/docs') {
				return new Response(swaggerHtml, {
					headers: { 'Content-Type': 'text/html' },
				});
			}
		}

		return createResponse({ error: 'Not Found' }, 404);
	} catch (error) {
		console.error('發生錯誤:', error);
		return createResponse({ error: '服務器內部錯誤' }, 500);
	}
}

export const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
export function createResponse(data: object, status: number) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			...CORS_HEADERS,
			'Content-Type': 'application/json',
		},
	});
}

async function Test() {
	try {
		const res = await fetch(
			'https://www.ly.kh.edu.tw/view/index.php?WebID=336&MainType=101&SubType=0&MainMenuId=61299&SubMenuId=0&NowMainId=61299&NowSubId=0',
		);
		const data = await res.text();
		return createResponse({ data: data }, 200);
	} catch (error) {
		console.error('Error in getData:', error);
		return createResponse({ error: 'Error fetching data' }, 500);
	}
}

async function getSystemStatus(env: Env) {
	try {
		const dbStatus = await checkDatabaseConnection(env);
		return createResponse(
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
		return createResponse(
			{
				status: 'degraded',
				error: 'System status check failed',
				timestamp: new Date().toISOString(),
			},
			500,
		);
	}
}

async function healthCheck(env: Env) {
	return createResponse(
		{
			status: 'healthy',
			timestamp: new Date().toISOString(),
		},
		200,
	);
}

async function checkDatabaseConnection(env: Env) {
	try {
		const startTime = Date.now();
		await env.DATABASE.prepare('SELECT 1').run();
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

// LYCA Drive
async function fetchSharePointFiles(env: Env) {
	try {
		// 1. 獲取 token
		const accessToken = await getAccessToken(env);
		// 2. 獲取 site ID
		const siteId = await getSiteId('LYCA', accessToken);
		// 3. 獲取 drive ID
		const driveId = await getDrives(siteId, accessToken);
		// 4. 獲取文件列表
		const files = await getFiles(driveId, accessToken);

		return createResponse(files, 200);
	} catch (error) {
		console.error('Error in fetchSharePointFiles:', error);
		throw error;
	}
}

async function getSiteId(siteName: string, accessToken: string) {
	const url = `https://graph.microsoft.com/v1.0/sites?search=${siteName}`;
	const response = await fetch(url, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
		},
	});

	if (!response.ok) {
		throw new Error(`Error fetching site ID: ${response.statusText}`);
	}

	const data: any = await response.json();

	if (data.value && data.value.length > 0) {
		return data.value[0].id; // 返回第一个站点的 ID
	} else {
		throw new Error('No sites found for the specified name.');
	}
}

async function getDrives(siteId: string, accessToken: string) {
	const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/drives`;
	const response = await fetch(url, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
		},
	});

	if (!response.ok) {
		throw new Error(`Error fetching drives: ${response.statusText}`);
	}

	const data: any = await response.json();

	if (data.value && data.value.length > 0) {
		return data.value[0].id; // 假设第一个驱动器是我们需要的
	} else {
		throw new Error('No drives found for the specified site.');
	}
}

async function getAnonymousShareLink(driveId: string, itemId: string, accessToken: string) {
	try {
		const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/createLink`;
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				type: 'view',
				scope: 'anonymous',
				responseType: 'content',
			}),
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error('完整錯誤訊息:', errorData);
			throw new Error(`Status: ${response.status}, Message: ${JSON.stringify(errorData)}`);
		}

		const data: any = await response.json();

		// 2. 取得直接下載連結
		const embedUrl = data.link.webUrl;
		return embedUrl;
	} catch (error) {
		console.error('分享連結創建失敗:', error);
		throw error;
	}
}

// 修改後的 getFiles 函數，加入匿名連結
async function getFiles(driveId: string, accessToken: string, folderPath = '', depth = 0, maxDepth = 5) {
	if (depth > maxDepth) return [];

	const baseUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}`;
	const url = folderPath ? `${baseUrl}/root:/${encodeURIComponent(folderPath)}:/children` : `${baseUrl}/root/children`;

	const response = await fetch(url, {
		headers: { Authorization: `Bearer ${accessToken}` },
	});

	const data: any = await response.json();

	if (!data.value) return [];

	const files = [];

	for (const file of data.value) {
		try {
			if (file.folder) {
				// 如果是資料夾，遞歸獲取子檔案
				file.children = await getFiles(driveId, accessToken, `${folderPath}/${file.name}`, depth + 1, maxDepth);
			}

			files.push(file);
		} catch (error) {
			console.error(`Error processing file ${file.name}:`, error);
			// 繼續處理其他檔案
		}
	}
	return files;
}

// 获取文件庫 Token 的逻辑
async function getAccessToken(env: any) {
	const { TENANT_ID, CLIENT_SECRET, CLIENT_ID } = env;
	const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

	const body = new URLSearchParams({
		grant_type: 'client_credentials',
		client_id: CLIENT_ID,
		client_secret: CLIENT_SECRET,
		scope: 'https://graph.microsoft.com/.default',
	});

	try {
		const response = await fetch(tokenUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body,
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('Token error response:', errorText);
			throw new Error(`Failed to obtain access token: ${response.statusText}`);
		}
		const data: any = await response.json();
		return data.access_token;
	} catch (error) {
		console.error('取得 Token 時發生錯誤：', error);
		throw error;
	}
}

// 前端請求獲取檔案預覽(訪客)
async function getViewUrl(request: Request, env: Env) {
	const url = new URL(request.url);
	const fileId = url.searchParams.get('fileId');
	const accessToken = await getAccessToken(env);
	console.log(accessToken);
	if (!fileId) {
		return createResponse({ error: '文件 ID 未提供' }, 400);
	}
	// 2. 獲取 site ID
	console.log('Fetching site ID...');
	const siteId = await getSiteId('LYCA', accessToken);
	console.log('Site ID obtained:', siteId);

	// 3. 獲取 drive ID
	console.log('Fetching drive ID...');
	const driveId = await getDrives(siteId, accessToken);
	console.log('Drive ID obtained:', driveId);

	try {
		// 构建 SharePoint 文件 URL
		const fileUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/content`;

		// 向 SharePoint 发送请求
		const response = await fetch(fileUrl, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (!response.ok) {
			console.error('请求失败:', response.status, await response.text());
			return createResponse({ error: '無法獲取文件' }, response.status);
		}

		// 转发文件响应
		return new Response(response.body, {
			status: response.status,
			headers: {
				...CORS_HEADERS,
				'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
				'Content-Disposition': response.headers.get('Content-Disposition') || `attachment; filename="${fileId}"`,
			},
		});
	} catch (error: any) {
		console.error('文件處理錯誤]:', error);
		return createResponse(error, 500);
	}
}

const swaggerHtml = `
	<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LYHS App API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css" />
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        background-color: #f8f9fa;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      }

      .wrapper{
        padding: 20px !important;
        padding-bottom: 0px !important;
      }

      .filter{
      	padding-top: 0px !important;
        padding-bottom: 0px !important;
      }

      .info{
     	  margin: 20px !important;
      }

      .scheme-container{
      	padding-bottom: 20px !important;
        padding: 20px !important;
      }

      /* 響應式容器 */
      #swagger-ui {
        max-width: 1200px;
        margin: 0 auto;
      }

      /* 自定義頁首樣式 */
      .swagger-ui .topbar {
        background-color: #2d3748;
      }

      .topbar{
      	display: none;
      }

      /* 改善在小螢幕上的顯示 */
      @media (max-width: 768px) {

        .swagger-ui .wrapper {
          padding: 0;
        }

        /* 改善在手機上的文字大小 */
        .swagger-ui .info .title {
          font-size: 24px;
        }

        .swagger-ui .opblock .opblock-summary-description {
          font-size: 14px;
        }
      }

      /* 改善可讀性 */
      .swagger-ui .info .title {
        font-weight: 600;
        color: #2d3748;
      }

      .swagger-ui .opblock {
        border-radius: 8px;
        margin: 0 0 15px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      /* 改善互動元素的可用性 */
      .swagger-ui .btn {
        border-radius: 4px;
        transition: all 0.2s ease;
      }

      .swagger-ui .btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      /* 改善載入狀態的視覺回饋 */
      .swagger-ui .loading-container {
        padding: 40px 0;
        text-align: center;
      }

      .swagger-ui .loading-container .loading::after {
        content: '';
        animation: dots 1.4s infinite;
      }

      @keyframes dots {
        0%, 20% { content: '.'; }
        40% { content: '..'; }
        60% { content: '...'; }
        80%, 100% { content: ''; }
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = () => {
        const ui = SwaggerUIBundle({
          url: './openapi.yaml',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
          ],
          plugins: [
            SwaggerUIBundle.plugins.DownloadUrl
          ],
          layout: "StandaloneLayout",
          docExpansion: 'none',
          defaultModelsExpandDepth: -1,
          filter: true,
          tryItOutEnabled: true,
          displayRequestDuration: true,
          requestInterceptor: (request) => {
            return request;
          },
          responseInterceptor: (response) => {
            return response;
          }
        });
        window.ui = ui;
      }
    </script>
  </body>
</html>`;
