import { z } from "zod";

export interface ProtocolConfig {
	protocols: {
		[key: string]: {
			operations: any;
			contracts: {
				assets: any;
				pairs: any;
			};
		};
	};
}

export interface ChainData {
	timestamp: string;
	chain: string;
	protocols: YieldData[];
	count: number;
}

export interface YieldData {
	chain: string;
	project: string;
	symbol: string;
	tvlUsd: number;
	apyBase: number;
	apyReward: number | null;
	apy: number;
	rewardTokens: string[] | null;
	pool: string;
	apyPct1D: number;
	apyPct7D: number;
	apyPct30D: number;
	stablecoin: boolean;
	ilRisk: string;
	exposure: string;
	predictions: {
		predictedClass: string | null;
		predictedProbability: number | null;
		binnedConfidence: number | null;
	};
	poolMeta: string | null;
	mu: number;
	sigma: number;
	count: number;
	outlier: boolean;
	underlyingTokens: string[];
	il7d: number | null;
	apyBase7d: number | null;
	apyMean30d: number;
	volumeUsd1d: number | null;
	volumeUsd7d: number | null;
	apyBaseInception: number | null;
}

export interface Token {
	name: string;
	symbol: string;
	decimals: number;
	address: string;
}

export interface TokenMetadata {
	address: string;
	name: string;
	symbol: string;
	type: string;
	asset0?: string;
	asset1?: string;
	decimals?: number;
	underlyingAddress?: string;
}

export interface TokenBalance {
	// contract_address: string;
	name: string;
	symbol: string;
	balance: string;
	// decimals: string;
	valueUSD: string | null;
	error?: string;
}

export const TransactionActionSchema = z.object({
	action: z.string().describe("The action to perform, e.g., 'stake', 'unstake', or 'add_liquidity'"),
	amount: z.string().optional().describe("The amount to transact, as a string"),
	amountInSmallestUnit: z.string().optional().describe("The amount in smallest unit"),
	asset: z.string().optional().describe("The asset symbol, e.g., 'ETH'"),
	assetPair: z.string().optional().describe("The asset pair for liquidity provision"),
	protocol: z.string().describe("The protocol name, e.g., 'Nostra'"),
	userAddress: z.string().describe("The user's wallet address")
});

export const CreateTransactionSchema = z.object({
	actions: z.union([
		z.array(TransactionActionSchema),
		TransactionActionSchema
	]).describe("Single action or array of actions to perform")
});

export const WalletBalancesSchema = z.object({
	walletAddress: z.string().describe("The StarkNet wallet address to check balances for"),
	contractAddresses: z.array(z.string())
		.optional()
		.describe("Optional array of specific token contract addresses to check")
}); 