import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';
import { globalErrorHandler } from '../../../utils/errorHandler';
import { errorHandler, KnownErrorCode } from '../../../utils/error';

export class deleteCase extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '刪除報修案件',
		tags: ['校園資訊'],
		parameters: [
			{
				name: 'id',
				in: 'query',
				required: true,
				schema: {
					type: 'string',
					format: 'uuid',
				},
			},
		],
		responses: {
			200: {
				description: '成功刪除報修案件',
				content: {
					'application/json': {
						schema: { type: 'object', properties: { message: { type: 'string' } } },
					},
				},
			},
			400: {
				description: '缺少必要的報修案件 ID',
				content: {
					'application/json': {
						schema: { type: 'object', properties: { error: { type: 'string' } } },
					},
				},
			},
			404: {
				description: '找不到報修案件',
				content: {
					'application/json': {
						schema: { type: 'object', properties: { error: { type: 'string' } } },
					},
				},
			},
			500: {
				description: '內部伺服器錯誤',
				content: {
					'application/json': {
						schema: { type: 'object', properties: { error: { type: 'string' } } },
					},
				},
			},
		},
	};

	async handle(ctx: AppContext) {
		const env = ctx.env;
		try {
			const id = ctx.req.query('id');
			if (!id) {
				throw new errorHandler(KnownErrorCode.MISSING_REQUIRED_FIELDS);
			}

			const checkResult = await env.DATABASE.prepare('SELECT id FROM repair_cases WHERE id = ?').bind(id).first();

			if (!checkResult) {
				throw new errorHandler(KnownErrorCode.REPAIR_CASE_NOT_FOUND);
			}

			const result = await env.DATABASE.prepare('DELETE FROM repair_cases WHERE id = ?').bind(id).run();

			if (result.success) {
				return ctx.json({ message: 'Case deleted successfully' }, 200);
			} else {
				throw new errorHandler(KnownErrorCode.UNKNOWN_ERROR);
			}
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
