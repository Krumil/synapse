"use client";
import { RefObject, ReactNode, useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/app/Chat/ChatMessage";
import { ChatInput } from "@/components/app/Chat/ChatInput";
import type { ChatMessage as Message } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { TOOL_COMPONENTS } from "./ToolComponents/ToolComponentRegistry";
import { DefaultTool } from "./ToolComponents/DefaultTool";
import { TextShimmerWave } from "@/components/ui/text-shimmer-wave";

interface ChatComponentProps {
    messages: Message[];
    input: string;
    isLoading: boolean;
    scrollAreaRef: RefObject<any>;
    onInputChange: (value: string) => void;
    onSend: () => void;
    onAddToGrid: (component: ReactNode, header?: ReactNode) => void;
}

// Function to merge sequential agent messages
const mergeSequentialAgentMessages = (messages: Message[]): Message[] => {
    const mergedMessages: Message[] = [];
    let i = 0;

    while (i < messages.length) {
        const currentMessage = messages[i];

        // Check if this is an agent message that can be merged
        if (currentMessage.role === "assistant" && currentMessage.type === "agent") {
            const agentMessages = [currentMessage];
            let j = i + 1;

            // Collect all consecutive agent messages
            while (j < messages.length && messages[j].role === "assistant" && messages[j].type === "agent") {
                agentMessages.push(messages[j]);
                j++;
            }

            // If we have multiple agent messages, merge them
            if (agentMessages.length > 1) {
                const mergedContent = agentMessages.map((msg) => msg.content).join("\n\n");

                mergedMessages.push({
                    ...currentMessage,
                    content: mergedContent,
                });
            } else {
                // Single agent message, add as-is
                mergedMessages.push(currentMessage);
            }

            i = j; // Skip to the next non-agent message
        } else {
            // Non-agent message, add as-is
            mergedMessages.push(currentMessage);
            i++;
        }
    }

    return mergedMessages;
};

export function ChatComponent({
    messages,
    input,
    isLoading,
    scrollAreaRef,
    onInputChange,
    onSend,
    onAddToGrid,
}: ChatComponentProps) {
    const [testMode, setTestMode] = useState(false);

    // Merge sequential agent messages before rendering
    const processedMessages = mergeSequentialAgentMessages(messages);

    useEffect(() => {
        const viewport = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]");
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }, [messages, scrollAreaRef]);

    const injectTestMessage = (messageType: string) => {
        let testData;
        const header = messageType.charAt(0).toUpperCase() + messageType.slice(1).replace(/_/g, " ");

        // Set the appropriate test data based on message type
        switch (messageType) {
            case "wallet_balances":
                testData = {
                    type: "wallet_balances",
                    data: [
                        {
                            name: "Starknet",
                            symbol: "STRK",
                            balance: "5569.674563575216",
                            valueUSD: "965.11",
                        },
                        {
                            name: "Lords",
                            symbol: "LORDS",
                            balance: "7046.195004636139",
                            valueUSD: "199.55",
                        },
                        {
                            name: "Nostra staked STRK",
                            symbol: "nstSTRK",
                            balance: "618.9730976448878",
                            valueUSD: "107.47",
                        },
                    ],
                    details: {
                        walletAddress: "0x0743d856860686c664e876e350a9ee88637174f11885c08cca11ae11d0fad4cd",
                    },
                };
                break;
            case "starknet_feeds":
                testData = {
                    type: "starknet_feeds",
                    starknetBlogFeed: {
                        source: "Starknet Blog",
                        url: "https://www.starknet.io/en/blog",
                        timestamp: new Date().toISOString(),
                        items: [
                            {
                                title: "Test Blog Post 1",
                                link: "https://www.starknet.io/blog/test1",
                                pubDate: new Date().toISOString(),
                                content: "This is a test blog post for development purposes.",
                            },
                            {
                                title: "Test Blog Post 2",
                                link: "https://www.starknet.io/blog/test2",
                                pubDate: new Date().toISOString(),
                                content: "Another test blog post for development purposes.",
                            },
                        ],
                    },
                };
                break;
            case "top_protocols":
                testData = {
                    type: "top_protocols",
                    chain: "Starknet",
                    totalProtocols: 15,
                    filteredProtocols: 3,
                    protocols: [
                        { name: "Jediswap", tvl: "$158.43M", change24h: "+2.7%" },
                        { name: "MySwap", tvl: "$23.8M", change24h: "-0.5%" },
                        { name: "Nostra", tvl: "$19.7M", change24h: "+1.2%" },
                    ],
                };
                break;
            case "x_posts":
                testData = {
                    type: "x_posts",
                    data: [
                        {
                            authorName: "Dorian",
                            authorHandle: "dorian_baffier",
                            authorImage:
                                "https://pbs.twimg.com/profile_images/1854916060807675904/KtBJsyWr_400x400.jpg",
                            content: [
                                "All components from KokonutUI can now be open in @v0 🎉",
                                "1. Click on 'Open in V0'",
                                "2. Customize with prompts",
                                "3. Deploy to your app",
                            ],
                            isVerified: true,
                            timestamp: "Jan 18, 2025",
                            reply: {
                                authorName: "shadcn",
                                authorHandle: "shadcn",
                                authorImage:
                                    "https://pbs.twimg.com/profile_images/1593304942210478080/TUYae5z7_400x400.jpg",
                                content: "Awesome.",
                                isVerified: true,
                                timestamp: "Jan 18",
                            },
                        },
                        {
                            authorName: "serafim",
                            authorHandle: "serafimcloud",
                            authorImage:
                                "https://pbs.twimg.com/profile_images/1763123612905558017/fY93bvRq_400x400.jpg",
                            content: [
                                "I spent 70 days full-time curating the ultimate library of @shadcn/ui-like components.",
                                "And today, I'm launching it publicly.",
                                "Here's what it is:",
                                "• 730+ production-ready components from 50+ top design engineers",
                                "• Each component is yours to own - just like shadcn/ui",
                                "• Install everything with shadcn CLI: code, dependencies, hooks, global css and tailwind config extensions",
                                "It's also optimized for AI code editors like @lovable_dev, @stackblitz's bolt. new, and @vercel's @v0, with tailored prompts for effortless integration.",
                                "👉 http://21st.dev is live now. Build faster, own your code, and never struggle with UI setup again.",
                            ],
                            isVerified: true,
                            timestamp: "Apr 6",
                            reply: {
                                authorName: "shadcn",
                                authorHandle: "shadcn",
                                authorImage:
                                    "https://pbs.twimg.com/profile_images/1593304942210478080/TUYae5z7_400x400.jpg",
                                content: "Great work. CLI support is a nice touch.",
                                isVerified: true,
                                timestamp: "Jan 9",
                            },
                        },
                    ],
                };
                break;
            default:
                return;
        }

        const contentString = JSON.stringify(testData);
        const ToolComponent = TOOL_COMPONENTS[messageType];

        if (ToolComponent && onAddToGrid) {
            onAddToGrid(<ToolComponent data={testData} contentString={contentString} />, header);
        } else if (onAddToGrid) {
            onAddToGrid(<DefaultTool data={testData} contentString={contentString} />, header);
        }
    };

    return (
        <div className="relative z-20 h-full flex flex-col">
            <ScrollArea className="h-full" ref={scrollAreaRef}>
                <div className="flex flex-col gap-4 px-3 py-2 pb-16 min-h-[200px]">
                    {processedMessages.map((message, index) => (
                        <ChatMessage key={index} {...message} onAddToGrid={onAddToGrid} />
                    ))}
                    <div className="flex justify-center py-4 pl-4">
                        {isLoading && (
                            <TextShimmerWave className="font-mono text-sm" duration={1}>
                                Thinking...
                            </TextShimmerWave>
                        )}
                    </div>
                </div>
                <div className="fixed inset-x-0 bottom-2 px-4 pb-2">
                    <div
                        className="non-draggable w-full"
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                    >
                        {testMode && (
                            <div className="flex gap-2 mb-2 justify-center">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => injectTestMessage("wallet_balances")}
                                >
                                    Test Wallet Balances
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => injectTestMessage("starknet_feeds")}>
                                    Test Starknet Feed
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => injectTestMessage("top_protocols")}>
                                    Test Top Protocols
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => injectTestMessage("x_posts")}>
                                    Test X Posts
                                </Button>
                            </div>
                        )}
                        {/* <div className="flex gap-2 items-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setTestMode(!testMode)}
                                className="ml-auto mb-2"
                            >
                                {testMode ? "Hide Test Tools" : "Show Test Tools"}
                            </Button>
                        </div> */}
                        <ChatInput input={input} isLoading={isLoading} onInputChange={onInputChange} onSend={onSend} />
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
