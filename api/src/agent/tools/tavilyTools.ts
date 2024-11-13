import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import dotenv from "dotenv";

dotenv.config();

export const tavilyTool = new TavilySearchResults({
	maxResults: 1,
	apiKey: process.env.TAVILY_API_KEY,
});
