import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';
import { Announcement } from '../../../types';

export class listAd extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '獲取學校網站公告列表',
		description: '獲取學校網站公告列表，包括標題、發布時間、內容等信息。',
		tags: ['校園資訊'],
		responses: {
			200: {
				description: '成功獲取公告列表',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								status: {
									type: 'string',
									enum: ['success', 'error'],
								},
								data: {
									type: 'array',
									items: {
										type: 'object',
										properties: {
											date: {
												type: 'string',
											},
											department: {
												type: 'string',
											},
											title: {
												type: 'string',
											},
											link: {
												type: 'string',
											},
										},
									},
								},
								total: {
									type: 'number',
								},
							},
						},
					},
				},
			},
			500: {
				description: '內部伺服器錯誤',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
								},
							},
						},
					},
				},
			},
		},
	};

	async handle(ctx: AppContext) {
		try {
			const baseUrl =
				'https://www.ly.kh.edu.tw/view/index.php?WebID=336&MainType=101&SubType=0&MainMenuId=61299&SubMenuId=0&NowMainId=61299&NowSubId=0&page=';
			const totalPages = 7;
			let allAnnouncements: Announcement[] = [];

			for (let page = 1; page <= totalPages; page++) {
				const pageUrl = `${baseUrl}${page}`;
				console.log(`Fetching page ${pageUrl}`);
				const pageAnnouncements = await getAD(pageUrl);
				allAnnouncements = allAnnouncements.concat(pageAnnouncements);
			}

			if (allAnnouncements.length > 0) {
				return ctx.json(
					{
						status: 'success',
						data: allAnnouncements,
						total: allAnnouncements.length,
					},
					200,
				);
			} else {
				return ctx.json({ error: 'No announcements found' }, 404);
			}
		} catch (error) {
			if (error instanceof Error) {
				console.error('Error fetching announcements:', error.message);
				return ctx.json({ error: `Failed to fetch announcements: ${error.message}` }, 500);
			}
			console.error('Error fetching announcements:', error);
			return ctx.json({ error: 'Internal server error' }, 500);
		}
	}
}

async function getAD(url: string): Promise<Announcement[]> {
	try {
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Network response was not ok: ${response.statusText}`);
		}

		const text = await response.text();
		const cleanedText = text
			.replace(/<img[^>]*>/g, '')
			.replace(/<div class="ContentPageChange">[\s\S]*?<\/div>/g, '')
			.replace(/<div id="DivBottom">[\s\S]*?<\/div>/g, '');

		const announcements: Announcement[] = [];
		const matches = cleanedText.matchAll(/<div class="(ContentListEven|ContentListOdd)">[\s\S]*?<\/div>/g);

		for (const match of matches) {
			const divContent = match[0];

			const dateMatch = divContent.match(/(\d{4}\/\d{2}\/\d{2})/);
			const date = dateMatch ? dateMatch[0] : '';

			const contentMatch = divContent.match(/<a.*?>(.*?)：([\s\S]*?)<\/a>/);
			if (contentMatch) {
				let department = contentMatch[1];
				const title = contentMatch[2].trim();

				if (department === '學生事務處') {
					department = '學務處';
				}

				const linkMatch = divContent.match(/href="(.*?)"/);
				const link = linkMatch ? `https://www.ly.kh.edu.tw${linkMatch[1]}` : '';

				announcements.push({
					date,
					department,
					title,
					link,
				});
			}
		}

		return announcements;
	} catch (error) {
		console.error('Error occurred:', error);
		throw error;
	}
}
