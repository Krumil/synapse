import dotenv from "dotenv";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import axios from "axios";

dotenv.config();

const BRIAN_API_URL = "https://api.brianknows.org/api/v0/agent";

// Store conversation history with a composite key of userId_address
const conversationHistory: Map<string, Array<{ sender: string; content: string }>> = new Map();

const brianAgentSchema = z.object({
	prompt: z.string().describe("The prompt to send to Brian AI"),
	address: z.string().describe("Address that will send the transactions"),
	userId: z.string().describe("User's wallet address"),
});

export const brianAgentTool = tool(
	async ({ prompt, address, userId }) => {
		console.log('brianAgentTool', prompt, address, userId);
		try {
			const conversationKey = `${userId}_${address}`;
			// Get or initialize conversation history for this user-address combination
			let messages = conversationHistory.get(conversationKey) || [];

			// Sanitize existing messages to ensure content is always a string
			messages = messages.map(msg => ({
				sender: msg.sender,
				content: typeof msg.content === 'object' ? JSON.stringify(msg.content) : String(msg.content)
			}));

			const { data } = await axios.post(
				BRIAN_API_URL,
				{
					prompt,
					address,
					messages
				},
				{
					headers: {
						'X-Brian-Api-Key': process.env.BRIAN_API_KEY || '',
						'Content-Type': 'application/json'
					}
				}
			);

			const result = data.result[0];

			// Ensure content is a string when updating conversation history
			messages = [
				...messages,
				{ sender: "user", content: prompt },
				{
					sender: "brian",
					content: String(result.data?.description || result.answer || "No response content available")
				}
			];
			conversationHistory.set(conversationKey, messages);

			// If it's a transaction
			if (result.type === "write") {
				return JSON.stringify({
					type: "transaction",
					message: result.data.description,
					transactions: result.data.steps,
					details: result,
					conversationHistory: messages
				});
			}

			// If it's a knowledge query
			return JSON.stringify({
				type: "knowledge",
				answer: result.answer || result.data.description,
				details: result,
				conversationHistory: messages
			});

		} catch (error: any) {
			console.error("Error in brianAgent:", error);

			// Handle Axios errors
			if (axios.isAxiosError(error)) {
				const errorMessage = error.response?.data?.error || error.message;
				const extractedParams = error.response?.data?.extractedParams;

				// Update conversation history with the error
				const conversationKey = `${userId}_${address}`;
				let messages = conversationHistory.get(conversationKey) || [];
				messages = [
					...messages,
					{ sender: "user", content: prompt },
					{ sender: "brian", content: String(errorMessage) }
				];
				conversationHistory.set(conversationKey, messages);

				return JSON.stringify({
					type: "error",
					message: errorMessage,
					extractedParams,
					conversationHistory: messages
				});
			}

			// Handle other errors
			return JSON.stringify({
				type: "error",
				message: error.message,
				conversationHistory: conversationHistory.get(`${userId}_${address}`) || []
			});
		}
	},
	{
		name: "BrianAgent",
		description: "Interact with Brian AI to get generic information about crypto or generate swap transactions. Don't use this for defi actions like staking and unstaking.",
		schema: brianAgentSchema,
	}
);

export const brianTools = [brianAgentTool];