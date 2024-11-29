import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

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
		// Load protocol config the same way as defiUtils
		const configFilePath = path.join(__dirname, './config/protocolConfig.json');
		const protocolConfig = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));

		// Extract unique token symbols from pairs and assets
		const validTokens = new Set<string>();
		const { assets, pairs } = protocolConfig.protocols.Nostra.contracts;

		// Add tokens from assets
		Object.keys(assets).forEach(symbol => validTokens.add(symbol));

		// Add tokens from pairs
		Object.values(pairs).forEach((pair: any) => {
			validTokens.add(pair.asset0);
			validTokens.add(pair.asset1);
		});

		const response = await axios.get('https://starknet.api.avnu.fi/v1/starknet/tokens');
		const tokens = response.data.content;

		const formattedTokens = tokens
			.filter((token: any) => validTokens.has(token.symbol))
			.map((token: any) => ({
				name: token.name,
				symbol: token.symbol,
				decimals: token.decimals || 18,
				address: token.address,
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