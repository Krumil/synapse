"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defiLlamaTools = void 0;
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
async function readChainData(chain) {
    try {
        const dataDir = path_1.default.join(__dirname, '../../../data');
        const filePath = path_1.default.join(dataDir, `${chain.toLowerCase()}.json`);
        const data = await promises_1.default.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        return null;
    }
}
const getDefiDataTool = (0, tools_1.tool)(async ({ chain, project, sortBy = 'tvlUsd', limit = 10 }) => {
    try {
        const chainData = await readChainData(chain);
        if (!chainData) {
            throw new Error(`No data available for chain: ${chain}`);
        }
        let filteredProtocols = chainData.protocols;
        // Filter by project if specified
        if (project) {
            filteredProtocols = filteredProtocols.filter(p => p.project.toLowerCase().includes(project.toLowerCase()));
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
    }
    catch (error) {
        throw new Error(`Failed to get DeFi data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}, {
    name: "get_defi_data",
    description: "Get DeFi protocols data for a specific blockchain network, optionally filtered by project name",
    schema: zod_1.z.object({
        chain: zod_1.z.string().describe("The blockchain network (e.g., ethereum, solana)"),
        project: zod_1.z.string().optional().describe("Optional project name to filter by"),
        sortBy: zod_1.z.enum(['tvlUsd', 'apy']).optional().describe("Sort results by TVL or APY (default: tvlUsd)"),
        limit: zod_1.z.number().optional().describe("Maximum number of results to return (default: 10)")
    })
});
const getTopDefiProtocolsTool = (0, tools_1.tool)(async ({ minTvl = 1000000, minApy = 0, limit = 10 }) => {
    try {
        const dataDir = path_1.default.join(__dirname, '../../../data');
        const files = await promises_1.default.readdir(dataDir);
        let allProtocols = [];
        // Collect protocols from all chain files
        for (const file of files) {
            if (!file.endsWith('.json'))
                continue;
            const filePath = path_1.default.join(dataDir, file);
            const data = await promises_1.default.readFile(filePath, 'utf-8');
            const chainData = JSON.parse(data);
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
    }
    catch (error) {
        throw new Error(`Failed to get top DeFi protocols: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}, {
    name: "get_top_defi_protocols",
    description: "Get top DeFi protocols across all chains, filtered by minimum TVL and APY",
    schema: zod_1.z.object({
        minTvl: zod_1.z.number().optional().describe("Minimum TVL in USD (default: 1,000,000)"),
        minApy: zod_1.z.number().optional().describe("Minimum APY percentage (default: 0)"),
        limit: zod_1.z.number().optional().describe("Maximum number of results to return (default: 10)")
    })
});
exports.defiLlamaTools = [
    getDefiDataTool,
    getTopDefiProtocolsTool
];
