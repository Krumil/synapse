import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { Response } from 'express';
import { brianTools } from "./tools/brianTools";
import { memoryTool } from "./tools/memoryTool";
import { blockchainTools } from "./tools/blockchainTools";
import { defiLlamaTools } from "./tools/defiLlamaTools";
import { defiTransactionsTools } from "./tools/defiTransactionsTools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";

dotenv.config();

const tools = [
	...brianTools,
	...blockchainTools,
	...defiLlamaTools,
	...defiTransactionsTools,
	memoryTool,
];

const llm = new ChatAnthropic({
	clientOptions: {
		defaultHeaders: {
			"X-Api-Key": process.env.ANTHROPIC_API_KEY,
		},
	},
	// modelName: "claude-3-5-sonnet-20240620",
	modelName: "claude-3-5-haiku-20241022",
	temperature: 0,
	streaming: false,
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

export async function chat(message: string, address: string, res: Response): Promise<void> {
	console.log("Processing chat message...");
	const systemMessage = await createSystemMessage(address);
	const memory = new MemorySaver();

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
			messages: [new HumanMessage(message)]
		}, { ...config, streamMode: "updates" })) {
			try {
				if (event.agent && event.agent.messages && event.agent.messages.length > 0) {
					const messages = event.agent.messages;
					const content = messages.find((message: any) => message.content);
					if (content) {
						const messagesContent = content.content;
						if (typeof messagesContent === "string") {
							res.write(`data: {"type": "agent", "content": ${JSON.stringify(messagesContent)}}\n\n`);
						} else if (Array.isArray(messagesContent)) {
							const textMessages = messagesContent.filter((message: any) => message.type === "text");
							const textContent = textMessages.map((message: any) => message.text).join("\n");
							res.write(`data: {"type": "agent", "content": ${JSON.stringify(textContent)}}\n\n`);
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