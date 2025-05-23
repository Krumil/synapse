"use client";

import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ToolCardProps {
    children: ReactNode;
    className?: string;
    size?: "sm" | "md" | "lg";
    withBorder?: boolean;
}

export function ToolCard({ children, className, size = "md", withBorder = true }: ToolCardProps) {
    const sizeClasses = {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
    };

    return (
        <div
            className={cn(
                "relative rounded-3xl",
                "shadow-[10px_10px_30px_#242222,_-10px_-10px_30px_#302e2e]",
                sizeClasses[size],
                className
            )}
        >
            {children}
        </div>
    );
}

// For text inside the tool card
export function ToolCardTitle({ children, className }: { children: ReactNode; className?: string }) {
    return <h3 className={cn("text-white font-normal text-xl w-full", className)}>{children}</h3>;
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
            <div className={cn("mt-4 text-white/90 h-full", className)}>
                <ScrollArea className="h-full" style={scrollAreaStyle}>
                    <div className="pr-4">{children}</div>
                </ScrollArea>
            </div>
        );
    }

    return <div className={cn("mt-4 text-white/90 h-full", className)}>{children}</div>;
}
