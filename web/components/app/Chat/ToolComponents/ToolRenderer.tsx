import { TOOL_COMPONENTS } from "./ToolComponentRegistry";
import { DefaultTool } from "./DefaultTool";
import { ReactNode, useEffect, useState } from "react";

export interface ToolRendererProps {
    toolContent: any;
    contentString: string;
    onAddToGrid?: (component: ReactNode, header?: ReactNode) => void;
}

export function ToolRenderer({ toolContent, contentString, onAddToGrid }: ToolRendererProps) {
    const [testToolContent, setTestToolContent] = useState<any>(null);
    const [testContentString, setTestContentString] = useState<string>("");
    const [addedToGrid, setAddedToGrid] = useState<boolean>(false);

    // Listen for test tool injection events (legacy approach - kept for backward compatibility)
    useEffect(() => {
        const handleTestToolInjection = (event: CustomEvent) => {
            console.log("Tool injection event received:", event.detail);
            const { message } = event.detail;
            if (message && message.content) {
                try {
                    const parsedContent = JSON.parse(message.content);
                    setTestToolContent(parsedContent);
                    setTestContentString(message.content);

                    // Auto-add the component to the grid if onAddToGrid is provided
                    if (onAddToGrid) {
                        // Determine which component to use
                        const ToolComponent = TOOL_COMPONENTS[parsedContent.type];
                        if (ToolComponent) {
                            // Create the component to add to grid
                            const componentToAdd = (
                                <ToolComponent data={parsedContent} contentString={message.content} />
                            );

                            // Add to grid with appropriate header
                            onAddToGrid(
                                componentToAdd,
                                `${
                                    parsedContent.type.charAt(0).toUpperCase() +
                                    parsedContent.type.slice(1).replace(/_/g, " ")
                                }`
                            );
                        } else {
                            // Use DefaultTool if no specific component is found
                            onAddToGrid(
                                <DefaultTool data={parsedContent} contentString={message.content} />,
                                `${
                                    parsedContent.type.charAt(0).toUpperCase() +
                                    parsedContent.type.slice(1).replace(/_/g, " ")
                                }`
                            );
                        }
                    }
                } catch (error) {
                    console.error("Error parsing test tool content:", error);
                }
            }
        };

        document.addEventListener("test-tool-injected", handleTestToolInjection as EventListener);

        return () => {
            document.removeEventListener("test-tool-injected", handleTestToolInjection as EventListener);
        };
    }, [onAddToGrid]);

    // Decide which content to use - test content or props content
    const finalToolContent = testToolContent || toolContent;
    const finalContentString = testContentString || contentString;

    // Auto-add regular (non-test) tools to grid on mount
    useEffect(() => {
        if (onAddToGrid && finalToolContent?.type && !addedToGrid) {
            const ToolComponent = TOOL_COMPONENTS[finalToolContent.type];

            if (ToolComponent) {
                // Create the component to add to grid
                const componentToAdd = <ToolComponent data={finalToolContent} contentString={finalContentString} />;

                // Add to grid with appropriate header
                onAddToGrid(
                    componentToAdd,
                    `${
                        finalToolContent.type.charAt(0).toUpperCase() +
                        finalToolContent.type.slice(1).replace(/_/g, " ")
                    }`
                );
            } else if (finalToolContent) {
                // Use DefaultTool if no specific component is found
                onAddToGrid(
                    <DefaultTool data={finalToolContent} contentString={finalContentString} />,
                    finalToolContent.type
                        ? `${
                              finalToolContent.type.charAt(0).toUpperCase() +
                              finalToolContent.type.slice(1).replace(/_/g, " ")
                          }`
                        : "Tool"
                );
            }

            // Mark as added to grid to prevent multiple additions
            setAddedToGrid(true);
        }
    }, [finalToolContent, finalContentString, onAddToGrid, addedToGrid]);

    // If no toolContent or no type property
    if (!finalToolContent?.type) {
        console.log("No tool type found in content:", finalToolContent);
        return <DefaultTool data={finalToolContent} contentString={finalContentString} onAddToGrid={onAddToGrid} />;
    }

    // Get the correct component for this tool type
    const ToolComponent = TOOL_COMPONENTS[finalToolContent.type];

    // If no matching component is registered
    if (!ToolComponent) {
        console.log(`No component registered for tool type: ${finalToolContent.type}`);
        return <DefaultTool data={finalToolContent} contentString={finalContentString} onAddToGrid={onAddToGrid} />;
    }

    console.log(`Rendering ${finalToolContent.type} component with data:`, finalToolContent);

    // Render the appropriate tool component - this will usually not be visible in the chat
    // as ChatMessage filters out tool messages, but we keep it for completeness
    return <ToolComponent data={finalToolContent} contentString={finalContentString} onAddToGrid={onAddToGrid} />;
}
