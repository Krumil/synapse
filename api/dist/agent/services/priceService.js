"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceService = void 0;
const starknet_1 = require("starknet");
const axios_1 = __importDefault(require("axios"));
const defiUtils_1 = require("../utils/defiUtils");
const LP_POOL_ABI = [
    {
        name: "get_reserves",
        type: "function",
        inputs: [],
        outputs: [
            { name: "reserve0", type: "(felt, felt)" },
            { name: "reserve1", type: "(felt, felt)" }
        ],
        stateMutability: "view"
    },
    {
        name: "total_supply",
        type: "function",
        inputs: [],
        outputs: [{ name: "supply", type: "(felt, felt)" }],
        stateMutability: "view"
    }
];
class PriceService {
    constructor(alchemyEndpoint, alchemyApiKey) {
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        this.provider = new starknet_1.RpcProvider({
            nodeUrl: alchemyEndpoint + alchemyApiKey
        });
        this.priceCache = new Map();
    }
    getCachedPrice(key) {
        const cached = this.priceCache.get(key);
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            return cached.price;
        }
        return null;
    }
    setCachedPrice(key, price) {
        this.priceCache.set(key, {
            price,
            timestamp: Date.now()
        });
    }
    async getTokenPrice(tokenAddress, protocolConfig, protocol, tokenKey) {
        const cacheKey = `${tokenAddress}-${protocol}-${tokenKey}`;
        const cachedPrice = this.getCachedPrice(cacheKey);
        if (cachedPrice !== null) {
            return cachedPrice;
        }
        const pairs = protocolConfig.protocols[protocol].contracts.pairs;
        let price;
        if (pairs[tokenKey]) {
            const underlyingTokens = tokenKey.split('/');
            price = await this.getLPTokenPrice(pairs[tokenKey].pairAddress, protocolConfig, protocol, underlyingTokens);
        }
        else {
            price = await this.fetchTokenPrice(tokenAddress);
        }
        this.setCachedPrice(cacheKey, price);
        return price;
    }
    async fetchTokenPrice(tokenAddress) {
        try {
            const { data } = await axios_1.default.get(`https://starknet.impulse.avnu.fi/v1/tokens/${tokenAddress}/prices/line`);
            const currentPrice = data[data.length - 1]?.value;
            if (!currentPrice) {
                throw new Error(`No price data available for token ${tokenAddress}`);
            }
            return currentPrice;
        }
        catch (error) {
            console.error(`Failed to fetch token price for ${tokenAddress}:`, error);
            throw new Error(`Failed to fetch token price: ${error}`);
        }
    }
    async getLPTokenPrice(poolAddress, protocolConfig, protocol, underlyingTokens) {
        try {
            const poolContract = new starknet_1.Contract(LP_POOL_ABI, poolAddress, this.provider);
            const [reservesResult, totalSupplyResult] = await Promise.all([
                poolContract.call("get_reserves", []),
                poolContract.call("total_supply", [])
            ]);
            const [reserve0, reserve1, totalSupply] = await this.processPoolData(reservesResult, totalSupplyResult);
            const [token0Price, token1Price, token0Config, token1Config] = await this.getUnderlyingTokenData(protocolConfig, protocol, underlyingTokens);
            return this.calculateLPTokenPrice(reserve0, reserve1, totalSupply, token0Price, token1Price, token0Config.decimals, token1Config.decimals);
        }
        catch (error) {
            console.error(`Failed to calculate LP token price for pool ${poolAddress}:`, error);
            throw error;
        }
    }
    async processPoolData(reservesResult, totalSupplyResult) {
        const reserve0 = (0, defiUtils_1.reconstructUint256)(reservesResult.reserve0[0], reservesResult.reserve0[1]);
        const reserve1 = (0, defiUtils_1.reconstructUint256)(reservesResult.reserve1[0], reservesResult.reserve1[1]);
        const totalSupply = (0, defiUtils_1.reconstructUint256)(totalSupplyResult.supply[0], totalSupplyResult.supply[1]);
        return [reserve0, reserve1, totalSupply];
    }
    async getUnderlyingTokenData(protocolConfig, protocol, underlyingTokens) {
        const token0Config = protocolConfig.protocols[protocol].contracts.assets[underlyingTokens[0]];
        const token1Config = protocolConfig.protocols[protocol].contracts.assets[underlyingTokens[1]];
        const [token0Price, token1Price] = await Promise.all([
            this.getTokenPrice(token0Config.assetContractAddress, protocolConfig, protocol, underlyingTokens[0]),
            this.getTokenPrice(token1Config.assetContractAddress, protocolConfig, protocol, underlyingTokens[1])
        ]);
        return [token0Price, token1Price, token0Config, token1Config];
    }
    calculateLPTokenPrice(reserve0, reserve1, totalSupply, token0Price, token1Price, token0Decimals, token1Decimals) {
        const reserve0USD = Number(reserve0) * token0Price / (10 ** token0Decimals);
        const reserve1USD = Number(reserve1) * token1Price / (10 ** token1Decimals);
        const totalPoolValueUSD = reserve0USD + reserve1USD;
        return totalPoolValueUSD / (Number(totalSupply) / (10 ** 18));
    }
}
exports.PriceService = PriceService;
