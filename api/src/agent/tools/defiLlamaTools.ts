import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getYieldsFromS3 } from '../utils/defiUtils';
import { ChainData } from '../../types/defi';


async function readChainData(chain: string): Promise<ChainData | null> {
	try {
		const allYields: ChainData[] = await getYieldsFromS3();
		const chainData: ChainData[] = allYields.filter(p =>
			p.chain.toLowerCase() === chain.toLowerCase()
		);

		if (chainData.length === 0) return null;

		const protocols = chainData[0].protocols;

		return {
			timestamp: new Date().toISOString(),
			chain,
			protocols,
			count: protocols.length
		};
	} catch (error) {
		return null;
	}
}

const getDefiDataTool = tool(
	async ({ chain, project, sortBy = 'tvlUsd', limit = 10 }: {
		chain: string;
		project?: string;
		sortBy?: 'tvlUsd' | 'apy';
		limit?: number;
	}) => {
		try {
			const chainData = await readChainData(chain);
			if (!chainData) {
				throw new Error(`No data available for chain: ${chain}`);
			}

			let filteredProtocols = chainData.protocols;

			// Filter by project if specified
			if (project) {
				filteredProtocols = filteredProtocols.filter(p =>
					p.project.toLowerCase().includes(project.toLowerCase())
				);
			}

			// Sort protocols
			filteredProtocols.sort((a, b) => {
				if (sortBy === 'apy') {
					return (b.apy || 0) - (a.apy || 0);
				}
				return (b.tvlUsd || 0) - (a.tvlUsd || 0);
			});

			// Limit results
			filteredProtocols = filteredProtocols.slice(0, limit);

			const result = {
				type: "top_protocols",
				timestamp: chainData.timestamp,
				chain: chainData.chain,
				totalProtocols: chainData.count,
				filteredProtocols: filteredProtocols.length,
				protocols: filteredProtocols.map(p => ({
					project: p.project,
					symbol: p.symbol,
					tvlUsd: p.tvlUsd,
					apy: p.apy,
					apyBase: p.apyBase,
					apyReward: p.apyReward,
					stablecoin: p.stablecoin,
					ilRisk: p.ilRisk,
					exposure: p.exposure,
					poolMeta: p.poolMeta
				}))
			};

			return JSON.stringify(result, null, 2);
		} catch (error) {
			throw new Error(`Failed to get DeFi data: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	},
	{
		name: "get_defi_data",
		description: "Get DeFi protocols data for a specific blockchain network, optionally filtered by project name",
		schema: z.object({
			chain: z.string().describe("The blockchain network (e.g., ethereum, solana)"),
			project: z.string().optional().describe("Optional project name to filter by"),
			sortBy: z.enum(['tvlUsd', 'apy']).optional().describe("Sort results by TVL or APY (default: tvlUsd)"),
			limit: z.number().optional().describe("Maximum number of results to return (default: 10)")
		})
	}
);

const getTopDefiProtocolsTool = tool(
	async ({ minTvl = 1000000, minApy = 0, limit = 10 }: {
		minTvl?: number;
		minApy?: number;
		limit?: number;
	}) => {
		try {
			const allChainData: ChainData[] = await getYieldsFromS3();

			// Filter and sort protocols
			const filteredProtocols = allChainData
				.filter(p => p.protocols.some(p => p.tvlUsd >= minTvl && (p.apy || 0) >= minApy))
				.sort((a, b) => b.protocols.reduce((acc, p) => acc + (p.tvlUsd || 0), 0) - a.protocols.reduce((acc, p) => acc + (p.tvlUsd || 0), 0))
				.slice(0, limit);

			const result = {
				type: "defi",
				timestamp: new Date().toISOString(),
				totalProtocols: filteredProtocols.length,
				filters: {
					minTvl,
					minApy
				},
				protocols: filteredProtocols.map(p => ({
					chain: p.chain,
					project: p.protocols[0].project,
					symbol: p.protocols[0].symbol,
					tvlUsd: p.protocols[0].tvlUsd,
					apy: p.protocols[0].apy,
					apyBase: p.protocols[0].apyBase,
					apyReward: p.protocols[0].apyReward,
					stablecoin: p.protocols[0].stablecoin,
					ilRisk: p.protocols[0].ilRisk,
					exposure: p.protocols[0].exposure
				}))
			};

			return JSON.stringify(result, null, 2);
		} catch (error) {
			throw new Error(`Failed to get top DeFi protocols: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	},
	{
		name: "get_top_defi_protocols",
		description: "Get top DeFi protocols across all chains, filtered by minimum TVL and APY",
		schema: z.object({
			minTvl: z.number().optional().describe("Minimum TVL in USD (default: 1,000,000)"),
			minApy: z.number().optional().describe("Minimum APY percentage (default: 0)"),
			limit: z.number().optional().describe("Maximum number of results to return (default: 10)")
		})
	}
);

export const defiLlamaTools = [
	getDefiDataTool,
	// getTopDefiProtocolsTool
];