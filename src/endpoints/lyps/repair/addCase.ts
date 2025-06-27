import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../../..';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export class addCase extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '新增報修案件',
		tags: ['校園資訊'],
		request: {
			body: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								title: { type: 'string', description: '案件標題' },
								description: { type: 'string', description: '回報說明' },
								category: { type: 'string', description: '回報類型' },
								reward: { type: 'string', description: '回報者姓名' },
							},
							required: ['title', 'description', 'category'],
						},
					},
				},
			},
		},
		responses: {
			200: {
				description: '案件新增成功',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								message: { type: 'string' },
							},
							required: ['message'],
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
								error: { type: 'string' },
							},
							required: ['error'],
						},
					},
				},
			},
		},
	};

	async handle(ctx: AppContext) {
		const formData = await ctx.req.formData();
		const title = formData.get('title') as string;
		const description = formData.get('description') as string;
		const category = formData.get('category') as string;
		const reward = formData.get('reward') as string;
		const imageFile = formData.get('image') as File | null;
		const env = ctx.env;

		let fileName = null;

		const s3Client = new S3Client({
			region: 'us-003',
			endpoint: 'https://us-003.s3.synologyc2.net',
			credentials: {
				accessKeyId: 'usCdBZpYl65Ai68MaLZH7EE36Afh4791',
				secretAccessKey: 'jM4vQFWKkOEY2SRPEakoVRQYmDXrjhEd',
			},
		});

		try {
			if (imageFile) {
				const arrayBuffer = await imageFile.arrayBuffer();
				const uint8Array = new Uint8Array(arrayBuffer);
				const bucketName = 'lyca';
				fileName = `${Date.now()}-${imageFile.name}`;
				const key = `repairs/${fileName}`;

				await s3Client.send(
					new PutObjectCommand({
						Bucket: bucketName,
						Key: key,
						Body: uint8Array,
						ContentType: imageFile.type,
					}),
				);
			}

			await env.DATABASE.prepare('INSERT INTO Repairs (title, description, category, status, imageName, reward) VALUES (?, ?, ?, ?, ?, ?)')
				.bind(title, description, category, '已收到回報', fileName, reward)
				.run();
			return ctx.json({ message: 'Case added successfully' }, 200);
		} catch (e) {
			if (e instanceof Error) {
				console.error(e.message);
				return ctx.json({ error: `Error in adding case: ${e.message}` }, 500);
			}
			console.error(e);
			return ctx.json({ error: 'Unknown error.' }, 500);
		}
	}
}
