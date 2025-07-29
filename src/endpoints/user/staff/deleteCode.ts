import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';
import { verifySession } from '../../../utils/verifySession';
import { errorHandler, httpReturn, KnownErrorCode } from '../../../utils/error';
import {
	withErrorHandler,
	ValidationHelper,
	AuthorizationHelper,
	DatabaseHelper,
	BusinessLogicHelper,
	globalErrorHandler,
} from '../../../utils/errorHandler';

export class deleteStaffCode extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '刪除管理人員註冊代碼',
		tags: ['管理人員帳號'],
		security: [
			{
				sessionId: [],
			},
		],
		parameters: [
			{
				name: 'code',
				in: 'query',
				required: true,
				schema: {
					type: 'string',
					example: 'ABC123',
				},
				description: '要刪除的註冊代碼',
			},
		],
		responses: {
			'200': {
				description: '成功刪除管理人員註冊代碼',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								message: {
									type: 'string',
									example: '註冊代碼已成功刪除',
								},
								deletedCode: {
									type: 'string',
									example: 'ABC123',
								},
							},
						},
					},
				},
			},
			'400': {
				description: '請求資料格式錯誤',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'object',
									properties: {
										code: {
											type: 'string',
											example: 'L4000',
										},
										message: {
											type: 'string',
											example: '缺少必填欄位',
										},
									},
								},
							},
						},
					},
				},
			},
			'403': {
				description: '帳號等級權限不足',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'object',
									properties: {
										code: {
											type: 'string',
											example: 'L3003',
										},
										message: {
											type: 'string',
											example: '需要管理員權限',
										},
									},
								},
							},
						},
					},
				},
			},
			'404': {
				description: '使用者或註冊代碼不存在',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'object',
									properties: {
										code: {
											type: 'string',
											example: 'L2001',
										},
										message: {
											type: 'string',
											example: '找不到使用者',
										},
									},
								},
							},
						},
					},
				},
			},
			'500': {
				description: '發生不明錯誤',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'object',
									properties: {
										code: {
											type: 'string',
											example: 'L1001',
										},
										message: {
											type: 'string',
											example: '內部伺服器錯誤',
										},
									},
								},
							},
						},
					},
				},
			},
		},
	};

	async handle(ctx: AppContext) {
		const codeToDelete = ctx.req.query('code');
		const env = ctx.env;

		try {
			// 驗證必填參數
			if (!codeToDelete) {
				return httpReturn(ctx, KnownErrorCode.MISSING_REQUIRED_FIELDS, { missingFields: ['code'] });
			}

			// 驗證會話
			const result = await verifySession(ctx);

			// 獲取使用者資料
			const userData = await DatabaseHelper.executeQuery(
				env.DATABASE.prepare(`SELECT level, email FROM accountData WHERE id = ?`).bind(result).first<{ level: string; email: string }>(),
				KnownErrorCode.USER_NOT_FOUND,
			);

			// 驗證使用者存在
			AuthorizationHelper.requireUser(userData);

			// 驗證管理員權限
			AuthorizationHelper.requireAdmin(userData!.level);

			// 檢查註冊代碼是否存在
			const existingCode = await DatabaseHelper.executeQuery(
				env.DATABASE.prepare(`SELECT registerCode FROM register_codes WHERE registerCode = ?`)
					.bind(codeToDelete)
					.first<{ registerCode: string }>(),
				KnownErrorCode.REGISTRATION_CODE_NOT_FOUND,
			);

			// 驗證註冊代碼存在
			BusinessLogicHelper.validateRegistrationCode(existingCode);

			// 刪除註冊代碼
			const deleteResult = await DatabaseHelper.executeQuery(
				env.DATABASE.prepare(`DELETE FROM register_codes WHERE registerCode = ?`).bind(codeToDelete).run(),
			);

			// 檢查刪除是否成功
			if ('changes' in deleteResult && deleteResult.changes === 0) {
				throw new errorHandler(KnownErrorCode.DATABASE_QUERY_FAILED, {
					operation: 'delete',
					table: 'register_codes',
					code: codeToDelete,
				});
			}

			return ctx.json(
				{
					message: '註冊代碼已成功刪除',
					deletedCode: codeToDelete,
				},
				200,
			);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
