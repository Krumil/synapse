import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { Response } from 'express';
import { brianTools } from "./tools/brianTools";
import { memoryTool } from "./tools/memoryTool";
import { starknetTools } from "./tools/starknetTools";
import { defiLlamaTools } from "./tools/defiLlamaTools";
import { defiTransactionsTools } from "./tools/defiTransactionsTools";
import { memeTools } from "./tools/unruggable";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";

dotenv.config();

const tools = [
	...brianTools,
	...defiLlamaTools,
	...defiTransactionsTools,
	...starknetTools,
	...memeTools,
	memoryTool,
];

// const llm = new ChatAnthropic({
// 	clientOptions: {
// 		defaultHeaders: {
// 			"X-Api-Key": process.env.ANTHROPIC_API_KEY,
// 		},
// 	},
// 	// modelName: "claude-3-5-sonnet-20240620",
// 	modelName: "claude-3-5-haiku-20241022",
// 	temperature: 0,
// 	streaming: false,
// });

const llm = new ChatOpenAI({
	modelName: "gpt-4o-2024-11-20",
	temperature: 0,
	streaming: false,
	apiKey: process.env.OPENAI_API_KEY,
});

async function readPromptFromFile(filename: string): Promise<string> {
	const filePath = path.join(process.cwd(), filename);
	try {
		return await fs.readFile(filePath, "utf-8");
	} catch (error) {
		console.error(`Error reading prompt file: ${error}`);
		throw error;
	}
}

async function createSystemMessage(address: string): Promise<string> {
	let prompt = await readPromptFromFile("src/agent/prompts/system.txt");
	const today = new Date();
	prompt = prompt.replace("{{today}}", today.toISOString());
	prompt = prompt.replace("{{address}}", address);

	return prompt;
}

export async function chat(
	messages: { role: string; content: string }[],
	address: string,
	res: Response,
	existingMemory?: {
		preferences: {
			risk_tolerance: string
		},
		importantInfo: Record<string, any>,
		lastUpdated: string
	}
): Promise<void> {
	console.log("Processing chat messages...");
	const systemMessage = await createSystemMessage(address);
	const memory = new MemorySaver();

	// Convert the message history to LangChain format
	const formattedMessages = messages.map(msg => {
		if (msg.role === 'user') {
			return new HumanMessage(msg.content);
		} else if (msg.role === 'assistant') {
			return new AIMessage(msg.content);
		}
		return new HumanMessage(msg.content);
	});

	// Add memory context to the last message if it exists
	if (existingMemory && formattedMessages.length > 0) {
		const lastMessage = formattedMessages[formattedMessages.length - 1];
		lastMessage.content = `${lastMessage.content}\n<previous_context>${JSON.stringify(existingMemory)}</previous_context>`;
	}

	const app = createReactAgent({
		llm,
		tools,
		messageModifier: systemMessage,
		checkpointSaver: memory,
	});

	const config = {
		configurable: {
			thread_id: "chat-thread",
		},
		recursionLimit: 10,
	};

	res.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive',
		'Content-Encoding': 'none',
		'Access-Control-Allow-Origin': '*'
	});

	try {
		for await (const event of await app.stream({
			messages: formattedMessages
		}, { ...config, streamMode: "updates" })) {
			try {
				if (event.agent && event.agent.messages && event.agent.messages.length > 0) {
					const messages = event.agent.messages;
					const content = messages.find((message: any) => message.content);
					if (content) {
						const stop_reason = content.additional_kwargs?.stop_reason;
						// const type = stop_reason === "end_turn" ? "agent" : "agent_reasoning";
						const type = "agent";
						const messagesContent = content.content;
						if (typeof messagesContent === "string") {
							res.write(`data: {"type": "${type}", "content": ${JSON.stringify(messagesContent)}}\n\n`);
						} else if (Array.isArray(messagesContent)) {
							const textMessages = messagesContent.filter((message: any) => message.type === "text");
							const textContent = textMessages.map((message: any) => message.text).join("\n");
							res.write(`data: {"type": "${type}", "content": ${JSON.stringify(textContent)}}\n\n`);
						}
					}
				}
				if (event.tools) {
					for (const toolMessage of event.tools.messages) {
						if (typeof toolMessage.content === "string") {
							res.write(`data: {"type": "tool", "content": ${JSON.stringify(toolMessage.content)}}\n\n`);
						} else {
							const toolOutput = JSON.parse(toolMessage.content);
							res.write(`data: {"type": "tool", "content": ${JSON.stringify(toolOutput)}}\n\n`);
						}
					}
				}
			} catch (error) {
				console.error("Error processing chat message:", error);
			}
		}
		res.end();
	} catch (error) {
		console.error("Error in chat execution:", error);
		res.write(`data: ${JSON.stringify({ error: "An error occurred" })}\n\n`);
		res.end();
	}
}