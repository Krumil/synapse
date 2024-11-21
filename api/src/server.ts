import express from 'express';
import routes from './routes/index';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware and routes
app.use(express.json());
app.use('/api', routes);

// Function to fetch tokens from AVNU API
async function fetchAndSaveTokens() {
	try {
		const response = await axios.get('https://starknet.api.avnu.fi/v1/starknet/tokens');
		const tokens = response.data.content;

		// Format tokens and filter by volume
		const formattedTokens = tokens
			.filter((token: any) => token.lastDailyVolumeUsd >= 100)
			.map((token: any) => ({
				name: token.name,
				symbol: token.symbol,
				decimals: token.decimals || 18,
				l2_token_address: token.address,
				tags: token.tags || [],
				logoUri: token.logoUri,
				lastDailyVolumeUsd: token.lastDailyVolumeUsd
			}));

		// Save to tokens.json
		const filePath = path.join(__dirname, 'agent', 'config', 'tokens.json');
		await fs.writeFile(filePath, JSON.stringify(formattedTokens, null, 4));
		console.log('Tokens updated successfully');
	} catch (error) {
		console.error('Error updating tokens:', error);
	}
}

// Initial fetch
fetchAndSaveTokens();

// Schedule token updates every hour
setInterval(fetchAndSaveTokens, 60 * 60 * 1000);

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});

// Export the app as a serverless function
module.exports = app;