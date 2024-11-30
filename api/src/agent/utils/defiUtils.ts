import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Token, TokenMetadata, TokenBalance, ProtocolConfig, ChainData } from '../../types/defi';
import { RpcProvider, Contract } from 'starknet';
import { LP_ABI, ERC20_ABI, STAKING_ABI } from '../../constants/contracts';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { Fraction, Percent } from "@uniswap/sdk-core";

// Load the configuration file
const configFilePath = path.join(__dirname, '../../config/protocolConfig.json');
const protocolConfig: ProtocolConfig = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
const PERCENTAGE_INPUT_PRECISION = 2;

// Load provider 
if (!process.env.ALCHEMY_API_ENDPOINT || !process.env.ALCHEMY_API_KEY) {
	throw new Error("Alchemy API configuration is missing");
}

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
	throw new Error('Missing required AWS credentials');
}

const ALCHEMY_API_ENDPOINT = process.env.ALCHEMY_API_ENDPOINT + process.env.ALCHEMY_API_KEY;
const provider = new RpcProvider({ nodeUrl: ALCHEMY_API_ENDPOINT });


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

export function stringToFelt252(str: string): string {
	let hex = "0x";
	for (let i = 0; i < str.length; i++) {
		const charHex = str.charCodeAt(i).toString(16).padStart(2, "0");
		hex += charHex;
	}
	return BigInt(hex).toString();
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

export async function getYieldsFromS3(): Promise<ChainData[]> {
	if (!process.env.S3_BUCKET_NAME) {
		throw new Error('S3_BUCKET_NAME is not defined');
	}

	try {
		// List all objects in the yields folder
		const listCommand = new ListObjectsV2Command({
			Bucket: process.env.S3_BUCKET_NAME,
			Prefix: 'yields/'  // This will look for all files under the yields folder
		});

		const listedObjects = await s3Client.send(listCommand);
		if (!listedObjects.Contents) {
			console.warn('No yield files found in S3');
			return [];
		}

		// Fetch and parse all JSON files
		const allYields: ChainData[] = [];
		for (const object of listedObjects.Contents) {
			if (!object.Key || !object.Key.endsWith('.json')) continue;

			const getCommand = new GetObjectCommand({
				Bucket: process.env.S3_BUCKET_NAME,
				Key: object.Key
			});

			const response = await s3Client.send(getCommand);
			const fileData = JSON.parse(await response.Body?.transformToString() || '[]');

			// If fileData is an array, spread it; if it's an object, wrap it
			if (Array.isArray(fileData)) {
				allYields.push(...fileData);
			} else {
				allYields.push(fileData);
			}
		}

		return allYields;
	} catch (error) {
		console.error('Error fetching yields from S3:', error);
		return [];
	}
}

export function extractDefiTokens(): Set<TokenMetadata> {
	const defiTokens = new Set<TokenMetadata>();

	// Get staking contract addresses with metadata
	Object.values(protocolConfig.protocols.Nostra.contracts.assets).forEach((asset: any) => {
		if (asset.stakingContractAddress) {
			defiTokens.add({
				address: asset.stakingContractAddress,
				underlyingAddress: asset.assetContractAddress,
				decimals: asset.decimals,
				name: asset.label || `Nostra staked ${asset.symbol}`,
				symbol: asset.name || asset.symbol,
				type: "staking",
			});
		}
	});

	// Get pair addresses with metadata
	Object.values(protocolConfig.protocols.Nostra.contracts.pairs).forEach((pair: any) => {
		if (pair.pairAddress) {
			defiTokens.add({
				address: pair.pairAddress,
				asset0: pair.asset0,
				asset1: pair.asset1,
				decimals: pair.decimals,
				name: pair.name,
				symbol: pair.symbol,
				type: "pair",
			});
		}
	});

	return defiTokens;
}

// export function prepareTokensToCheck(tokens: any[], defiTokens: Set<TokenMetadata>): any[] {
// 	return [
// 		...tokens,
// 		...Array.from(defiTokens).map(token => ({
// 			address: token.address,
// 			name: token.name,
// 			symbol: token.symbol
// 		}))
// 	];
// }

export async function fetchTokenPrices(
	tokensToCheck: any[],
	defiTokens: Set<TokenMetadata>,
): Promise<Map<string, number>> {
	const tokenPrices = new Map<string, number>();

	try {
		// Fetch regular token prices
		const regularPricePromises = tokensToCheck.map(async (token: any) => {
			try {
				const price = await getTokenPrice(token.address);
				tokenPrices.set(token.address, price);
			} catch (error) {
				console.warn(`Failed to fetch price for regular token ${token.address}`);
			}
		});

		// Fetch DeFi token prices
		const defiPricePromises = Array.from(defiTokens).map(async (token: TokenMetadata) => {
			try {
				if (token.type === "pair" && token.asset0 && token.asset1) {
					const price = await getLPTokenPrice(token.address, "Nostra", [token.asset0, token.asset1]);
					tokenPrices.set(token.address, price);
				} else if (token.type === "staking" && token.underlyingAddress) {
					const price = await getStakedAssetPrice(token.underlyingAddress, token.address);
					tokenPrices.set(token.address, price);
				}
			} catch (error) {
				console.warn(`Failed to fetch price for DeFi token ${token.address}`);
			}
		});

		await Promise.all([...regularPricePromises, ...defiPricePromises]);
	} catch (error) {
		console.error("Failed to fetch token prices:", error);
	}

	return tokenPrices;
}

export async function fetchTokenBalance(
	token: any,
	walletAddress: string,
	tokenPrices: Map<string, number>,
): Promise<TokenBalance> {
	try {
		const contract = new Contract(ERC20_ABI, token.address, provider);

		const [balanceResult, decimalsResult] = await Promise.all([
			contract.call("balanceOf", [walletAddress] as const),
			contract.call("decimals", [] as const)
		]) as [{ balance: bigint }, { decimals: bigint }];

		const balance = balanceResult.balance;
		const decimals = Number(decimalsResult.decimals);

		if (!balance) {
			return {
				// contract_address: token.address,
				name: token.name,
				symbol: token.symbol,
				balance: "0",
				// decimals: decimals.toString(),
				valueUSD: "0"
			};
		}

		const balanceInSmallestUnit = balance.toString();
		const balanceInTokens = Number(balanceInSmallestUnit) / Math.pow(10, decimals);
		const tokenPrice = tokenPrices.get(token.address);
		const valueUSD = tokenPrice ? (balanceInTokens * tokenPrice).toFixed(2) : null;

		return {
			// contract_address: token.address,
			name: token.name,
			symbol: token.symbol,
			balance: balanceInTokens.toString(),
			// decimals: decimals.toString(),
			valueUSD
		};
	} catch (error) {
		console.error(`Failed to fetch balance for token ${token.address}:`, error);
		return {
			// contract_address: token.address,
			name: token.name,
			symbol: token.symbol,
			balance: "0",
			// decimals: "0",
			valueUSD: null,
			error: "Failed to fetch balance"
		};
	}
}

export function filterNonZeroBalances(balances: TokenBalance[]): TokenBalance[] {
	return balances.filter(balance =>
		balance.valueUSD !== null && parseFloat(balance.valueUSD) > 0
	);
}

export async function getTokenPrice(
	tokenAddress: string,
): Promise<number> {
	try {
		const { data } = await axios.get(`https://starknet.impulse.avnu.fi/v1/tokens/${tokenAddress}/prices/line`);
		const currentPrice = data[data.length - 1]?.value;
		if (!currentPrice) {
			throw new Error(`No price data available for token ${tokenAddress}`);
		}
		return currentPrice;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			throw new Error(`Failed to fetch price for token ${tokenAddress}: ${error.message}`);
		}
		throw error;
	}
}

