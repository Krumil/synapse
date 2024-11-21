import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getTokensFromS3 } from "../utils/defiUtils";
import { Token } from "@/types/defi";

const getTokenDetailsTool = tool(
	async ({ symbol, name }: { symbol: string, name: string }) => {
		const tokens = await getTokensFromS3();
		let address = tokens.find((token: Token) => token.symbol === symbol)?.l2_token_address;
		if (!address) {
			address = tokens.find((token: Token) => token.name === name)?.l2_token_address;
		}
		try {
			const response = await fetch(`https://starknet.impulse.avnu.fi/v1/tokens/${address}`);
			if (!response.ok) {
				throw new Error(`API request failed with status ${response.status}`);
			}

			const token = await response.json();

			// Get price history
			const priceResponse = await fetch(`https://starknet.impulse.avnu.fi/v1/tokens/${address}/prices/line`);
			const priceHistory = await priceResponse.json();

			// Get volume history
			const volumeResponse = await fetch(`https://starknet.impulse.avnu.fi/v1/tokens/${address}/volumes/line`);
			const volumeHistory = await volumeResponse.json();

			return JSON.stringify({
				token: {
					name: token.name,
					symbol: token.symbol,
					address: token.address,
					verified: token.verified,
					market: token.market,
					priceHistory: priceHistory.slice(-7),
					volumeHistory: volumeHistory.slice(-7)
				}
			}, null, 2);
		} catch (error) {
			throw new Error(`Failed to fetch token details: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	},
	{
		name: "get_token_details",
		description: "Get detailed information about a specific token on Starknet, including price and volume history",
		schema: z.object({
			symbol: z.string().describe("The token's symbol"),
			name: z.string().describe("The token's name")
		})
	}
);

const getTokenExchangeDataTool = tool(
	async ({ address }: { address: string }) => {
		try {
			// Get exchange volumes
			const volumeResponse = await fetch(`https://starknet.impulse.avnu.fi/v1/tokens/${address}/exchange-volumes`);
			const volumes = await volumeResponse.json();

			// Get TVL data
			const tvlResponse = await fetch(`https://starknet.impulse.avnu.fi/v1/tokens/${address}/exchange-tvl`);
			const tvl = await tvlResponse.json();

			return JSON.stringify({
				exchangeData: {
					volumes: volumes.map((v: any) => ({
						exchange: v.exchange,
						volumeUsd: v.value
					})),
					tvl: tvl.map((t: any) => ({
						exchange: t.exchange,
						tvlUsd: t.valueUsd,
						tvlTokens: t.value,
						timestamp: t.date
					}))
				}
			}, null, 2);
		} catch (error) {
			throw new Error(`Failed to fetch exchange data: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	},
	{
		name: "get_token_exchange_data",
		description: "Get detailed exchange-specific volume and TVL data for a token on Starknet",
		schema: z.object({
			address: z.string().describe("The token's contract address on Starknet")
		})
	}
);

const getTokenPriceFeedTool = tool(
	async ({ address }: { address: string }) => {
		try {
			const response = await fetch(`https://starknet.impulse.avnu.fi/v1/tokens/${address}/prices/line`);
			if (!response.ok) {
				throw new Error(`API request failed with status ${response.status}`);
			}

			const priceFeed = await response.json();

			// Get the most recent price entry
			const currentPrice = priceFeed[priceFeed.length - 1]?.value ?? null;
			const lastUpdated = priceFeed[priceFeed.length - 1]?.date ?? null;

			// Get 24h ago price for percentage calculation
			const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
			const previousPrice = priceFeed.find((entry: { date: string; value: number }) => entry.date <= oneDayAgo)?.value;

			// Calculate 24h price change percentage
			const priceChange24h = previousPrice
				? ((currentPrice - previousPrice) / previousPrice) * 100
				: null;

			return JSON.stringify({
				tokenAddress: address,
				currentPrice: currentPrice,
				lastUpdated: lastUpdated,
				priceChange24h: priceChange24h ? `${priceChange24h.toFixed(2)}%` : null,
				historicalPrices: priceFeed.slice(-24).map((entry: { date: string; value: number }) => ({
					timestamp: entry.date,
					priceUsd: entry.value
				}))
			}, null, 2);
		} catch (error) {
			throw new Error(`Failed to fetch token price feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	},
	{
		name: "get_token_price",
		description: "Get current price and 24h price change for a token on Starknet, along with recent historical prices",
		schema: z.object({
			address: z.string().describe("The token's contract address on Starknet")
		})
	}
);

export const starknetTools = [
	getTokenDetailsTool,
	getTokenExchangeDataTool,
	getTokenPriceFeedTool
];