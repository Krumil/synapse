import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ethers } from "ethers";
import { Alchemy, Network } from "alchemy-sdk";
import dotenv from "dotenv";

dotenv.config();

const { ALCHEMY_API_KEY } = process.env;

const chainConfig: Record<string, { rpcUrl: string; alchemyNetwork: Network, chainId: number }> =
{
	arbitrum: {
		rpcUrl: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
		alchemyNetwork: Network.ARB_MAINNET,
		chainId: 42161,
	},
	arb: {
		rpcUrl: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
		alchemyNetwork: Network.ARB_MAINNET,
		chainId: 42161,
	},
	optimism: {
		rpcUrl: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
		alchemyNetwork: Network.OPT_MAINNET,
		chainId: 10,
	},
	opt: {
		rpcUrl: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
		alchemyNetwork: Network.OPT_MAINNET,
		chainId: 10,
	},
	base: {
		rpcUrl: `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
		alchemyNetwork: Network.BASE_MAINNET,
		chainId: 8453,
	},
	bas: {
		rpcUrl: `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
		alchemyNetwork: Network.BASE_MAINNET,
		chainId: 8453,
	},
};

async function getTokenBalances(
	address: string,
	network: Network
): Promise<any> {
	const apiKey = process.env.ALCHEMY_API_KEY;
	if (!apiKey) {
		throw new Error("ALCHEMY_API_KEY is not set in the environment variables");
	}

	const alchemy = new Alchemy({ apiKey, network });

	try {
		const balances = await alchemy.core.getTokenBalances(address);
		const nonZeroBalances = balances.tokenBalances.filter(
			(token) => token.tokenBalance !== "0"
		);
		const bannedTokens = ["POV"];

		const formattedBalances = await Promise.all(
			nonZeroBalances.map(async (token) => {
				const metadata = await alchemy.core.getTokenMetadata(
					token.contractAddress
				);
				if (!metadata) {
					throw new Error(
						`Failed to fetch metadata for token: ${token.contractAddress}`
					);
				}
				if (!token.tokenBalance || !metadata.decimals) {
					throw new Error(
						`Failed to fetch balance for token: ${token.contractAddress}`
					);
				}
				if (metadata.symbol && bannedTokens.includes(metadata.symbol)) {
					return null;
				}
				const balance =
					parseInt(token.tokenBalance) / Math.pow(10, metadata.decimals);
				return {
					name: metadata.name,
					symbol: metadata.symbol,
					balance: balance.toFixed(4),
				};
			})
		);

		return formattedBalances.filter(
			(token) => token && parseFloat(token.balance) > 0
		);
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Failed to fetch token balances: ${error.message}`);
		} else {
			throw new Error(
				"An unexpected error occurred while fetching token balances"
			);
		}
	}
}

export const getMultiChainInfoAndBalances = tool(
	async ({
		chainNames,
		address,
	}: {
		chainNames: string[];
		address: string;
	}) => {
		try {
			const results = await Promise.all(
				chainNames.map(async (chainName) => {
					const normalizedChainName = chainName.toLowerCase().trim();

					if (!(normalizedChainName in chainConfig)) {
						return {
							chainName: normalizedChainName,
							error: `Chain configuration not found for: ${chainName}`,
						};
					}

					const { rpcUrl, alchemyNetwork } = chainConfig[normalizedChainName];

					try {
						const provider = new ethers.JsonRpcProvider(rpcUrl);
						const ethBalance = await provider.getBalance(address);
						const ethBalanceInEth = ethers.formatEther(ethBalance);

						let tokenBalances = await getTokenBalances(address, alchemyNetwork);
						tokenBalances = [
							{
								name: "Ethereum",
								symbol: "ETH",
								balance: ethBalanceInEth,
							},
							...tokenBalances,
						];

						return {
							chainName: normalizedChainName,
							rpcUrl,
							tokenBalances,
						};
					} catch (error) {
						if (error instanceof Error) {
							return {
								chainName: normalizedChainName,
								error: `Failed to fetch chain info and balances: ${error.message}`,
							};
						} else {
							return {
								chainName: normalizedChainName,
								error:
									"An unexpected error occurred while fetching chain info and balances",
							};
						}
					}
				})
			);

			return JSON.stringify(results, null, 4);
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Failed to process chains: ${error.message}`);
			} else {
				throw new Error("An unexpected error occurred while processing chains");
			}
		}
	},
	{
		name: "get_multi_chain_info_and_balances",
		description:
			"Get the RPC URLs and token balances for multiple blockchain networks and a given address",
		schema: z.object({
			chainNames: z
				.array(z.string())
				.describe("An array of blockchain network names (e.g., ['base'])"),
			address: z.string().describe("The address to check the balances for"),
		}),
	}
);
