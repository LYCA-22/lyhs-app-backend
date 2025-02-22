import { Env } from '../types';
import { createResponse } from '..';

export async function getAllEvents(env: Env) {
	const { DATABASE } = env;
	try {
		const statement = await DATABASE.prepare('SELECT * FROM calendar').all();
		return createResponse({ data: statement }, 200);
	} catch (error: any) {
		console.error('Error fetching events:', error);
		return createResponse({ error: error.message }, 500);
	}
}

export async function addEvent(env: Env, request: Request) {
	const { DATABASE } = env;
	const { id, title, description, date, office }: { id: string; title: string; description: string; date: string; office: string } =
		await request.json();
	try {
		await DATABASE.prepare('INSERT INTO calendar (id, title, description, date, office) VALUES (?, ?, ?, ?, ?)')
			.bind(id, title, description, date, office)
			.run();
		return createResponse({ message: 'successful' }, 200);
	} catch (error: any) {
		console.error('Error adding event:', error);
		return createResponse({ error: error.message }, 500);
	}
}

export async function deleteEvent(env: Env, request: Request) {
	const { DATABASE } = env;
	const { id }: { id: string } = await request.json();
	try {
		await DATABASE.prepare('DELETE FROM calendar WHERE id = ?').bind(id).run();
		return createResponse({ message: 'successful' }, 200);
	} catch (error: any) {
		console.error('Error deleting event:', error);
		return createResponse({ error: error.message }, 400);
	}
}

export async function updateEvent(env: Env, request: Request) {
	const { DATABASE } = env;
	const { id, title, description, date, office }: { id: string; title: string; description: string; date: string; office: string } =
		await request.json();
	try {
		await DATABASE.prepare('UPDATE calendar SET title = ?, description = ?, date = ?, office=? WHERE id = ?')
			.bind(title, description, date, office, id)
			.run();
		return createResponse({ message: 'successful' }, 200);
	} catch (error: any) {
		console.error('Error updating event:', error);
		return createResponse({ error: error.message }, 400);
	}
}
function transformOffice(office: string | null) {
	if (office === 'stu') return '學務處';
	if (office === 'edu') return '教務處';
	if (office === 'lib') return '圖書館';
	if (office === 'lyca') return '班聯會';
	if (office === 'coun') return '輔導處';
	if (office === 'equip') return '總務處';
	return ''; // 預設回傳空字串，代表沒有指定處室
}

export async function generateICS(env: Env, request: Request) {
	const { DATABASE } = env;
	try {
		// 解析網址參數
		const url = new URL(request.url);
		const officeFilter = url.searchParams.get('office'); // 取得 office 參數
		const officeName = transformOffice(officeFilter);

		let query = 'SELECT * FROM calendar ORDER BY date ASC';
		const { results } = await DATABASE.prepare(query).all();

		// 如果有 office 參數，就篩選對應的事件
		const filteredResults = officeFilter ? results.filter((event) => event.office === officeFilter) : results;

		// 設定行事曆名稱
		const calendarName = officeFilter ? `林園高中行事曆【${officeName}】` : '林園高中行事曆';

		let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Your Calendar//EN\n';
		icsContent += 'X-WR-TIMEZONE:Asia/Taipei\n'; // 指定行事曆時區
		icsContent += `X-WR-CALNAME:${calendarName}\n`; // 設定行事曆名稱

		for (const event of filteredResults) {
			const formattedDate = event.date.replace(/-/g, ''); // YYYYMMDD 格式，確保為「整天事件」

			icsContent += 'BEGIN:VEVENT\n';
			icsContent += `UID:${event.id}@yourdomain.com\n`; // 確保唯一性
			icsContent += `DTSTAMP:${formatICSDate(new Date())}\n`; // 生成時間
			icsContent += `DTSTART;VALUE=DATE:${formattedDate}\n`; // 設為整天事件
			icsContent += `SUMMARY:${event.title}\n`; // 只顯示標題
			icsContent += `DESCRIPTION:${event.description}\n`; // 只顯示說明
			icsContent += `CATEGORIES:${event.office}\n`; // 類別
			icsContent += 'END:VEVENT\n';
		}

		icsContent += 'END:VCALENDAR';

		return new Response(icsContent, {
			headers: {
				'Content-Type': 'text/calendar',
				'Content-Disposition': `attachment; filename="${officeFilter || 'calendar'}.ics"`,
			},
		});
	} catch (error: any) {
		console.error('Error fetching events:', error);
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}

// 格式化為 UTC (DTSTAMP)
function formatICSDate(date: Date): string {
	return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}
