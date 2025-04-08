import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';
import { verifySession } from '../../../utils/verifySession';
import { getUserInfo } from '../../../utils/getUserData';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Repair } from '../../../types';

export class listCases extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '列出所有報修案件',
		tags: ['校園資訊'],
		security: [{ sessionId: [] }],
		responses: {
			200: {
				description: '成功獲取列表',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								status: { type: 'string' },
								data: { type: 'array', items: { type: 'object' } },
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
								error: { type: 'string' },
							},
						},
					},
				},
			},
		},
	};

	async handle(ctx: AppContext) {
		const env = ctx.env;
		let imageUrl = '';
		const s3Client = new S3Client({
			region: 'us-003',
			endpoint: 'https://us-003.s3.synologyc2.net',
			credentials: {
				accessKeyId: 'usCdBZpYl65Ai68MaLZH7EE36Afh4791',
				secretAccessKey: 'jM4vQFWKkOEY2SRPEakoVRQYmDXrjhEd',
			},
		});

		try {
			const result = await verifySession(ctx);
			if (result instanceof Response) {
				return result;
			}
			if (!result) {
				return ctx.json({ error: 'Invalid session' }, 401);
			}
			const userId = result as string;
			const userData = await getUserInfo(userId, ctx);
			if (userData.type === 'stu') {
				return ctx.json({ error: 'Forbidden' }, 403);
			}

			const caseData = await env.DATABASE.prepare('SELECT * FROM Repairs ORDER BY created_at DESC').all();
			const cases = caseData.results as unknown as Repair[];

			const casesWithImageUrls = await Promise.all(
				cases.map(async (caseItem) => {
					let imageUrl = '';
					if (caseItem.imageName) {
						const command = new GetObjectCommand({
							Bucket: 'lyca',
							Key: `repairs/${caseItem.imageName}`,
						});

						imageUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
					}

					return {
						...caseItem,
						ImageUrl: imageUrl,
					};
				}),
			);

			return ctx.json({ status: 'success', data: casesWithImageUrls }, 200);
		} catch (error) {
			console.error(error);
			return ctx.json({ error: 'Internal Server Error' }, 500);
		}
	}
}
