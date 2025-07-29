import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../..';
import { verifySession } from '../../utils/verifySession';
import { getUserById } from '../../utils/getUserData';
import { globalErrorHandler } from '../../utils/errorHandler';

export class getUserData extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '取得帳號資料',
		tags: ['會員帳號'],
		description: '取得帳號相關資料',
		security: [
			{
				sessionId: [],
			},
		],
		responses: {
			'200': {
				description: '取得資料成功',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								data: {
									type: 'object',
									properties: {
										auth_person: { type: 'string', example: 'Zhicheng' },
										class: { type: 'string', example: 'C1' },
										email: { type: 'string', example: 'example@lyhsca.org' },
										grade: { type: 'string', example: 'G1' },
										id: { type: 'string', example: '123456' },
										level: { type: 'string', example: 'L1' },
										name: { type: 'string', example: 'Zhicheng' },
										role: { type: 'string', example: 'R1' },
										type: { type: 'string', example: 'normal' },
									},
								},
							},
						},
					},
				},
			},
			'400': {
				description: '無 sessionId / 格式錯誤',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
									example: 'SessionId is missing or malformed',
								},
							},
						},
					},
				},
			},
			'401': {
				description: '驗證錯誤',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
									example: 'Invalid or expired token',
								},
							},
						},
					},
				},
			},
			'404': {
				description: '找不到用戶',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
									example: 'User not found',
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
									type: 'string',
									example: 'Error fetching user data',
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
			const userId = await verifySession(ctx);
			const userData = await getUserById(userId as string, ctx);

			return ctx.json({ data: userData }, 200);
		} catch (error) {
			return globalErrorHandler(error as Error, ctx);
		}
	}
}
