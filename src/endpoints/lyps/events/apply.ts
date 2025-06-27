import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';

// 簡化的參與者信息介面
interface ParticipantInfo {
	name: string;
	studentId: string;
	contactEmail: string;
	class: string;
}

export class Apply extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '新增報名資料',
		description: '提交新的報名資訊（支持個人或團體最多3人）',
		tags: ['校園活動'],
		request: {
			body: {
				content: {
					'multipart/form-data': {
						schema: {
							type: 'object',
							properties: {
								eventId: { type: 'string', description: '活動ID' },
								teamName: { type: 'string', description: '團隊名稱（團體報名時填寫）' },
								isTeam: { type: 'boolean', description: '是否為團體報名' },
								participant1Name: { type: 'string', description: '參與者1姓名' },
								participant1StudentId: { type: 'string', description: '參與者1學號' },
								participant1Email: { type: 'string', description: '參與者1聯絡信箱' },
								participant1Class: { type: 'string', description: '參與者1班級' },
								participant2Name: { type: 'string', description: '參與者2姓名（團體報名）' },
								participant2StudentId: { type: 'string', description: '參與者2學號（團體報名）' },
								participant2Email: { type: 'string', description: '參與者2聯絡信箱（團體報名）' },
								participant2Class: { type: 'string', description: '參與者2班級（團體報名）' },
								participant3Name: { type: 'string', description: '參與者3姓名（團體報名）' },
								participant3StudentId: { type: 'string', description: '參與者3學號（團體報名）' },
								participant3Email: { type: 'string', description: '參與者3聯絡信箱（團體報名）' },
								participant3Class: { type: 'string', description: '參與者3班級（團體報名）' },
								note: { type: 'string', description: '備註說明' },
								file: { type: 'string', format: 'binary', description: '上傳檔案（如有）' },
							},
							required: ['eventId', 'participant1Name', 'participant1StudentId', 'participant1Email', 'participant1Class'],
						},
					},
				},
			},
		},
		responses: {
			200: {
				description: '報名成功',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								message: { type: 'string' },
								applicationId: { type: 'string' },
							},
						},
					},
				},
			},
			400: {
				description: '無效的請求',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: { type: 'string' },
							},
						},
					},
				},
			},
			500: {
				description: '伺服器錯誤',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: { type: 'string' },
							},
						},
					},
				},
			},
		},
	};

	async handle(ctx: AppContext) {
		const env = ctx.env;
		const formData = await ctx.req.formData();

		// 基本資料
		const eventId = formData.get('eventId') as string;
		const isTeam = formData.get('isTeam') === 'true' || formData.get('isTeam');
		const teamName = isTeam ? (formData.get('teamName') as string) : '';
		const note = (formData.get('note') as string) || '';

		// 檔案處理
		const file = formData.get('file') as File | null;
		let fileName = null;
		let fileUrl = null;

		try {
			// 檢查必填欄位
			if (!eventId) {
				return ctx.json({ error: '缺少活動ID' }, 400);
			}

			// 檢查活動是否存在
			const eventExists = await env.DATABASE.prepare('SELECT id FROM Events WHERE id = ?').bind(eventId).first();

			if (!eventExists) {
				return ctx.json({ error: '找不到指定活動' }, 400);
			}

			// 參與者資訊處理
			const participants: ParticipantInfo[] = [];

			// 第一位參與者 (必填)
			const participant1 = {
				name: formData.get('participant1Name') as string,
				studentId: formData.get('participant1StudentId') as string,
				contactEmail: formData.get('participant1Email') as string,
				class: formData.get('participant1Class') as string,
			};

			if (!participant1.name || !participant1.studentId || !participant1.contactEmail || !participant1.class) {
				return ctx.json({ error: '主要參與者資料不完整' }, 400);
			}

			participants.push(participant1);

			// 如果是團體報名，處理其他成員
			if (isTeam) {
				// 檢查團隊名稱
				if (!teamName) {
					return ctx.json({ error: '團體報名需要提供團隊名稱' }, 400);
				}

				// 第二位參與者資料處理
				const participant2Name = formData.get('participant2Name') as string;
				if (participant2Name) {
					const participant2 = {
						name: participant2Name,
						studentId: formData.get('participant2StudentId') as string,
						contactEmail: formData.get('participant2Email') as string,
						class: formData.get('participant2Class') as string,
					};

					if (!participant2.studentId || !participant2.contactEmail || !participant2.class) {
						return ctx.json({ error: '第二位參與者資料不完整' }, 400);
					}

					participants.push(participant2);
				}

				// 第三位參與者資料處理
				const participant3Name = formData.get('participant3Name') as string;
				if (participant3Name) {
					const participant3 = {
						name: participant3Name,
						studentId: formData.get('participant3StudentId') as string,
						contactEmail: formData.get('participant3Email') as string,
						class: formData.get('participant3Class') as string,
					};

					if (!participant3.studentId || !participant3.contactEmail || !participant3.class) {
						return ctx.json({ error: '第三位參與者資料不完整' }, 400);
					}

					participants.push(participant3);
				}

				// 確認團隊人數不超過3人
				if (participants.length > 3) {
					return ctx.json({ error: '團隊人數不能超過3人' }, 400);
				}
			}

			// 處理檔案上傳到 R2
			if (file) {
				fileName = `${Date.now()}-${file.name}`;
				const key = `events/${fileName}`;

				await env.R2.put(key, file);

				fileUrl = `https://storage.lyhsca.org/${key}`;
			}

			// 準備資料並直接存儲到 D1
			const participantsData = JSON.stringify(participants);
			const timestamp = new Date().toISOString();

			// 將報名資料存儲到 D1
			const applicationInsertResult = await env.DATABASE.prepare(
				`INSERT INTO EventApplications (
					eventId, isTeam, teamName, participantsCount,
					participantsData, fileName, fileUrl, note, createdAt
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			)
				.bind(eventId, isTeam ? 1 : 0, teamName || null, participants.length, participantsData, fileName, fileUrl, note, timestamp)
				.run();

			// 獲取新建的應用ID
			const applicationId = applicationInsertResult.meta?.last_row_id;

			if (!applicationId) {
				throw new Error('無法創建報名記錄');
			}

			return ctx.json(
				{
					message: '報名成功',
					applicationId: applicationId.toString(),
				},
				200,
			);
		} catch (e) {
			console.error('報名處理錯誤:', e);
			if (e instanceof Error) {
				return ctx.json({ error: `報名處理錯誤: ${e.message}` }, 500);
			}
			return ctx.json({ error: '未知錯誤' }, 500);
		}
	}
}