export async function getStakedAssetPrice(
	underlyingAddress: string,
	stakingContractAddress: string,
	decimals: number = 18,
): Promise<number> {
	try {

		// Get the underlying asset price
		const underlyingPrice = await getTokenPrice(underlyingAddress);

		// Get the conversion index
		const stakingContract = new Contract(
			STAKING_ABI,
			stakingContractAddress,
			provider
		);

		const indexResult = await stakingContract.call("token_index", [] as const);
		const conversionIndex = Number(indexResult) / (10 ** decimals);

		// Calculate the staked token price by multiplying underlying price with the conversion index
		return underlyingPrice * conversionIndex;
	} catch (error) {
		console.warn(`Failed to fetch staked asset price for ${stakingContractAddress}:`, error);
		return 0;
	}
}

export async function getLPTokenPrice(
	poolAddress: string,
	protocol: string,
	underlyingTokens: string[]
): Promise<number> {
	try {
		const poolContract = new Contract(
			LP_ABI,
			poolAddress,
			provider
		);

		// Get pool data
		const [reservesResult, totalSupplyResult] = await Promise.all([
			poolContract.call("get_reserves", [] as const),
			poolContract.call("total_supply", [] as const)
		]) as [{ reserve0: [string, string]; reserve1: [string, string] }, { supply: [string, string] }];

		// Reconstruct reserves and total supply
		const reserve0 = reconstructUint256(reservesResult.reserve0[0], reservesResult.reserve0[1]);
		const reserve1 = reconstructUint256(reservesResult.reserve1[0], reservesResult.reserve1[1]);
		const totalSupply = reconstructUint256(totalSupplyResult.supply[0], totalSupplyResult.supply[1]);

		// get tokens address from getTokensFromS3
		const tokens = await getTokensFromS3();
		const token0Config = tokens.find((token: any) => token.symbol === underlyingTokens[0]);
		const token1Config = tokens.find((token: any) => token.symbol === underlyingTokens[1]);

		if (!token0Config || !token1Config) {
			throw new Error(`Token config not found for ${underlyingTokens[0]} or ${underlyingTokens[1]}`);
		}

		// Get underlying token prices
		const token0Price = await getTokenPrice(
			token0Config?.address,
		);
		const token1Price = await getTokenPrice(
			token1Config?.address
		);

		// Calculate reserves in USD
		const reserve0USD = Number(reserve0) * token0Price / (10 ** token0Config.decimals);
		const reserve1USD = Number(reserve1) * token1Price / (10 ** token1Config.decimals);

		// Total pool value in USD
		const totalPoolValueUSD = reserve0USD + reserve1USD;

		// Price per LP token = Total Pool Value / Total Supply
		return totalPoolValueUSD / (Number(totalSupply) / (10 ** 18));
	} catch (error) {
		console.warn(`Failed to calculate LP token price for pool ${poolAddress}:`, error);
		return 0;
	}
}

export const parseFormatedAmount = (amount: string) => amount.replace(/,/g, '')

export const parseFormatedPercentage = (percent: string) =>
	new Percent(+percent * 10 ** PERCENTAGE_INPUT_PRECISION, 100 * 10 ** PERCENTAGE_INPUT_PRECISION)

interface ParseCurrencyAmountOptions {
	fixed: number
	significant?: number
}

export const formatCurrenyAmount = (amount: Fraction, { fixed, significant = 1 }: ParseCurrencyAmountOptions) => {
	const fixedAmount = amount.toFixed(fixed)
	const significantAmount = amount.toSignificant(significant)

	if (+significantAmount > +fixedAmount) return significantAmount
	else return +fixedAmount.toString()
}

export const formatPercentage = (percentage: Percent) => {
	const formatedPercentage = +percentage.toFixed(2)
	const exact = percentage.equalTo(new Percent(Math.round(formatedPercentage * 100), 10000))

	return `${exact ? '' : '~'}${formatedPercentage}%`
}