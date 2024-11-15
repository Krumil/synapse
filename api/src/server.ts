import express from 'express';
import routes from './routes';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Constants
const YIELDS_API_URL = 'https://yields.llama.fi/pools';
const DATA_DIR = path.join(__dirname, '../data');
const FETCH_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds

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

interface ApiResponse {
	status: string;
	data: YieldData[];
}

// Ensure data directory exists
async function ensureDataDir() {
	try {
		await fs.access(DATA_DIR);
	} catch {
		await fs.mkdir(DATA_DIR, { recursive: true });
	}
}

// Fetch and save yields data
async function fetchAndSaveYields() {
	try {
		console.log('Fetching yields data...');
		const response = await axios.get<ApiResponse>(YIELDS_API_URL);

		// Group data by chain
		const chainData: { [key: string]: YieldData[] } = {};

		response.data.data.forEach(protocol => {
			const chain = protocol.chain.toLowerCase(); // normalize chain names
			if (!chainData[chain]) {
				chainData[chain] = [];
			}
			chainData[chain].push(protocol);
		});

		// Save each chain's data to a separate file
		for (const [chain, protocols] of Object.entries(chainData)) {
			const filename = `${chain}.json`;
			const filepath = path.join(DATA_DIR, filename);

			await fs.writeFile(
				filepath,
				JSON.stringify({
					timestamp: new Date().toISOString(),
					chain,
					protocols,
					count: protocols.length
				}, null, '\t')
			);
			console.log(`${chain} data saved to ${filename}`);
		}

	} catch (error) {
		console.error('Error fetching yields data:', error);
	}
}

// Initialize data fetching
async function initializeDataFetching() {
	await ensureDataDir();

	// // Fetch immediately on startup
	// await fetchAndSaveYields();

	// Set up periodic fetching
	setInterval(fetchAndSaveYields, FETCH_INTERVAL);
}

// Start the server and initialize data fetching
app.use(express.json());
app.use('/api', routes);

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
	initializeDataFetching().catch(console.error);
});