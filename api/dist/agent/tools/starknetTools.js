"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.starknetTools = void 0;
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const defiUtils_1 = require("../utils/defiUtils");
const getTopStarknetTokensTool = (0, tools_1.tool)(async ({ limit = 10 }) => {
    try {
        const response = await fetch('https://starknet.impulse.avnu.fi/v1/tokens');
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        const tokens = await response.json();
        // Sort by TVL and take top N
        const topTokens = tokens
            .sort((a, b) => b.market.starknetTvl - a.market.starknetTvl)
            .slice(0, limit)
            .map(token => ({
            name: token.name,
            symbol: token.symbol,
            tvlUsd: token.market.starknetTvl,
            price: token.market.currentPrice,
            priceChange24h: token.market.priceChangePercentage24h,
            volume24h: token.market.starknetVolume24h,
            marketCap: token.market.marketCap,
            address: token.address
        }));
        return JSON.stringify({
            timestamp: new Date().toISOString(),
            count: topTokens.length,
            tokens: topTokens
        }, null, 2);
    }
    catch (error) {
        throw new Error(`Failed to fetch Starknet tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}, {
    name: "get_top_starknet_tokens",
    description: "Get the top tokens on Starknet by TVL",
    schema: zod_1.z.object({
        limit: zod_1.z.number().optional().describe("Maximum number of tokens to return (default: 10)")
    })
});
const getTokenDetailsTool = (0, tools_1.tool)(async ({ symbol, name }) => {
    const tokens = await (0, defiUtils_1.getTokensFromS3)();
    let address = tokens.find((token) => token.symbol === symbol)?.l2_token_address;
    if (!address) {
        address = tokens.find((token) => token.name === name)?.l2_token_address;
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
    }
    catch (error) {
        throw new Error(`Failed to fetch token details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}, {
    name: "get_token_details",
    description: "Get detailed information about a specific token on Starknet, including price and volume history",
    schema: zod_1.z.object({
        symbol: zod_1.z.string().describe("The token's symbol"),
        name: zod_1.z.string().describe("The token's name")
    })
});
const getTokenExchangeDataTool = (0, tools_1.tool)(async ({ address }) => {
    try {
        // Get exchange volumes
        const volumeResponse = await fetch(`https://starknet.impulse.avnu.fi/v1/tokens/${address}/exchange-volumes`);
        const volumes = await volumeResponse.json();
        // Get TVL data
        const tvlResponse = await fetch(`https://starknet.impulse.avnu.fi/v1/tokens/${address}/exchange-tvl`);
        const tvl = await tvlResponse.json();
        return JSON.stringify({
            exchangeData: {
                volumes: volumes.map((v) => ({
                    exchange: v.exchange,
                    volumeUsd: v.value
                })),
                tvl: tvl.map((t) => ({
                    exchange: t.exchange,
                    tvlUsd: t.valueUsd,
                    tvlTokens: t.value,
                    timestamp: t.date
                }))
            }
        }, null, 2);
    }
    catch (error) {
        throw new Error(`Failed to fetch exchange data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}, {
    name: "get_token_exchange_data",
    description: "Get detailed exchange-specific volume and TVL data for a token on Starknet",
    schema: zod_1.z.object({
        address: zod_1.z.string().describe("The token's contract address on Starknet")
    })
});
const getTokenPriceFeedTool = (0, tools_1.tool)(async ({ address }) => {
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
        const previousPrice = priceFeed.find((entry) => entry.date <= oneDayAgo)?.value;
        // Calculate 24h price change percentage
        const priceChange24h = previousPrice
            ? ((currentPrice - previousPrice) / previousPrice) * 100
            : null;
        return JSON.stringify({
            tokenAddress: address,
            currentPrice: currentPrice,
            lastUpdated: lastUpdated,
            priceChange24h: priceChange24h ? `${priceChange24h.toFixed(2)}%` : null,
            historicalPrices: priceFeed.slice(-24).map((entry) => ({
                timestamp: entry.date,
                priceUsd: entry.value
            }))
        }, null, 2);
    }
    catch (error) {
        throw new Error(`Failed to fetch token price feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}, {
    name: "get_token_price",
    description: "Get current price and 24h price change for a token on Starknet, along with recent historical prices",
    schema: zod_1.z.object({
        address: zod_1.z.string().describe("The token's contract address on Starknet")
    })
});
exports.starknetTools = [
    getTopStarknetTokensTool,
    getTokenDetailsTool,
    getTokenExchangeDataTool,
    getTokenPriceFeedTool
];
