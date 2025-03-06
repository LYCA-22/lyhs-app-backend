import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../..';
import { userData } from '../../types';
import { verifySession } from '../../utils/verifySession';

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
			const result = await verifySession(ctx);
			if (result instanceof Response) {
				return result;
			}
			const userId = result as string;

			const user = (await ctx.env.DATABASE.prepare(
				'SELECT id, name, email, type, level, class, grade, role, auth_person FROM accountData WHERE id = ?',
			)
				.bind(userId)
				.first()) as userData;

			if (!user) {
				return ctx.json({ error: 'User not found' }, 404);
			}

			return ctx.json({ data: user }, 200);
		} catch (error) {
			if (error instanceof Error) {
				console.error('Error fetching user data:', error);
				return ctx.json({ error: `Error: ${error.message}` }, 500);
			}
			return ctx.json({ error: 'Unknown error' }, 500);
		}
	}
}
