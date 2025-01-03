import {createResponse} from '../../index';
import { CORS_HEADERS } from '../../index';

// 查詢校網公告
async function getAD(Url) {
	try {
		const response = await fetch(Url);

		if (!response.ok) {
			throw new Error(`Network response was not ok: ${response.statusText}`);
		}

		const text = await response.text();
		const cleanedText = text
			.replace(/<img[^>]*>/g, '') // Remove <img> tags
			.replace(/<div class="ContentPageChange">[\s\S]*?<\/div>/g, '') // Remove page change divs
			.replace(/<div id="DivBottom">[\s\S]*?<\/div>/g, ''); // Remove footer divs

		// Extract all matching <div> elements with ContentListEven or ContentListOdd class
		const matches = Array.from(
			cleanedText.matchAll(/<div class="(ContentListEven|ContentListOdd)">[\s\S]*?<\/div>/g)
		).map(match => {
			let originalDiv = match[0];

			// Extract the date from the match
			const dateMatch = originalDiv.match(/(\d{4}\/\d{2}\/\d{2})/);
			if (dateMatch) {
				const date = dateMatch[0];

				// Remove the date from the original content
				originalDiv = originalDiv.replace(date, '').trim();

				// Insert the date inside the original <div> with a class "ad_date"
				originalDiv = originalDiv.replace(
					/(>)([\s\S]*?<\/div>)/,
					`$1<div class="ad_date">${date}</div>$2`
				);
			}

			// 刪除空格
			originalDiv = originalDiv.replace(/&nbsp;&nbsp;/g, '');
			originalDiv = originalDiv.replace(/&nbsp;/g, '');

			// Update href links inside each match to include full URL and target="_blank"
			originalDiv = originalDiv.replace(/href="(.*?)"/g, 'href="https://www.ly.kh.edu.tw/view/$1" target="_blank"');

			// Extract "处室" and create a new div for it outside the <a> tag
			originalDiv = originalDiv.replace(/<a(.*?)>(.*?)：([\s\S]*?)<\/a>/g, (match, attr, department, rest) => {
				if (department === '學生事務處'){
					department = '學務處'
				}
				return `<div class="ad_department">${department}</div><a${attr}>${rest}</a>`;
			});

			return originalDiv;
		});

		return matches;
	} catch (error) {
		console.error('Error occurred:', error.message || error);
		return new Response(error.message || 'An error occurred', { status: 500 });
	}
}
async function getAllAnnouncements() {
	const baseUrl = 'https://www.ly.kh.edu.tw/view/index.php?WebID=336&MainType=101&SubType=0&MainMenuId=61299&SubMenuId=0&NowMainId=61299&NowSubId=0&page=';
	const totalPages = 5;
	let allAnnouncements: any[] = [];

	for (let page = 1; page <= totalPages; page++) {
		const pageUrl = `${baseUrl}${page}`;
		console.log(`Fetching page ${pageUrl}`);
		const pageContent = await getAD(pageUrl);
		allAnnouncements = allAnnouncements.concat(pageContent);
	}

	if (allAnnouncements.length > 0) {
		return new Response(allAnnouncements.join('\n'), {
			status: 200,
			headers: {
				'Content-Type': 'text/html',
				...CORS_HEADERS
			}
		});
	} else {
		console.log('No announcements found across pages.');
		return createResponse({ error: `Error: No announcements found across pages.` }, 404)
	}
}

export { getAllAnnouncements };
