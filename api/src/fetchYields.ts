import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';
import { YieldData } from './types/defi';

const YIELDS_API_URL = 'https://yields.llama.fi/pools';

// Configure S3 Client
const s3Client = new S3Client({
	region: process.env.AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
	},
	endpoint: process.env.AWS_ENDPOINT
});

export async function fetchYields() {
	if (!process.env.S3_BUCKET_NAME) {
		throw new Error('S3_BUCKET_NAME is not defined');
	}

	try {
		console.log('Fetching yields data...');
		const response = await axios.get(YIELDS_API_URL);

		const chainData: { [key: string]: YieldData[] } = {};
		response.data.data.forEach((protocol: YieldData) => {
			const chain = protocol.chain.toLowerCase();
			if (!chainData[chain]) {
				chainData[chain] = [];
			}
			chainData[chain].push(protocol);
		});

		for (const [chain, protocols] of Object.entries(chainData)) {
			const data = {
				timestamp: new Date().toISOString(),
				chain,
				protocols,
				count: protocols.length,
			};

			const command = new PutObjectCommand({
				Bucket: process.env.S3_BUCKET_NAME,
				Key: `yields/${chain}.json`,
				Body: JSON.stringify(data, null, '\t'),
				ContentType: 'application/json'
			});

			await s3Client.send(command);
			console.log(`${chain} data saved to S3: yields/${chain}.json`);
		}
	} catch (error) {
		console.error('Error fetching yields data:', error);
	}
}