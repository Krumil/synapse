"use client";
import { RefObject, ReactNode, useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/app/Chat/ChatMessage";
import { ChatInput } from "@/components/app/Chat/ChatInput";
import type { ChatMessage as Message } from "@/types/chat";
import type {} from "ldrs";
import { Button } from "@/components/ui/button";
import { TOOL_COMPONENTS } from "./ToolComponents/ToolComponentRegistry";
import { DefaultTool } from "./ToolComponents/DefaultTool";

interface ChatComponentProps {
    messages: Message[];
    input: string;
    isLoading: boolean;
    scrollAreaRef: RefObject<any>;
    onInputChange: (value: string) => void;
    onSend: () => void;
    onAddToGrid: (component: ReactNode, header?: ReactNode) => void;
}

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
            default:
                return;
        }

        console.log("Test data created:", messageType, testData);

        // Convert the data to a JSON string
        const contentString = JSON.stringify(testData);

        // Get the appropriate component
        const ToolComponent = TOOL_COMPONENTS[messageType];

        if (ToolComponent && onAddToGrid) {
            // Create and add the component to the grid
            onAddToGrid(<ToolComponent data={testData} contentString={contentString} />, header);
        } else if (onAddToGrid) {
            // Use DefaultTool if no component is registered
            onAddToGrid(<DefaultTool data={testData} contentString={contentString} />, header);
        }
    };

    return (
        <div className="relative z-20 h-full flex flex-col">
            <ScrollArea className="h-full" ref={scrollAreaRef}>
                <div className="flex flex-col gap-4 px-3 py-2 pb-16 min-h-[200px]">
                    {messages.map((message, index) => (
                        <ChatMessage key={index} {...message} onAddToGrid={onAddToGrid} />
                    ))}
                    <div className="flex justify-center py-4">
                        {isLoading && (
                            <div
                                className="animate-in fade-in duration-500"
                                style={{ animationTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
                            >
                                <l-mirage size="105" speed="2.5" color="currentColor"></l-mirage>
                            </div>
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
                            </div>
                        )}
                        <div className="flex gap-2 items-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setTestMode(!testMode)}
                                className="ml-auto mb-2"
                            >
                                {testMode ? "Hide Test Tools" : "Show Test Tools"}
                            </Button>
                        </div>
                        <ChatInput input={input} isLoading={isLoading} onInputChange={onInputChange} onSend={onSend} />
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
