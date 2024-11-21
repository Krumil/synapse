"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chat = chat;
const anthropic_1 = require("@langchain/anthropic");
const messages_1 = require("@langchain/core/messages");
const langgraph_1 = require("@langchain/langgraph");
const brianTools_1 = require("./tools/brianTools");
const memoryTool_1 = require("./tools/memoryTool");
const starknetTools_1 = require("./tools/starknetTools");
const defiLlamaTools_1 = require("./tools/defiLlamaTools");
const defiTransactionsTools_1 = require("./tools/defiTransactionsTools");
const prebuilt_1 = require("@langchain/langgraph/prebuilt");
const dotenv_1 = __importDefault(require("dotenv"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const tools = [
    ...brianTools_1.brianTools,
    ...defiLlamaTools_1.defiLlamaTools,
    ...defiTransactionsTools_1.defiTransactionsTools,
    ...starknetTools_1.starknetTools,
    memoryTool_1.memoryTool,
];
const llm = new anthropic_1.ChatAnthropic({
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
async function readPromptFromFile(filename) {
    const filePath = path_1.default.join(process.cwd(), filename);
    try {
        return await promises_1.default.readFile(filePath, "utf-8");
    }
    catch (error) {
        console.error(`Error reading prompt file: ${error}`);
        throw error;
    }
}
async function createSystemMessage(address) {
    let prompt = await readPromptFromFile("src/agent/prompts/system.txt");
    const today = new Date();
    prompt = prompt.replace("{{today}}", today.toISOString());
    prompt = prompt.replace("{{address}}", address);
    return prompt;
}
async function chat(messages, address, res, existingMemory) {
    console.log("Processing chat messages...");
    const systemMessage = await createSystemMessage(address);
    const memory = new langgraph_1.MemorySaver();
    // Convert the message history to LangChain format
    const formattedMessages = messages.map(msg => {
        if (msg.role === 'user') {
            return new messages_1.HumanMessage(msg.content);
        }
        else if (msg.role === 'assistant') {
            return new messages_1.AIMessage(msg.content);
        }
        return new messages_1.HumanMessage(msg.content);
    });
    // Add memory context to the last message if it exists
    if (existingMemory && formattedMessages.length > 0) {
        const lastMessage = formattedMessages[formattedMessages.length - 1];
        lastMessage.content = `${lastMessage.content}\n<previous_context>${JSON.stringify(existingMemory)}</previous_context>`;
    }
    const app = (0, prebuilt_1.createReactAgent)({
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
                    const content = messages.find((message) => message.content);
                    if (content) {
                        const stop_reason = content.additional_kwargs?.stop_reason;
                        const type = stop_reason === "end_turn" ? "agent" : "agent_reasoning";
                        const messagesContent = content.content;
                        if (typeof messagesContent === "string") {
                            res.write(`data: {"type": "${type}", "content": ${JSON.stringify(messagesContent)}}\n\n`);
                        }
                        else if (Array.isArray(messagesContent)) {
                            const textMessages = messagesContent.filter((message) => message.type === "text");
                            const textContent = textMessages.map((message) => message.text).join("\n");
                            res.write(`data: {"type": "${type}", "content": ${JSON.stringify(textContent)}}\n\n`);
                        }
                    }
                }
                if (event.tools) {
                    for (const toolMessage of event.tools.messages) {
                        if (typeof toolMessage.content === "string") {
                            res.write(`data: {"type": "tool", "content": ${JSON.stringify(toolMessage.content)}}\n\n`);
                        }
                        else {
                            const toolOutput = JSON.parse(toolMessage.content);
                            res.write(`data: {"type": "tool", "content": ${JSON.stringify(toolOutput)}}\n\n`);
                        }
                    }
                }
            }
            catch (error) {
                console.error("Error processing chat message:", error);
            }
        }
        res.end();
    }
    catch (error) {
        console.error("Error in chat execution:", error);
        res.write(`data: ${JSON.stringify({ error: "An error occurred" })}\n\n`);
        res.end();
    }
}
