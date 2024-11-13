import { tool } from "@langchain/core/tools";
import { z } from "zod";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const CRYPTO_PANIC_API_KEY = process.env.CRYPTO_PANIC_API_KEY;

export const getNewsTool = tool(
	async ({
		currencies,
		filter,
	}: {
		currencies: string;
		filter: 'rising' | 'hot' | 'bullish' | 'bearish' | 'important' | 'saved' | 'lol';
	}) => {
		try {
			const baseUrl = 'https://cryptopanic.com/api/v1/posts/';
			const params = new URLSearchParams({
				auth_token: CRYPTO_PANIC_API_KEY || '',
				public: 'true',
			});

			if (currencies) params.append('currencies', currencies);
			if (filter) params.append('filter', filter);
			params.append('kind', 'news');

			const url = `${baseUrl}?${params.toString()}`;

			const response = await axios.get(url);
			return JSON.stringify(response.data, null, 2);
		} catch (error) {
			if (error instanceof Error) {
				return JSON.stringify({
					error: `Failed to fetch news from CryptoPanic: ${error.message}`,
				});
			} else {
				return JSON.stringify({
					error: "An unexpected error occurred while fetching news from CryptoPanic",
				});
			}
		}
	},
	{
		name: "get_news_from_cryptopanic",
		description: "Fetch cryptocurrency news from CryptoPanic API",
		schema: z.object({
			currencies: z.string().describe("Comma-separated list of currency codes to get news for (e.g., 'BTC,ETH')"),
			filter: z.enum(['rising', 'hot', 'bullish', 'bearish', 'important', 'saved', 'lol']).describe("Filter for the news type"),
		}),
	}
);
