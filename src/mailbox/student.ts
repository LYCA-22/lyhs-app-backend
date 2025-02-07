import { createResponse } from '../index';
import { Env, studentData } from '../types';

export async function addProject(request: Request, env: Env) {
	const { mailKV } = env;
	const { email, name, type, title, description, Class, number, solution }: studentData = await request.json();

	if (!email || !name || !type || !title || !description || !Class || !number || !solution) {
		return createResponse({ error: '資料不足' }, 400);
	}

	const code = Array.from(crypto.getRandomValues(new Uint8Array(6)))
		.map((n) => n % 10)
		.join('');
	const projectId = crypto.randomUUID();
	const createdTime = new Date().toISOString();
	const updatedTime = createdTime;

	try {
		const projectData = JSON.stringify({
			id: projectId,
			searchCode: code,
			email: email,
			name: name,
			class: Class,
			number: number,
			title: title,
			description: description,
			type: type,
			solution: solution,
			handler: '',
			status: '已接收到案件回報。',
			createdTime: createdTime,
			updatedTime: updatedTime,
		});
		await mailKV.put(code, projectData);
		return createResponse({ code: code }, 201);
	} catch (e: any) {
		console.error('Error during add project:', e.message);
		return createResponse({ error: `Error: ${e.message}` }, 500);
	}
}

export async function getProjectList(request: Request, env: Env) {
	const { mailKV, DATABASE } = env;
	const { userId }: { code: string; userId: string } = await request.json();

	if (!userId) {
		return createResponse({ error: 'User ID is missing' }, 400);
	}

	const { results } = await DATABASE.prepare('SELECT level FROM accountData WHERE id = ?').bind(userId).all();
	if (!results || results.length === 0) {
		return createResponse({ error: 'Invalid user' }, 404);
	}
	const userLevel = results[0].level;
	if (userLevel !== 'A1' && userLevel !== 'L3') {
		return createResponse({ error: 'Permission denied' }, 403);
	}

	try {
		const projectsList = await mailKV.list();
		const allProjects = [];

		// 遍歷所有 key 並獲取對應的數據
		for (const key of projectsList.keys) {
			const projectData = (await mailKV.get(key.name, { type: 'json' })) as studentData;
			if (projectData) {
				const simplifiedData = {
					id: projectData.id,
					searchCode: projectData.searchCode,
					title: projectData.title,
					status: projectData.status,
					createdTime: projectData.createdTime,
					handler: projectData.handler,
					email: projectData.email,
				};
				allProjects.push(simplifiedData);
			}
		}

		return createResponse(allProjects, 200);
	} catch (e: any) {
		console.error('Error during get project:', e.message);
		return createResponse({ error: `Error: ${e.message}` }, 500);
	}
}

export async function getProjectData(request: Request, env: Env) {
	const { mailKV, DATABASE } = env;
	const { code, userId }: { code: string; userId: string } = await request.json();

	// 檢查是否有代碼
	if (!code) {
		return createResponse({ error: 'Code is missing' }, 400);
	}

	// 檢查是否有用戶ID
	if (!userId) {
		return createResponse({ error: 'User ID is missing' }, 400);
	}

	// 檢查用戶是否存在
	const { results } = await DATABASE.prepare('SELECT level, name FROM accountData WHERE id = ?').bind(userId).all();
	if (!results || results.length === 0) {
		return createResponse({ error: 'Invalid user' }, 404);
	}

	// 檢查用戶權限
	const userLevel = results[0].level;
	if (userLevel !== 'A1' && userLevel !== 'L3') {
		return createResponse({ error: 'Permission denied' }, 403);
	}
	const userName = results[0].name;

	try {
		// 獲取專案資料
		const projectData = (await mailKV.get(code, { type: 'json' })) as studentData;
		if (!projectData) {
			return createResponse({ error: 'Invalid code' }, 404);
		}

		// A1 級別可以查看所有專案
		if (userLevel === 'A1') {
			return createResponse(projectData, 200);
		}

		// 對於 L3 級別：
		// 1. 如果專案沒有處理者，不能查看詳細資料
		if (projectData.handler === '') {
			return createResponse({ error: 'Project not assigned' }, 403);
		}

		// 2. 只能查看自己負責的專案
		if (projectData.handler !== userName) {
			return createResponse({ error: 'Permission denied' }, 403);
		}

		return createResponse(projectData, 200);
	} catch (e: any) {
		console.error('Error during get project:', e.message);
		return createResponse({ error: `Error: ${e.message}` }, 500);
	}
}

export async function updateProject(request: Request, env: Env) {
	const { mailKV } = env;
	const { code, handler, status }: { code: string; handler: string; status: string } = await request.json();
	if (!code || !handler || !status) {
		return createResponse({ error: 'Data is missing' }, 400);
	}
	try {
		const projectData = (await mailKV.get(code, { type: 'json' })) as studentData;
		if (!projectData) {
			return createResponse({ error: 'Invalid code' }, 404);
		}
		projectData.handler = handler;
		projectData.status = status;
		projectData.updatedTime = new Date().toISOString();
		await mailKV.put(code, JSON.stringify(projectData));
		return createResponse({ message: 'Project updated successfully' }, 200);
	} catch (e: any) {
		// 錯誤處理
		console.error('Error during update project:', e.message);
		return createResponse({ error: `Error: ${e.message}` }, 500);
	}
}

export async function deleteProject(request: Request, env: Env) {
	const { mailKV, DATABASE } = env;

	try {
		// 檢查輸入參數
		const { code, userId }: { code: string; userId: string } = await request.json();
		if (!code || !userId) {
			return createResponse({ error: 'Code or userId is missing' }, 400);
		}

		// 檢查專案是否存在
		const projectData = (await mailKV.get(code, { type: 'json' })) as studentData;
		if (!projectData) {
			return createResponse({ error: 'Invalid code' }, 404);
		}

		// 檢查用戶是否存在
		const { results } = await DATABASE.prepare('SELECT level FROM accountData WHERE id = ?').bind(userId).all();
		if (!results || results.length === 0) {
			return createResponse({ error: 'Invalid user' }, 404);
		}

		// 先檢查是否有人接管此專案
		if (projectData.handler === '') {
			// 如果沒有人接管專案，則只允許 A1 等級的人員刪除
			const userLevel = results[0].level;
			if (userLevel === 'A1') {
				await mailKV.delete(code);
				return createResponse({ message: 'Project deleted successfully' }, 200);
			} else {
				return createResponse({ error: 'Permission denied' }, 403);
			}
		} else {
			// 如果有人接管專案，則只允許此接管人刪除資料，但A1的人也可以刪除資料
			if (projectData.handler === userId || results[0].level === 'A1') {
				await mailKV.delete(code);
				return createResponse({ message: 'Project deleted successfully' }, 200);
			} else {
				return createResponse({ error: 'Permission denied' }, 403);
			}
		}
	} catch (e: any) {
		console.error('Error during delete project:', e.message);
		return createResponse({ error: `Error: ${e.message}` }, 500);
	}
}

export async function viewProject(request: Request, env: Env) {
	const { mailKV } = env;
	const { code }: { code: string } = await request.json();
	if (!code) {
		return createResponse({ error: 'Code is missing' }, 400);
	}
	try {
		const projectData = (await mailKV.get(code, { type: 'json' })) as studentData;
		if (!projectData) {
			return createResponse({ error: 'Invalid code' }, 404);
		}
		return createResponse(projectData, 200);
	} catch (e: any) {
		console.error('Error during view project:', e.message);
		return createResponse({ error: `Error: ${e.message}` }, 500);
	}
}
