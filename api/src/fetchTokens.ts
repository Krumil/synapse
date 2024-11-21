import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';

// Configure S3 Client
const s3Client = new S3Client({
	region: process.env.AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
	},
	endpoint: process.env.AWS_ENDPOINT
});

// Function to save tokens to S3
export async function fetchTokens() {
	if (!process.env.S3_BUCKET_NAME) {
		throw new Error('S3_BUCKET_NAME is not defined');
	}

	try {
		const response = await axios.get('https://starknet.api.avnu.fi/v1/starknet/tokens');
		const tokens = response.data.content;

		const formattedTokens = tokens
			.filter((token: any) => token.lastDailyVolumeUsd >= 100)
			.map((token: any) => ({
				name: token.name,
				symbol: token.symbol,
				decimals: token.decimals || 18,
				l2_token_address: token.address,
				tags: token.tags || [],
				logoUri: token.logoUri,
				lastDailyVolumeUsd: token.lastDailyVolumeUsd
			}));

		const command = new PutObjectCommand({
			Bucket: process.env.S3_BUCKET_NAME,
			Key: 'tokens.json',
			Body: JSON.stringify(formattedTokens, null, 4),
			ContentType: 'application/json'
		});

		await s3Client.send(command);
		console.log('Tokens updated successfully in S3');
	} catch (error) {
		console.error('Error updating tokens:', error);
	}
}