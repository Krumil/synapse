"use client";

import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";

interface ToolCardProps {
    children: ReactNode;
    className?: string;
    size?: "sm" | "md" | "lg";
    withBorder?: boolean;
    onRemove?: () => void;
    /**
     * Provide custom render function for the close control. If omitted, a default small "X" button is rendered.
     * It receives the onRemove callback that should be invoked when the user triggers close.
     */
    renderClose?: (onRemove: () => void) => ReactNode;
}

export function ToolCard({
    children,
    className,
    size = "md",
    withBorder = true,
    onRemove,
    renderClose,
}: ToolCardProps) {
    const sizeClasses = {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
    };

    return (
        <div
            className={cn(
                "relative rounded-3xl",
                sizeClasses[size],
                "bg-card",
                withBorder && "border border-border",
                "shadow-sm",
                className
            )}
        >
            {onRemove &&
                (renderClose ? (
                    // Use the custom renderer when provided
                    renderClose(onRemove)
                ) : (
                    // Fallback: small icon button in the top-right corner
                    <button
                        onClick={onRemove}
                        className="remove-button absolute top-2 right-2 z-10 rounded-full p-1 text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors duration-150"
                        title="Remove component"
                    >
                        <X className="h-4 w-4" />
                    </button>
                ))}
            {children}
        </div>
    );
}

// For text inside the tool card
export function ToolCardTitle({ children, className }: { children: ReactNode; className?: string }) {
    return <h3 className={cn("text-xl font-normal text-foreground w-full", className)}>{children}</h3>;
}

// For content inside the tool card
export interface ToolCardContentProps {
    children: ReactNode;
    className?: string;
    maxHeight?: string | number;
    scrollable?: boolean;
}

export function ToolCardContent({ children, className, maxHeight = "400px", scrollable = true }: ToolCardContentProps) {
    // Apply max-height as inline style since we want to use a dynamic value
    const scrollAreaStyle = maxHeight ? { maxHeight } : undefined;

    if (scrollable) {
        return (
            <div className={cn("mt-4 text-muted-foreground h-full", className)}>
                <ScrollArea className="h-full" style={scrollAreaStyle}>
                    <div className="pr-4">{children}</div>
                </ScrollArea>
            </div>
        );
    }

    return <div className={cn("mt-4 text-muted-foreground h-full", className)}>{children}</div>;
}
