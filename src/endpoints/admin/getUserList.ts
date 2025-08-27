import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../..';
import { verifySession } from '../../utils/verifySession';
import { AuthorizationHelper, globalErrorHandler } from '../../utils/errorHandler';
import { getUserById } from '../../utils/getUserData';
import { errorHandler, KnownErrorCode } from '../../utils/error';
import { userData } from '../../types';

export class getUserList extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '獲取使用者資料列表',
		description: '此操作僅限擁有管理權限的帳號。',
		tags: ['系統管理'],
		security: [{ sessionId: [] }],
		responses: {
			200: {
				description: '成功獲取使用者資料',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								data: {
									type: 'object',
									properties: {
										'COUNT(*)': {
											type: 'number',
											description: '使用者帳號數量',
										},
									},
									required: ['userNum'],
								},
							},
							required: ['data'],
						},
					},
				},
			},
			500: {
				description: '伺服器內部錯誤',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
									description: '錯誤訊息',
								},
							},
							required: ['error'],
						},
					},
				},
			},
		},
	};

	async handle(ctx: AppContext) {
		const env = ctx.env;

		try {
			const userId = await verifySession(ctx);
			const userData = (await getUserById(userId as string, ctx)) as userData;
			if (!userData) throw new errorHandler(KnownErrorCode.USER_NOT_FOUND);

			// 驗證帳號身份與等級
			AuthorizationHelper.requireStaff(userData.type as string);
			AuthorizationHelper.requireAdmin(userData.level as string);

			const allUserData = await env.DATABASE.prepare(
				'SELECT name, email, id, type, role, class, grade, number, oauth, created_at, updated_at, stu_Id FROM accountData',
			).all();

			return ctx.json(
				{
					data: allUserData.results,
				},
				200,
			);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
