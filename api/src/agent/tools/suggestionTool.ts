import { tool } from "@langchain/core/tools";
import { z } from "zod";
import OpenAI from "openai";

const suggestionToolSchema = z.object({
	aiMessage: z.string().describe("The AI's last message to analyze"),
	context: z.record(z.any()).optional().describe("Additional context about the conversation"),
	maxSuggestions: z.number().optional().default(3).describe("Maximum number of suggestions to generate")
});

interface Suggestion {
	text: string;
	type: 'question' | 'response' | 'clarification';
	confidence: number;
}

const openai = new OpenAI();

async function generateSuggestions(aiMessage: string, maxSuggestions: number): Promise<Suggestion[]> {
	try {
		const completion = await openai.chat.completions.create({
			model: "gpt-4o",
			response_format: { type: "json_object" },
			messages: [
				{
					role: "system",
					content: `You are a helpful assistant that generates user response suggestions.
Generate ${maxSuggestions} potential user responses based on the AI's last message.
Each response should be either a question, response, or clarification.
Responses should be natural and contextual.`
				},
				{
					role: "user",
					content: `Generate suggestions for responding to this AI message: "${aiMessage}"`
				}
			],
			functions: [
				{
					name: "generate_suggestions",
					parameters: {
						type: "object",
						properties: {
							suggestions: {
								type: "array",
								items: {
									type: "object",
									properties: {
										text: { type: "string" },
										type: {
											type: "string",
											enum: ["question", "response", "clarification"]
										},
										confidence: {
											type: "number",
											minimum: 0,
											maximum: 1
										}
									},
									required: ["text", "type", "confidence"]
								}
							}
						},
						required: ["suggestions"]
					}
				}
			],
			function_call: { name: "generate_suggestions" }
		});

		const responseContent = completion.choices[0].message.function_call?.arguments;
		if (!responseContent) {
			throw new Error("No suggestions generated");
		}

		const { suggestions } = JSON.parse(responseContent);
		return suggestions.slice(0, maxSuggestions);
	} catch (error) {
		console.error("Error generating suggestions:", error);
		// Fallback suggestions in case of error
		return [
			{
				text: "Could you explain that further?",
				type: "clarification" as const,
				confidence: 0.7
			},
			{
				text: "That sounds interesting, tell me more.",
				type: "response" as const,
				confidence: 0.6
			}
		].slice(0, maxSuggestions);
	}
}

export const suggestionTool = tool(
	async ({ aiMessage, context, maxSuggestions = 3 }) => {
		try {
			const suggestions = await generateSuggestions(aiMessage, maxSuggestions);

			return JSON.stringify({
				type: "suggestions",
				status: "success",
				suggestions,
				message: `Generated ${suggestions.length} suggestions`
			});

		} catch (error: any) {
			console.error("Error in suggestionTool:", error);
			return JSON.stringify({
				type: "error",
				message: error.message,
				suggestions: []
			});
		}
	},
	{
		name: "SuggestionTool",
		description: "Generate suggested user responses based on AI messages",
		schema: suggestionToolSchema,
	}
);

export const suggestionTools = [suggestionTool];