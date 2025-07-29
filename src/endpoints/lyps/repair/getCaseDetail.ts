import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Repair } from '../../../types';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { globalErrorHandler } from '../../../utils/errorHandler';
import { errorHandler, KnownErrorCode } from '../../../utils/error';

export class getDetailCase extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '獲取報修詳細資訊',
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
				description: '成功獲取詳細資訊',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								status: {
									type: 'string',
									enum: ['success', 'error'],
								},
								data: {
									type: 'object',
									properties: {
										id: {
											type: 'string',
											format: 'uuid',
										},
										title: {
											type: 'string',
										},
										description: {
											type: 'string',
										},
										status: {
											type: 'string',
											enum: ['pending', 'in_progress', 'completed'],
										},
										created_at: {
											type: 'string',
											format: 'date-time',
										},
										updated_at: {
											type: 'string',
											format: 'date-time',
										},
										ImageUrl: {
											type: 'string',
											format: 'url',
										},
									},
								},
							},
						},
					},
				},
			},
			404: {
				description: '找不到該案件',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
								},
							},
						},
					},
				},
			},
			500: {
				description: '伺服器錯誤',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									type: 'string',
								},
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
			const id = ctx.req.query('id');
			if (!id) {
				throw new errorHandler(KnownErrorCode.MISSING_REQUIRED_FIELDS);
			}
			const d1Response = (await env.DATABASE.prepare('SELECT * FROM Repairs WHERE id = ?').bind(id).all()) as D1Result;

			if (!d1Response) {
				return ctx.json({ error: 'Case Not Found' }, 404);
			}
			const result = d1Response.results[0] as unknown as Repair;

			if (result.imageName) {
				const command = new GetObjectCommand({
					Bucket: 'lyca',
					Key: `repairs/${result.imageName}`,
				});

				imageUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
			}

			return ctx.json({ status: 'success', data: { ...result, ImageUrl: imageUrl } }, 200);
		} catch (e) {
			return globalErrorHandler(e as Error, ctx);
		}
	}
}
