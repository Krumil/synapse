import { tool } from "@langchain/core/tools";
import { z } from "zod";
import fs from 'fs/promises';
import path from 'path';

interface Protocol {
	chain: string;
	project: string;
	symbol: string;
	tvlUsd: number;
	apyBase: number;
	apyReward: number | null;
	apy: number;
	pool: string;
	stablecoin: boolean;
	ilRisk: string;
	exposure: string;
	poolMeta: string | null;
}

interface ChainData {
	timestamp: string;
	chain: string;
	protocols: Protocol[];
	count: number;
}

async function readChainData(chain: string): Promise<ChainData | null> {
	try {
		const dataDir = path.join(__dirname, '../../../data');
		const filePath = path.join(dataDir, `${chain.toLowerCase()}.json`);
		const data = await fs.readFile(filePath, 'utf-8');
		return JSON.parse(data) as ChainData;
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
			const dataDir = path.join(__dirname, '../../../data');
			const files = await fs.readdir(dataDir);

			let allProtocols: Array<Protocol & { chain: string }> = [];

			// Collect protocols from all chain files
			for (const file of files) {
				if (!file.endsWith('.json')) continue;

				const filePath = path.join(dataDir, file);
				const data = await fs.readFile(filePath, 'utf-8');
				const chainData = JSON.parse(data) as ChainData;

				allProtocols = allProtocols.concat(chainData.protocols);
			}

			// Filter and sort protocols
			const filteredProtocols = allProtocols
				.filter(p => p.tvlUsd >= minTvl && (p.apy || 0) >= minApy)
				.sort((a, b) => b.tvlUsd - a.tvlUsd)
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
					project: p.project,
					symbol: p.symbol,
					tvlUsd: p.tvlUsd,
					apy: p.apy,
					apyBase: p.apyBase,
					apyReward: p.apyReward,
					stablecoin: p.stablecoin,
					ilRisk: p.ilRisk,
					exposure: p.exposure
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

export const defiTools = [
	getDefiDataTool,
	getTopDefiProtocolsTool
];