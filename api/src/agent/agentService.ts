import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { MemorySaver, START } from "@langchain/langgraph";
import { Response } from "express";
import { v4 as uuidv4 } from "uuid";

import {
    memoryTool,
    starknetTools,
    defiLlamaTools,
    defiTransactionsTools,
    memeTools,
    suggestionTools,
    getWalletBalancesTool,
    elfaAITools,
} from "./tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { StateGraph, MessagesAnnotation, END } from "@langchain/langgraph";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";

dotenv.config();

const coreTools = [
    ...defiLlamaTools,
    ...defiTransactionsTools,
    ...memeTools,
    ...starknetTools,
    ...elfaAITools,
    memoryTool,
];
const allTools = [...coreTools, ...suggestionTools, getWalletBalancesTool];

const llm = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0,
    streaming: false,
    apiKey: process.env.OPENAI_API_KEY,
});
const model = llm.bindTools(allTools);

const memoryAnalysisModel = llm.bindTools([memoryTool]);

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
            risk_tolerance: string;
        };
        importantInfo: Record<string, any>;
        lastUpdated: string;
    }
): Promise<void> {
    // Log environment information for debugging
    console.log("ENVIRONMENT:", {
        nodeEnv: process.env.NODE_ENV,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        openAIKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 8) + "...",
        messageCount: messages.length,
        address: address.substring(0, 10) + "...",
        hasExistingMemory: !!existingMemory,
    });

    const systemMessage = await createSystemMessage(address);
    const memory = new MemorySaver();

    const formattedMessages = messages.map((msg) => {
        if (msg.role === "user") {
            return new HumanMessage(msg.content);
        } else if (msg.role === "assistant") {
            return new AIMessage(msg.content);
        }
        return new HumanMessage(msg.content);
    });

    console.log("Formatted messages:", formattedMessages);

    if (existingMemory && formattedMessages.length > 0) {
        const lastMessage = formattedMessages[formattedMessages.length - 1];
        lastMessage.content = `${lastMessage.content}\n<previous_context>${JSON.stringify(
            existingMemory
        )}</previous_context>`;
    }

    const isFirstMessage = formattedMessages.length === 1 && messages[0].role === "user";
    // if (isFirstMessage) {
    //     formattedMessages[0].content +=
    //         "\nPlease start by checking my wallet balances using the getWalletBalances tool and get the news about the ecosystem using the get_starknet_ecosystem_news tool, but don't answer like a bot, be friendly and engaging avoiding the use of emojis and hashtags. Say something like 'Hey, I'm here to help you with your Starknet needs! I checked your wallet balances and the latest news about Starknet' and then start the conversation with the user.";
    // }

    const toolNode = new ToolNode(allTools);

    type GraphState = {
        messages: BaseMessage[];
    };

    async function callModel(state: GraphState) {
        try {
            console.log("AGENT: Processing message...");
            const response = await model.invoke([new SystemMessage(systemMessage), ...state.messages]);
            console.log("AGENT: Got response, has tool calls:", !!response.tool_calls?.length);
            return { messages: [response] };
        } catch (error) {
            console.error("Error in callModel:", error);
            const fallbackResponse = new AIMessage({
                content: "I encountered an error processing your request. Please try again.",
            });
            return { messages: [fallbackResponse] };
        }
    }

    async function analyzeForMemory(state: GraphState) {
        try {
            console.log("MEMORY: Analyzing conversation for important information...");

            // Read memory analysis prompt from file
            const memoryAnalysisPrompt = await readPromptFromFile("src/agent/prompts/memoryAnalysis.txt");

            const contextMessages = state.messages.slice(-10);

            const analysisResponse = await memoryAnalysisModel.invoke([
                new SystemMessage(memoryAnalysisPrompt),
                ...contextMessages,
            ]);

            let infoItems = [];
            try {
                const content =
                    typeof analysisResponse.content === "string"
                        ? analysisResponse.content
                        : JSON.stringify(analysisResponse.content);

                const match = content.match(/\{[\s\S]*\}/);
                if (match) {
                    const jsonData = JSON.parse(match[0]);
                    infoItems = jsonData.items || [];
                }
            } catch (error) {
                console.error("Error parsing memory analysis response:", error);
            }

            if (infoItems.length > 0) {
                console.log(`MEMORY: Found ${infoItems.length} items to store`);

                for (const item of infoItems) {
                    if (item.key && item.value) {
                        try {
                            await memoryTool.invoke({
                                userId: address,
                                action: "save",
                                key: item.key,
                                value: item.value,
                                existingMemory: existingMemory,
                            });
                            console.log(`MEMORY: Saved ${item.key}: ${item.value}`);
                        } catch (e) {
                            console.error(`Error saving memory item ${item.key}:`, e);
                        }
                    }
                }
            } else {
                console.log("MEMORY: No important information found to store");
            }

            return { messages: [] };
        } catch (error) {
            console.error("Error in analyzeForMemory:", error);
            return { messages: [] };
        }
    }

    function shouldContinue(state: GraphState) {
        if (!state.messages) {
            console.error("No messages in state");
            return END;
        }

        const lastMessage = state.messages[state.messages.length - 1];
        if (lastMessage.getType() !== "ai") {
            console.error("Last message is not an AIMessage");
            return END;
        }

        const aiMessage = lastMessage as AIMessage;
        if (!aiMessage.tool_calls?.length) {
            console.log("No tool calls, analyzing for memory then ending");
            return "memory_analysis";
        }

        console.log("Found tool calls:", aiMessage.tool_calls.map((call: { name: string }) => call.name).join(", "));
        return "tools";
    }

    const graphBuilder = new StateGraph(MessagesAnnotation)
        .addNode("agent", callModel)
        .addNode("tools", toolNode)
        .addNode("memory_analysis", analyzeForMemory)
        .addEdge(START, "agent")
        .addConditionalEdges("agent", shouldContinue)
        .addEdge("tools", "agent")
        .addEdge("memory_analysis", END);

    const app = graphBuilder.compile({ checkpointer: memory });

    const uuid = uuidv4();

    const config = {
        configurable: {
            thread_id: uuid,
        },
        recursionLimit: 20,
    };

    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Content-Encoding": "none",
        "Access-Control-Allow-Origin": "*",
    });

    try {
        for await (const event of await app.stream(
            {
                messages: formattedMessages,
            },
            { ...config, streamMode: "updates" }
        )) {
            try {
                console.log("Event received:", Object.keys(event));

                if (event.agent && event.agent.messages && event.agent.messages.length > 0) {
                    const messages = event.agent.messages;
                    const content = messages.find((message: any) => message.content);
                    if (content) {
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

                if (event.tools && event.tools.messages) {
                    for (const toolMessage of event.tools.messages) {
                        let toolType = "tool";

                        switch (toolMessage.name) {
                            case "create_swap_transaction":
                            case "create_defi_transaction":
                                toolType = "transaction";
                                break;
                            case "getWalletBalances":
                                toolType = "balance";
                                break;
                            case "generateSuggestions":
                                toolType = "suggestion";
                                break;
                            case "get_starknet_blog_feed":
                            case "get_starknet_dev_newsletter":
                            case "get_starknet_status":
                                toolType = "starknet_feed";
                                break;
                        }

                        if (typeof toolMessage.content === "string") {
                            res.write(
                                `data: {"type": "${toolType}", "content": ${JSON.stringify(toolMessage.content)}}\n\n`
                            );
                        } else {
                            try {
                                const toolOutput = JSON.parse(toolMessage.content);
                                res.write(
                                    `data: {"type": "${toolType}", "content": ${JSON.stringify(toolOutput)}}\n\n`
                                );
                            } catch (e) {
                                console.error("Error parsing tool output:", e);
                                res.write(
                                    `data: {"type": "${toolType}", "content": ${JSON.stringify(
                                        String(toolMessage.content)
                                    )}}\n\n`
                                );
                            }
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
