"use client";
import { useRef, useEffect, useState, useCallback, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ChatComponent } from "@/components/app/Chat/ChatComponent";
import { ChatHeader } from "@/components/app/Chat/ChatHeader";
import { useChat } from "@/hooks/use-chat";
import { useGrid } from "@/components/app/GridLayout";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { getToolConfig } from "@/components/app/Chat/ToolComponents/ToolComponentRegistry";
import { DefaultTool } from "@/components/app/Chat/ToolComponents/DefaultTool";
import type {} from "ldrs";
import "ldrs/mirage";

export function AppContainer() {
    const scrollAreaRef = useRef<any>(null);
    const { addGridItem, addChatComponent, addToolToGrid } = useGrid();

    const handleToolReceived = useCallback(
        (toolData: any) => {
            if (!toolData || !toolData.type) return;

            try {
                const data = typeof toolData.content === "string" ? JSON.parse(toolData.content) : toolData.data;
                const header = `${toolData.type.charAt(0).toUpperCase() + toolData.type.slice(1).replace(/_/g, " ")}`;

                try {
                    // Try to get tool configuration with dimensions
                    const toolConfig = getToolConfig(toolData.type);
                    const componentToAdd = <toolConfig.component data={data} contentString={toolData.content} />;

                    // Use the new addToolToGrid method with tool-specific dimensions
                    addToolToGrid(componentToAdd, header, toolData.type);
                } catch (configError) {
                    // Fallback to default tool and basic grid addition
                    console.warn(`No tool configuration found for ${toolData.type}, using default:`, configError);
                    addGridItem(<DefaultTool data={data} contentString={toolData.content} />, header);
                }
            } catch (error) {
                console.error("Error processing tool for grid:", error);
            }
        },
        [addGridItem, addToolToGrid]
    );

    const { messages, input, isLoading, setInput, handleSend } = useChat({
        onToolReceived: handleToolReceived,
    });

    const [showDisclaimer, setShowDisclaimer] = useState(true);

    const addComponentToGrid = useCallback(
        (component: ReactNode, header?: ReactNode) => {
            if (addGridItem) addGridItem(component, header);
        },
        [addGridItem]
    );

    useEffect(() => {
        const hasSeenSynapseDisclaimer = localStorage.getItem("hasSeenSynapseDisclaimer");
        if (hasSeenSynapseDisclaimer) {
            setShowDisclaimer(false);
        }
    }, []);

    const handleDisclaimerClose = () => {
        localStorage.setItem("hasSeenSynapseDisclaimer", "true");
        setShowDisclaimer(false);
    };

    useEffect(() => {
        const viewport = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]");
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }, [messages]);

    const handleInputChange = useCallback(
        (value: string) => {
            setInput(value);
        },
        [setInput]
    );

    const handleMessageSend = useCallback(() => {
        handleSend();
    }, [handleSend]);

    useEffect(() => {
        if (!addChatComponent) return;

        const chat = (
            <ChatComponent
                messages={messages}
                input={input}
                isLoading={isLoading}
                scrollAreaRef={scrollAreaRef}
                onInputChange={handleInputChange}
                onSend={handleMessageSend}
                onAddToGrid={addComponentToGrid}
            />
        );

        addChatComponent(chat, <ChatHeader />);
    }, [addChatComponent, messages, input, isLoading]);

    return (
        <Dialog
            open={showDisclaimer}
            onOpenChange={(open) => {
                if (!open && !localStorage.getItem("hasSeenSynapseDisclaimer")) {
                    setShowDisclaimer(true);
                }
            }}
        >
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Important Disclaimer</DialogTitle>
                    <DialogDescription className="space-y-4">
                        <p>
                            Welcome! Please note that this application is an experimental project developed for a
                            hackathon and is currently in beta.
                        </p>
                        <p>
                            Any financial information or suggestions provided by this application should not be
                            considered as financial advice. This tool is for educational and experimental purposes only.
                        </p>
                        <p>
                            Please consult with qualified financial professionals before making any investment or
                            financial decisions.
                        </p>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button onClick={handleDisclaimerClose}>I Understand</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
