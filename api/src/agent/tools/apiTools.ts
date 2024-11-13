import { tool } from "@langchain/core/tools";
import { z } from "zod";
import axios from "axios";
import fs from "fs";
import path from "path";

const apiData = JSON.parse(
	fs.readFileSync(path.join(process.cwd(), "src/public_apis.json"), "utf-8")
);
const apis = apiData.apis;

export const callApi = tool(
	async ({ apiName, params }: { apiName: string; params?: any }) => {
		try {
			const chosenApi = apis.find(
				(api: any) => api.name.toLowerCase() === apiName.toLowerCase()
			);

			if (!chosenApi) {
				return JSON.stringify({
					error: "API not found in the list of unconventional APIs",
				});
			}

			let url = chosenApi.url;
			if (params) {
				// Replace placeholders in the URL with provided params
				Object.keys(params).forEach((key) => {
					url = url.replace(`{${key}}`, params[key]);
				});
			}

			const response = await axios({
				method: chosenApi.method,
				url: url,
				data: chosenApi.method === "POST" ? params : undefined,
			});

			return JSON.stringify(response.data, null, 4);
		} catch (error) {
			if (error instanceof Error) {
				return JSON.stringify({
					error: `Failed to call API: ${error.message}`,
				});
			} else {
				return JSON.stringify({
					error: "An unexpected error occurred while calling the API",
				});
			}
		}
	},
	{
		name: "call_api",
		description:
			"Call a chosen API from a list of APIs that might provide unique insights for trading decisions",
		schema: z.object({
			apiName: z
				.string()
				.describe("The name of the API to call from the predefined list"),
			params: z
				.record(z.string())
				.optional()
				.describe("Additional parameters for the API call, if needed"),
		}),
	}
);

export const getAvailableApis = () => {
	return apis.map((api: any) => ({
		name: api.name,
		description: api.description,
	}));
};
