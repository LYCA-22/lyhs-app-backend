import { userRegister, userLogin, changePassword, sendRpEmail, resetPassword, veritySession} from "./auth";
import { getAllAnnouncements } from "./lyhs-plus/school-announcements/index";
import { addNewUser } from "./lyhs-plus/web-beta-user-list/index";
import { Env } from "./types";
const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
	async fetch(request: Request, env: Env) {
		return handleRequest(request, env);
	}
}
async function handleRequest(request: Request, env: Env) {
	const url = new URL(request.url);
	// 處理 CORS 預檢請求
	if (request.method === 'OPTIONS') {
		return new Response(null, { status: 204, headers: CORS_HEADERS });
	}

	if (request.method === 'POST') {
		if (request.url.endsWith('/userRegister')) {
			return await userRegister(request, env);
		} else if (request.url.endsWith('/userLogin')) {
			return await userLogin(request, env);
		} else if (request.url.endsWith('/changePassword')) {
			return await changePassword(request, env);
		} else if (request.url.endsWith('/sendRpEmail')) {
			return await sendRpEmail(request, env);
		} else if (url.pathname === '/resetpassword') {
			return await resetPassword(request, env);
		} else if (url.pathname === '/addNewBetaUser') {
			return await addNewUser(request, env);
		}
	}

	if (request.method === 'GET') {
		if (url.pathname === '/veritySession') {
			return await veritySession(request, env);
		} else if (request.url.endsWith('/getAD')) {
			return await getAllAnnouncements();
		} else if (request.url.endsWith('/getFiles')) {
			return await fetchSharePointFiles(env);
		} else if (url.pathname === '/getView') {
			return await getViewUrl(request, env);
	}
	return createResponse({ error: 'Not Found' }, 404);
}

// 获取 SharePoint 文件列表
async function fetchSharePointFiles(env) {
	try {
		// 1. 獲取 token
		const accessToken = await getAccessToken(env);
		// 2. 獲取 site ID
		const siteId = await getSiteId('LYCA', accessToken);
		// 3. 獲取 drive ID
		const driveId = await getDrives(siteId, accessToken);
		// 4. 獲取文件列表
		const files = await getFiles(driveId, accessToken);

		return createResponse(files, 200)
	} catch (error) {
		console.error('Error in fetchSharePointFiles:', error);
		throw error;
	}
}
// 获取站点 ID
async function getSiteId(siteName, accessToken) {
	const url = `https://graph.microsoft.com/v1.0/sites?search=${siteName}`;
	const response = await fetch(url, {
		method: 'GET',
		headers: {
			'Authorization': `Bearer ${accessToken}`,
			'Content-Type': 'application/json'
		}
	});

	if (!response.ok) {
		throw new Error(`Error fetching site ID: ${response.statusText}`);
	}

	const data = await response.json();

	if (data.value && data.value.length > 0) {
		return data.value[0].id;  // 返回第一个站点的 ID
	} else {
		throw new Error('No sites found for the specified name.');
	}
}
// 获取驱动器（文件库）ID
async function getDrives(siteId, accessToken) {
	const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/drives`;
	const response = await fetch(url, {
		method: 'GET',
		headers: {
			'Authorization': `Bearer ${accessToken}`,
			'Content-Type': 'application/json'
		}
	});

	if (!response.ok) {
		throw new Error(`Error fetching drives: ${response.statusText}`);
	}

	const data = await response.json();

	if (data.value && data.value.length > 0) {
		return data.value[0].id;  // 假设第一个驱动器是我们需要的
	} else {
		throw new Error('No drives found for the specified site.');
	}
}
async function getAnonymousShareLink(driveId, itemId, accessToken) {
	try {
		const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/createLink`;
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				type: 'view',
				scope: 'anonymous',
				responseType: 'content'
			})
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error('完整錯誤訊息:', errorData);
			throw new Error(`Status: ${response.status}, Message: ${JSON.stringify(errorData)}`);
		}

		const data = await response.json();

		// 2. 取得直接下載連結
		const embedUrl = data.link.webUrl;
		return embedUrl;
	} catch (error) {
		console.error('分享連結創建失敗:', error);
		throw error;
	}
}
// 修改後的 getFiles 函數，加入匿名連結
async function getFiles(driveId, accessToken, folderPath = '', depth = 0, maxDepth = 5) {
	if (depth > maxDepth) return [];

	const baseUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}`;
	const url = folderPath
		? `${baseUrl}/root:/${encodeURIComponent(folderPath)}:/children`
		: `${baseUrl}/root/children`;

	const response = await fetch(url, {
		headers: { Authorization: `Bearer ${accessToken}` }
	});

	const data = await response.json();

	if (!data.value) return [];

	const files = [];

	for (const file of data.value) {
		try {
			if (file.folder) {
				// 如果是資料夾，遞歸獲取子檔案
				file.children = await getFiles(
					driveId,
					accessToken,
					`${folderPath}/${file.name}`,
					depth + 1,
					maxDepth
				);
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
async function getAccessToken(env) {
	const { TENANT_ID, CLIENT_SECRET, CLIENT_ID } = env;
	const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

	const body = new URLSearchParams({
		grant_type: "client_credentials",
		client_id: CLIENT_ID,
		client_secret: CLIENT_SECRET,
		scope: "https://graph.microsoft.com/.default",
	});

	try {
		const response = await fetch(tokenUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body,
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error("Token error response:", errorText);
			throw new Error(`Failed to obtain access token: ${response.statusText}`);
		}
		const data = await response.json();
		return data.access_token;
	} catch (error) {
		console.error('取得 Token 時發生錯誤：', error);
		throw error;
	}
}
// 前端請求獲取檔案預覽(訪客)
async function getViewUrl(request, env) {
	const url = new URL(request.url);
	const fileId = url.searchParams.get('fileId');
	const accessToken = await getAccessToken(env);
	console.log(accessToken)
	if (!fileId) {
		return createResponse("文件 ID 未提供", 400 );
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
			method: "GET",
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (!response.ok) {
			console.error("请求失败:", response.status, await response.text());
			return createResponse("無法獲取文件", response.status );
		}

		// 转发文件响应
		return new Response(response.body, {
			status: response.status,
			headers: {
				...CORS_HEADERS,
				"Content-Type": response.headers.get("Content-Type") || "application/octet-stream",
				"Content-Disposition": response.headers.get("Content-Disposition") || `attachment; filename="${fileId}"`
			},
		});
	} catch (error) {
		console.error("文件處理錯誤]:", error);
		return createResponse(error, 500);
	}
}
}

function createResponse(data, status) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			...CORS_HEADERS,
			'Content-Type': 'application/json'
		}
	});
}

export { createResponse };
