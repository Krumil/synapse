import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { YieldData, Token } from '@/types/defi';

export function convertAmountToSmallestUnit(amount: string, decimals: number): string {
	const amountNum = parseFloat(amount);
	if (isNaN(amountNum)) {
		throw new Error(`Invalid amount: ${amount}`);
	}
	const factor = 10 ** decimals;
	return (amountNum * factor).toFixed(0);
}

export function splitUint256(amount: string): { low: string; high: string } {
	const amountBigInt = BigInt(amount);
	const maxUint128 = BigInt("0x100000000000000000000000000000000");
	return {
		low: (amountBigInt % maxUint128).toString(),
		high: (amountBigInt / maxUint128).toString()
	};
}

export function hexToDecimalString(hex: string): string {
	return hex.startsWith("0x") ? BigInt(hex).toString(10) : hex;
}

export function replacePlaceholders(str: string, params: Record<string, string | undefined>): string {
	return str.replace(/\{([^}]+)\}/g, (match, p1) => {
		const value = params[p1];
		if (value === undefined) {
			throw new Error(`Missing parameter "${p1}" for transaction generation.`);
		}
		return value;
	});
}

export function getDeadline(bufferMinutes: number = 15): string {
	return (Math.floor(Date.now() / 1000) + bufferMinutes * 60).toString();
}

export function parseUnderlyingTokens(pairKey: string): string[] {
	return pairKey.split('/');
}

export function reconstructUint256(low: string | number | bigint, high: string | number | bigint): bigint {
	const lowBigInt = BigInt(low);
	const highBigInt = BigInt(high);
	return (highBigInt << BigInt(128)) + lowBigInt;
}

const s3Client = new S3Client({
	region: process.env.AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
	},
	endpoint: process.env.AWS_ENDPOINT
});

export async function getTokensFromS3(): Promise<Token[]> {
	if (!process.env.S3_BUCKET_NAME) {
		throw new Error('S3_BUCKET_NAME is not defined');
	}

	try {
		const command = new GetObjectCommand({
			Bucket: process.env.S3_BUCKET_NAME,
			Key: 'tokens.json'
		});

		const response = await s3Client.send(command);
		const tokensData = JSON.parse(await response.Body?.transformToString() || '[]');
		return tokensData;
	} catch (error) {
		console.error('Error fetching tokens from S3:', error);
		return [];
	}
}

export async function getYieldsFromS3(): Promise<YieldData[]> {
	if (!process.env.S3_BUCKET_NAME) {
		throw new Error('S3_BUCKET_NAME is not defined');
	}

	try {
		const command = new GetObjectCommand({
			Bucket: process.env.S3_BUCKET_NAME,
			Key: 'yields.json'
		});

		const response = await s3Client.send(command);
		const yieldsData = JSON.parse(await response.Body?.transformToString() || '[]');
		return yieldsData;
	} catch (error) {
		console.error('Error fetching yields from S3:', error);
		return [];
	}
}
