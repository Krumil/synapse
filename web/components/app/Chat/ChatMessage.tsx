"use client";
import { motion } from "framer-motion";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { ChatMessage as ChatMessageType } from "@/types/chat";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { useState, memo, ReactNode } from "react";

type ButtonOption = {
    label: string;
    value: string;
    action?: () => void;
    disabled?: boolean;
};

interface ChatMessageProps extends ChatMessageType {
    onOptionClick?: (value: string) => void;
    onAddToGrid?: (component: ReactNode, header?: ReactNode) => void;
}

export const ChatMessage = memo(function ChatMessage({ content, role, type, onOptionClick }: ChatMessageProps) {
    const [showButtons, setShowButtons] = useState(false);

    // Enhance the helper function to extract more button metadata
    const extractButtonOptions = (text: string): ButtonOption[] => {
        const matches = text.match(/{{(.*?)}}/g);
        if (!matches) return [];

        return matches.map((match) => {
            const content = match.replace(/{{|}}/g, "").trim();
            return {
                label: content,
                value: content.toLowerCase(),
                disabled: false,
            };
        });
    };

    // Add this helper function to clean the message text
    const cleanMessage = (text: string) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, "$1")
            .replace(/{{(.*?)}}/g, "")
            .trim();
    };

    // Don't render tool messages in the chat at all - they'll be shown in the grid
    if (role === "assistant" && type !== "agent_reasoning" && type !== "agent") {
        return null;
    }

    if (!content) return null;

    return (
        <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`rounded-lg relative ${type === "agent_reasoning" ? "px-3 py-1" : "p-3"} ${
                    role === "user"
                        ? "bg-gray-900/80 dark:bg-gray-100/80 backdrop-blur-sm text-white dark:text-black ml-10"
                        : "bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm text-black dark:text-white mr-10"
                }`}
            >
                <div className="flex flex-col gap-2">
                    {role === "user" && <div className="whitespace-pre-line">{content}</div>}

                    {role === "assistant" && type === "agent" && (
                        <>
                            <TextGenerateEffect
                                words={cleanMessage(content)}
                                className="whitespace-pre-line"
                                onComplete={() => setShowButtons(true)}
                            />
                            {extractButtonOptions(content).length > 0 && (
                                <motion.div
                                    className="flex flex-wrap gap-2 mt-2 justify-end"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={showButtons ? { opacity: 1, y: 0 } : {}}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                >
                                    {extractButtonOptions(content).map((option, index) => (
                                        <HoverBorderGradient
                                            key={index}
                                            containerClassName="rounded-full"
                                            as="button"
                                            className="bg-white text-black flex items-center text-xs border-black border-[1px]"
                                            onClick={() => onOptionClick?.(option.value)}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onTouchStart={(e) => e.stopPropagation()}
                                        >
                                            {option.label.toUpperCase()}
                                        </HoverBorderGradient>
                                    ))}
                                </motion.div>
                            )}
                        </>
                    )}

                    {role === "assistant" && type === "agent_reasoning" && (
                        <Collapsible className="w-full">
                            <CollapsibleTrigger asChild>
                                <Button
                                    className="flex items-center w-full justify-start gap-2 text-muted-foreground hover:text-primary transition-colors"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                    </svg>
                                    View Agent Reasoning
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <div className="text-sm text-muted-foreground bg-secondary/30 backdrop-blur-sm px-3 pb-2 rounded-lg border border-secondary/50">
                                    {content}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    )}
                </div>
            </motion.div>
        </div>
    );
});
