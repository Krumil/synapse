import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

const YIELDS_API_URL = 'https://yields.llama.fi/pools';
const DATA_DIR = path.join(__dirname, '../data');

interface YieldData {
	chain: string;
	project: string;
	symbol: string;
	tvlUsd: number;
	apyBase: number;
	apyReward: number | null;
	apy: number;
	rewardTokens: string[] | null;
	pool: string;
	apyPct1D: number;
	apyPct7D: number;
	apyPct30D: number;
	stablecoin: boolean;
	ilRisk: string;
	exposure: string;
	predictions: {
		predictedClass: string | null;
		predictedProbability: number | null;
		binnedConfidence: number | null;
	};
	poolMeta: string | null;
	mu: number;
	sigma: number;
	count: number;
	outlier: boolean;
	underlyingTokens: string[];
	il7d: number | null;
	apyBase7d: number | null;
	apyMean30d: number;
	volumeUsd1d: number | null;
	volumeUsd7d: number | null;
	apyBaseInception: number | null;
}

export async function fetchAndSaveYields() {
	try {
		console.log('Fetching yields data...');
		const response = await axios.get(YIELDS_API_URL);

		const chainData: { [key: string]: YieldData[] } = {};
		response.data.data.forEach((protocol: YieldData) => {
			const chain = protocol.chain.toLowerCase();
			if (!chainData[chain]) {
				chainData[chain] = [];
			}
			chainData[chain].push(protocol);
		});

		for (const [chain, protocols] of Object.entries(chainData)) {
			const filename = `${chain}.json`;
			const filepath = path.join(DATA_DIR, filename);
			await fs.writeFile(
				filepath,
				JSON.stringify({
					timestamp: new Date().toISOString(),
					chain,
					protocols,
					count: protocols.length,
				}, null, '\t')
			);
			console.log(`${chain} data saved to ${filename}`);
		}
	} catch (error) {
		console.error('Error fetching yields data:', error);
	}
}

