import { useState, useEffect, useRef } from "react";
import { useAccount } from "@starknet-react/core";
import type { ChatMessage, ToolResponse, Memory } from "@/types/chat";
import { useTransaction } from "@/hooks/use-transaction";
import { TOOL_COMPONENTS } from "@/components/app/Chat/ToolComponents/ToolComponentRegistry";

export function useChat({ onToolReceived }: { onToolReceived?: (toolData: any) => void } = {}) {
    const [hasInitiatedConversation, setHasInitiatedConversation] = useState(false);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const accountData = useAccount();
    const address = accountData?.address;
    const { handleTransaction, transactionStatus } = useTransaction();
    const [memory, setMemory] = useState<Memory>(() => {
        if (typeof window !== "undefined") {
            const savedMemory = localStorage.getItem("chatMemory");
            return savedMemory ? JSON.parse(savedMemory) : {};
        }
        return {};
    });

    const transactionStatusRef = useRef(transactionStatus);

    useEffect(() => {
        transactionStatusRef.current = transactionStatus;
    }, [transactionStatus]);

    useEffect(() => {
        if (typeof window !== "undefined" && Object.keys(memory).length > 0) {
            localStorage.setItem("chatMemory", JSON.stringify(memory));
        }
    }, [memory]);

    useEffect(() => {
        if (address && !hasInitiatedConversation) {
            handleInitialConversation();
        }
    }, [address]);

    // const waitForTransactionStatus = (): Promise<void> => {
    //     return new Promise((resolve) => {
    //         const checkStatus = () => {
    //             const currentStatus = transactionStatusRef.current;
    //             if (currentStatus === "success" || currentStatus === "error") {
    //                 resolve();
    //             } else {
    //                 setTimeout(checkStatus, 100);
    //             }
    //         };
    //         checkStatus();
    //     });
    // };

    const handleToolResponse = async (toolResponse: ToolResponse) => {
        console.log("toolResponse", toolResponse);
        if (toolResponse.type === "transaction") {
            if (onToolReceived) {
                const toolData = {
                    type: toolResponse.type,
                    data: toolResponse,
                    content: JSON.stringify(toolResponse),
                };

                onToolReceived(toolData);
            }
        } else if (toolResponse.type === "memory_update" && toolResponse.memory) {
            setMemory(toolResponse.memory);
        } else if (toolResponse.type in TOOL_COMPONENTS) {
            // Handle all registered tool components dynamically
            if (onToolReceived) {
                const toolData = {
                    type: toolResponse.type,
                    data: toolResponse,
                    content: JSON.stringify(toolResponse),
                };

                // Call the callback with the tool data
                onToolReceived(toolData);
            }
        }
    };

    const handleDeleteMessage = (index: number) => {
        setMessages((prev: ChatMessage[]) => prev.filter((_: ChatMessage, i: number) => i !== index));
    };

    const processStreamMessage = async (data: any) => {
        try {
            switch (data.type) {
                case "tool": {
                    let toolResponse: ToolResponse;
                    try {
                        toolResponse = JSON.parse(data.content);
                        if (!toolResponse || typeof toolResponse !== "object") {
                            console.warn("Invalid tool response format");
                            return;
                        }
                        await handleToolResponse(toolResponse);
                    } catch (error) {
                        console.error("Error processing tool response:", error);
                        return;
                    }
                    break;
                }
                case "transaction": {
                    // Handle transaction messages directly
                    let toolResponse: ToolResponse;
                    try {
                        toolResponse = JSON.parse(data.content);
                        if (!toolResponse || typeof toolResponse !== "object") {
                            console.warn("Invalid transaction response format");
                            return;
                        }
                        await handleToolResponse(toolResponse);
                    } catch (error) {
                        console.error("Error processing transaction response:", error);
                        return;
                    }
                    break;
                }
                case "agent_reasoning": {
                    setMessages((prev) => {
                        const lastMessage = prev[prev.length - 1];
                        if (lastMessage?.role === "assistant" && lastMessage?.type === "agent_reasoning") {
                            const updatedMessages = [...prev];
                            updatedMessages[prev.length - 1] = {
                                ...lastMessage,
                                content: lastMessage.content + "\n" + data.content,
                            };
                            return updatedMessages;
                        }
                        return [
                            ...prev,
                            {
                                content: data.content,
                                role: "assistant",
                                type: data.type,
                            },
                        ];
                    });
                    break;
                }
                case "agent": {
                    setMessages((prev) => {
                        return [
                            ...prev,
                            {
                                content: data.content,
                                role: "assistant",
                                type: data.type,
                            },
                        ];
                    });
                    break;
                }
                default: {
                    setMessages((prev) => {
                        return [
                            ...prev,
                            {
                                content: data.content,
                                role: "assistant",
                                type: data.type,
                            },
                        ];
                    });
                    break;
                }
            }
        } catch (error) {
            throw error;
        }
    };

    const handleInitialConversation = async () => {
        setIsLoading(true);

        try {
            if (!address) {
                setMessages((prev) => [
                    ...prev,
                    {
                        content: "Hello there! Please connect your wallet to start the conversation.",
                        role: "assistant",
                        type: "agent",
                    },
                ]);
            } else {
                const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        messages: [{ role: "user", content: "START_CONVERSATION" }],
                        address,
                        userId: address,
                        existingMemory: memory,
                    }),
                });

                if (!response.body) throw new Error("No response body");

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = ""; // Buffer for incomplete lines

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    buffer += chunk;

                    // Split by newlines and process complete lines
                    const lines = buffer.split("\n");
                    // Keep the last line in buffer (might be incomplete)
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                await processStreamMessage(data);
                            } catch (error) {
                                console.error("Error parsing SSE message:", error);
                                setMessages((prev) => [
                                    ...prev,
                                    {
                                        role: "assistant",
                                        content: "Sorry, there was an error processing the response.",
                                        type: "agent",
                                    },
                                ]);
                            }
                        }
                    }
                }

                // Process any remaining data in buffer
                if (buffer.startsWith("data: ")) {
                    try {
                        const data = JSON.parse(buffer.slice(6));
                        await processStreamMessage(data);
                    } catch (error) {
                        console.error("Error parsing final SSE message:", error);
                    }
                }

                setHasInitiatedConversation(true);
            }
        } catch (error) {
            console.error("Error initiating conversation:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        if (!address) {
            setMessages((prev) => [
                ...prev,
                {
                    content: "Please connect your wallet first",
                    role: "assistant",
                    type: "agent",
                },
            ]);
            setTimeout(() => {
                setMessages((prev) => prev.slice(0, -1));
            }, 3000);
            return;
        }

        const userMessage = input.trim();
        setInput("");
        setIsLoading(true);

        setMessages((prev) => [
            ...prev,
            {
                role: "user",
                content: userMessage,
            },
        ]);

        try {
            const savedMemory = localStorage.getItem("chatMemory");
            const existingMemory = savedMemory ? JSON.parse(savedMemory) : {};
            const filteredMessages = messages.filter(
                (msg) => msg.role === "user" || (msg.role === "assistant" && msg.type === "agent")
            );

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: userMessage,
                    messages: [...filteredMessages, { role: "user", content: userMessage }],
                    address,
                    userId: address,
                    existingMemory,
                }),
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = ""; // Buffer for incomplete lines

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                buffer += chunk;

                // Split by newlines and process complete lines
                const lines = buffer.split("\n");
                // Keep the last line in buffer (might be incomplete)
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            await processStreamMessage(data);
                        } catch (error) {
                            console.error("Error parsing SSE message:", error);
                            setMessages((prev) => [
                                ...prev,
                                {
                                    role: "assistant",
                                    content: "Sorry, there was an error processing the response.",
                                    type: "agent",
                                },
                            ]);
                        }
                    }
                }
            }

            // Process any remaining data in buffer
            if (buffer.startsWith("data: ")) {
                try {
                    const data = JSON.parse(buffer.slice(6));
                    await processStreamMessage(data);
                } catch (error) {
                    console.error("Error parsing final SSE message:", error);
                }
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Sorry, there was an error processing your message.",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        messages,
        input,
        isLoading,
        setInput,
        handleSend,
        handleDeleteMessage,
        memory,
    };
}
