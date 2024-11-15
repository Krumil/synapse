import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ethers } from "ethers";
import { Alchemy, Network } from "alchemy-sdk";
import dotenv from "dotenv";

dotenv.config();

const { ALCHEMY_API_KEY } = process.env;

const chainConfig: Record<string, { rpcUrl: string; alchemyNetwork: Network; chainId: number }> = {
	starknet: {
		rpcUrl: `https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_7/${ALCHEMY_API_KEY}`,
		alchemyNetwork: Network.ETH_MAINNET,
		chainId: 1,
	},
};

interface TokenBalance {
	contractAddress: string;
	name?: string;
	symbol?: string;
	balance: string;
	decimals?: number;
	logo?: string;
}

async function getTokensForChain(address: string, network: Network): Promise<TokenBalance[]> {
	if (!ALCHEMY_API_KEY) {
		throw new Error("ALCHEMY_API_KEY is not set in the environment variables");
	}

	const alchemy = new Alchemy({ apiKey: ALCHEMY_API_KEY, network });

	try {
		const response = await alchemy.core.getTokensForOwner(address);
		return response.tokens
			.filter(token => token.balance && parseFloat(token.balance) > 0)
			.map(token => ({
				contractAddress: token.contractAddress,
				name: token.name,
				symbol: token.symbol,
				balance: token.balance!,
				decimals: token.decimals,
				logo: token.logo
			}));
	} catch (error) {
		throw new Error(`Failed to fetch tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

const getTokensForOwnerTool = tool(
	async ({ address, chain }: { address: string; chain: string }) => {
		try {
			const normalizedChain = chain.toLowerCase().trim();
			if (!(normalizedChain in chainConfig)) {
				throw new Error(`Unsupported chain: ${chain}`);
			}

			const { alchemyNetwork } = chainConfig[normalizedChain];
			const tokens = await getTokensForChain(address, alchemyNetwork);

			// Also get native token balance
			const provider = new ethers.JsonRpcProvider(chainConfig[normalizedChain].rpcUrl);
			const nativeBalance = await provider.getBalance(address);
			const nativeBalanceFormatted = ethers.formatEther(nativeBalance);

			const result = {
				chain: normalizedChain,
				nativeBalance: {
					symbol: normalizedChain === 'ethereum' ? 'ETH' : 'ETH',
					balance: nativeBalanceFormatted
				},
				tokens
			};

			return JSON.stringify(result, null, 2);
		} catch (error) {
			throw new Error(`Failed to get tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	},
	{
		name: "get_tokens_for_owner",
		description: "Get all tokens owned by an address on a specific chain, including detailed token information and balances",
		schema: z.object({
			address: z.string().describe("The wallet address to check"),
			chain: z.string().describe("The blockchain network (ethereum, arbitrum, optimism, or base)")
		})
	}
);

const getMultiChainTokensTool = tool(
	async ({ address, chains }: { address: string; chains: string[] }) => {
		try {
			const results = await Promise.all(
				chains.map(async (chain) => {
					try {
						const result = await getTokensForChain(address, chainConfig[chain].alchemyNetwork);
						return result;
					} catch (error) {
						return {
							chain,
							error: error instanceof Error ? error.message : 'Unknown error'
						};
					}
				})
			);

			return JSON.stringify(results, null, 2);
		} catch (error) {
			throw new Error(`Failed to get multi-chain tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	},
	{
		name: "get_multi_chain_tokens",
		description: "Get all tokens owned by an address across multiple chains",
		schema: z.object({
			address: z.string().describe("The wallet address to check"),
			chains: z.array(z.string()).describe("Array of blockchain networks to check")
		})
	}
);

export const blockchainTools = [
	getTokensForOwnerTool,
	getMultiChainTokensTool
];