import { RpcProvider, Contract } from "starknet";
import axios from 'axios';
import { ProtocolConfig } from '../../types/defi';
import { reconstructUint256 } from '../utils/defiUtils';

interface PoolReserves {
	reserve0: [string, string];
	reserve1: [string, string];
}

interface TotalSupply {
	supply: [string, string];
}

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
] as const;

export class PriceService {
	private provider: RpcProvider;
	private priceCache: Map<string, { price: number; timestamp: number }>;
	private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

	constructor(alchemyEndpoint: string, alchemyApiKey: string) {
		this.provider = new RpcProvider({
			nodeUrl: alchemyEndpoint + alchemyApiKey
		});
		this.priceCache = new Map();
	}

	private getCachedPrice(key: string): number | null {
		const cached = this.priceCache.get(key);
		if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
			return cached.price;
		}
		return null;
	}

	private setCachedPrice(key: string, price: number): void {
		this.priceCache.set(key, {
			price,
			timestamp: Date.now()
		});
	}

	async getTokenPrice(
		tokenAddress: string,
		protocolConfig: ProtocolConfig,
		protocol: string,
		tokenKey: string
	): Promise<number> {
		const cacheKey = `${tokenAddress}-${protocol}-${tokenKey}`;
		const cachedPrice = this.getCachedPrice(cacheKey);
		if (cachedPrice !== null) {
			return cachedPrice;
		}

		const pairs = protocolConfig.protocols[protocol].contracts.pairs;
		let price: number;

		if (pairs[tokenKey]) {
			const underlyingTokens = tokenKey.split('/');
			price = await this.getLPTokenPrice(
				pairs[tokenKey].pairAddress,
				protocolConfig,
				protocol,
				underlyingTokens
			);
		} else {
			price = await this.fetchTokenPrice(tokenAddress);
		}

		this.setCachedPrice(cacheKey, price);
		return price;
	}

	private async fetchTokenPrice(tokenAddress: string): Promise<number> {
		try {
			const { data } = await axios.get(
				`https://starknet.impulse.avnu.fi/v1/tokens/${tokenAddress}/prices/line`
			);

			const currentPrice = data[data.length - 1]?.value;
			if (!currentPrice) {
				throw new Error(`No price data available for token ${tokenAddress}`);
			}

			return currentPrice;
		} catch (error) {
			console.error(`Failed to fetch token price for ${tokenAddress}:`, error);
			throw new Error(`Failed to fetch token price: ${error}`);
		}
	}

	private async getLPTokenPrice(
		poolAddress: string,
		protocolConfig: ProtocolConfig,
		protocol: string,
		underlyingTokens: string[]
	): Promise<number> {
		try {
			const poolContract = new Contract(
				LP_POOL_ABI,
				poolAddress,
				this.provider
			);

			const [reservesResult, totalSupplyResult] = await Promise.all([
				poolContract.call("get_reserves", []),
				poolContract.call("total_supply", [])
			]) as [PoolReserves, TotalSupply];

			const [reserve0, reserve1, totalSupply] = await this.processPoolData(
				reservesResult,
				totalSupplyResult
			);

			const [token0Price, token1Price, token0Config, token1Config] = await this.getUnderlyingTokenData(
				protocolConfig,
				protocol,
				underlyingTokens
			);

			return this.calculateLPTokenPrice(
				reserve0,
				reserve1,
				totalSupply,
				token0Price,
				token1Price,
				token0Config.decimals,
				token1Config.decimals
			);
		} catch (error) {
			console.warn(`Failed to calculate LP token price for pool ${poolAddress}:`, error);
			return 0;
		}
	}

	private async processPoolData(
		reservesResult: PoolReserves,
		totalSupplyResult: TotalSupply
	): Promise<[bigint, bigint, bigint]> {
		const reserve0 = reconstructUint256(reservesResult.reserve0[0], reservesResult.reserve0[1]);
		const reserve1 = reconstructUint256(reservesResult.reserve1[0], reservesResult.reserve1[1]);
		const totalSupply = reconstructUint256(totalSupplyResult.supply[0], totalSupplyResult.supply[1]);

		return [reserve0, reserve1, totalSupply];
	}

	private async getUnderlyingTokenData(
		protocolConfig: ProtocolConfig,
		protocol: string,
		underlyingTokens: string[]
	): Promise<[number, number, any, any]> {
		const token0Config = protocolConfig.protocols[protocol].contracts.assets[underlyingTokens[0]];
		const token1Config = protocolConfig.protocols[protocol].contracts.assets[underlyingTokens[1]];

		const [token0Price, token1Price] = await Promise.all([
			this.getTokenPrice(
				token0Config.assetContractAddress,
				protocolConfig,
				protocol,
				underlyingTokens[0]
			),
			this.getTokenPrice(
				token1Config.assetContractAddress,
				protocolConfig,
				protocol,
				underlyingTokens[1]
			)
		]);

		return [token0Price, token1Price, token0Config, token1Config];
	}

	private calculateLPTokenPrice(
		reserve0: bigint,
		reserve1: bigint,
		totalSupply: bigint,
		token0Price: number,
		token1Price: number,
		token0Decimals: number,
		token1Decimals: number
	): number {
		const reserve0USD = Number(reserve0) * token0Price / (10 ** token0Decimals);
		const reserve1USD = Number(reserve1) * token1Price / (10 ** token1Decimals);
		const totalPoolValueUSD = reserve0USD + reserve1USD;
		return totalPoolValueUSD / (Number(totalSupply) / (10 ** 18));
	}
}