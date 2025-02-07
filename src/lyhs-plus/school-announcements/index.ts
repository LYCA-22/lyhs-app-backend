import { createResponse } from '../../index';
import { CORS_HEADERS } from '../../index';
interface Announcement {
	date: string;
	department: string;
	title: string;
	link: string;
}

async function getAD(Url: string): Promise<Announcement[]> {
	try {
		const response = await fetch(Url);

		if (!response.ok) {
			throw new Error(`Network response was not ok: ${response.statusText}`);
		}

		const text = await response.text();
		const cleanedText = text
			.replace(/<img[^>]*>/g, '')
			.replace(/<div class="ContentPageChange">[\s\S]*?<\/div>/g, '')
			.replace(/<div id="DivBottom">[\s\S]*?<\/div>/g, '');

		// 使用正則表達式匹配所需內容
		const announcements: Announcement[] = [];
		const matches = cleanedText.matchAll(/<div class="(ContentListEven|ContentListOdd)">[\s\S]*?<\/div>/g);

		for (const match of matches) {
			const divContent = match[0];

			// 提取日期
			const dateMatch = divContent.match(/(\d{4}\/\d{2}\/\d{2})/);
			const date = dateMatch ? dateMatch[0] : '';

			// 提取部門和標題
			const contentMatch = divContent.match(/<a.*?>(.*?)：([\s\S]*?)<\/a>/);
			if (contentMatch) {
				let department = contentMatch[1];
				const title = contentMatch[2].trim();

				// 部門名稱映射
				if (department === '學生事務處') {
					department = '學務處';
				}

				// 提取連結
				const linkMatch = divContent.match(/href="(.*?)"/);
				const link = linkMatch ? `https://www.ly.kh.edu.tw/view/${linkMatch[1]}` : '';

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

async function getAllAnnouncements() {
	try {
		const baseUrl =
			'https://www.ly.kh.edu.tw/view/index.php?WebID=336&MainType=101&SubType=0&MainMenuId=61299&SubMenuId=0&NowMainId=61299&NowSubId=0&page=';
		const totalPages = 5;
		let allAnnouncements: Announcement[] = [];

		for (let page = 1; page <= totalPages; page++) {
			const pageUrl = `${baseUrl}${page}`;
			console.log(`Fetching page ${pageUrl}`);
			const pageAnnouncements = await getAD(pageUrl);
			allAnnouncements = allAnnouncements.concat(pageAnnouncements);
		}

		if (allAnnouncements.length > 0) {
			return new Response(
				JSON.stringify({
					status: 'success',
					data: allAnnouncements,
					total: allAnnouncements.length,
				}),
				{
					status: 200,
					headers: {
						'Content-Type': 'application/json',
						...CORS_HEADERS,
					},
				},
			);
		} else {
			return createResponse(
				{
					status: 'error',
					message: 'No announcements found',
				},
				404,
			);
		}
	} catch (error: any) {
		console.error('Error fetching announcements:', error);
		return createResponse(
			{
				status: 'error',
				message: `Failed to fetch announcements: ${error.message}`,
			},
			500,
		);
	}
}

export { getAllAnnouncements };
