import { OpenAPIRoute, OpenAPIRouteSchema } from 'chanfana';
import { AppContext } from '../..';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class getAllFiles extends OpenAPIRoute {
	schema: OpenAPIRouteSchema = {
		summary: '獲取所有公開資料',
		tags: ['班聯會開放資料'],
	};

	async handle(ctx: AppContext) {
		const date = ctx.req.param('date');
		const s3Client = new S3Client({
			region: 'us-003',
			endpoint: 'https://us-003.s3.synologyc2.net',
			credentials: {
				accessKeyId: 'usCdBZpYl65Ai68MaLZH7EE36Afh4791',
				secretAccessKey: 'jM4vQFWKkOEY2SRPEakoVRQYmDXrjhEd',
			},
		});

		if (date !== '20250329') {
			return ctx.json({ error: 'Date not found' }, 404);
		}

		const bucketName = 'lyca-events';
		const listCommand = new ListObjectsV2Command({ Bucket: bucketName, Prefix: `${date}` });

		try {
			const data = await s3Client.send(listCommand);
			const photos = data.Contents || [];

			const signedUrls = await Promise.all(
				photos.map(async (photo) => {
					const getObjectCommand = new GetObjectCommand({ Bucket: bucketName, Key: photo.Key });
					return getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 });
				}),
			);

			return ctx.json({ urls: signedUrls }, 200);
		} catch (error) {
			console.error(error);
			return ctx.json({ error: 'Failed to fetch photos' }, 500);
		}
	}
}
