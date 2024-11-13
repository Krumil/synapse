import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createConfig, getTokens, getTokenBalancesByChain, ChainType, ChainId, TokensResponse, Token, EVM } from '@lifi/sdk';
import type { Chain } from 'viem'
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.PRIVATE_KEY) {
	throw new Error("PRIVATE_KEY is not set in environment variables");
}
const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY!.replace(/^0x/, '')}`);
const chains = [base]
const client = createWalletClient({
	account,
	chain: base,
	transport: http(),
})

// Initialize LiFi SDK
createConfig({
	integrator: 'LamboOrRamen',
	providers: [
		EVM({
			getWalletClient: async () => client,
			switchChain: async (chainId) =>
				createWalletClient({
					account,
					chain: chains.find((chain) => chain.id == chainId) as Chain,
					transport: http(),
				}),
		}),
	],
});

export const getTradableTokensTool = tool(
	async ({ chains, chainTypes }: { chains?: string; chainTypes?: string }) => {
		try {
			const params: {
				chains?: number[];
				chainTypes?: ChainType[];
			} = {};

			if (chains) {
				params.chains = chains.split(',').map(chain => {
					const chainKey = chain.trim().toUpperCase();
					if (!(chainKey in ChainId)) {
						throw new Error(`Invalid chain key: ${chainKey}`);
					}
					return ChainId[chainKey as keyof typeof ChainId];
				});
			}

			if (chainTypes) {
				params.chainTypes = chainTypes.split(',').map(type => type.trim() as ChainType);
			}

			const response: TokensResponse = await getTokens(params);

			const tokensList = Object.values(response.tokens)
				.flat()
				.map(({ name, symbol }) => ({
					name,
					symbol,
				}));

			const selectedTokens = tokensList
				.sort(() => Math.random() - Math.random())
				.slice(0, 5);

			const famousTokens = tokensList.filter(token => token.symbol === "ETH" || token.symbol === "BRETT" || token.symbol === "PRIME");
			const mergedTokens = [...selectedTokens, ...famousTokens];
			return JSON.stringify(mergedTokens, null, 4);
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Failed to fetch tradable tokens: ${error.message}`);
			} else {
				throw new Error(
					"An unexpected error occurred while fetching tradable tokens"
				);
			}
		}
	},
	{
		name: "get_tradable_tokens",
		description: "Get all tradable tokens from the LI.FI services",
		schema: z.object({
			chains: z
				.string()
				.optional()
				.describe(
					"Comma-separated list of chain keys (e.g., 'BAS')"
				),
			chainTypes: z
				.string()
				.optional()
				.describe(
					"Comma-separated list of chain types (e.g., 'EVM,SVM'). By default, only EVM tokens will be returned"
				),
		}),
	}
);

export const getTokenBalancesTool = tool(
	async ({ walletAddress, chains }: { walletAddress: string; chains: string }) => {
		try {
			const chainIds = chains.split(',').map(chain => chain.trim().toUpperCase());
			const tokensByChain: { [chainId: number]: Token[] } = {};

			// Fetch tokens for each chain
			for (const chainKey of chainIds) {
				if (!(chainKey in ChainId)) {
					throw new Error(`Invalid chain key: ${chainKey}`);
				}
				const chainId = ChainId[chainKey as keyof typeof ChainId];
				const response: TokensResponse = await getTokens({ chains: [chainId] });
				tokensByChain[chainId] = Object.values(response.tokens)[0];
			}

			const balances = await getTokenBalancesByChain(walletAddress, tokensByChain);
			const filteredBalances = Object.fromEntries(
				Object.entries(balances)
					.map(([chainId, tokens]) => [
						chainId,
						tokens.filter(token => token.amount !== undefined && token.amount > 0n)
					])
					.filter(([, tokens]) => tokens.length > 0)
			);
			return JSON.stringify(filteredBalances, (key, value) =>
				typeof value === 'bigint' ? value.toString() : value
				, 4);
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Failed to fetch token balances: ${error.message}`);
			} else {
				throw new Error("An unexpected error occurred while fetching token balances");
			}
		}
	},
	{
		name: "get_token_balances",
		description: "Get token balances for a wallet across multiple chains",
		schema: z.object({
			walletAddress: z.string().describe("The wallet address to check balances for"),
			chains: z.string().describe("Comma-separated list of chain keys (e.g., 'BAS,ETH,POL')"),
		}),
	}
);