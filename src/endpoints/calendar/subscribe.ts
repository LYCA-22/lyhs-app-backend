import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../..';
import { globalErrorHandler } from '../../utils/errorHandler';

interface CalendarEvent {
	id: string;
	date: string;
	title: string;
	description: string;
	office: string;
}

export class subscribe extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '訂閱行事曆',
		tags: ['行事曆'],
	};

	async handle(ctx: AppContext) {
		const env = ctx.env;
		try {
			let officeFilter = ctx.req.query('office');
			if (!officeFilter) {
				officeFilter = '';
			}
			const officeName = transformOffice(officeFilter);

			let query = 'SELECT * FROM calendar ORDER BY date ASC';
			const { results } = await env.DATABASE.prepare(query).all();

			const filteredResults = officeFilter ? results.filter((event) => event.office === officeFilter) : results;

			const calendarName = officeFilter ? `林園高中行事曆【${officeName}】` : '林園高中行事曆';

			let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Your Calendar//EN\n';
			icsContent += 'X-WR-TIMEZONE:Asia/Taipei\n';
			icsContent += `X-WR-CALNAME:${calendarName}\n`;

			for (const event of filteredResults) {
				const eventdata = event.date as string;
				const formattedDate = eventdata.replace(/-/g, ''); // YYYYMMDD 格式，確保為「整天事件」

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
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}

function transformOffice(office: string | null) {
	if (office === 'stu') return '學務處';
	if (office === 'edu') return '教務處';
	if (office === 'lib') return '圖書館';
	if (office === 'lyca') return '班聯會';
	if (office === 'coun') return '輔導處';
	if (office === 'equip') return '總務處';
	return '';
}

function formatICSDate(date: Date): string {
	return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}
