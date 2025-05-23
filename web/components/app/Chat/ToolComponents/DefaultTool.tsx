import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface DefaultToolProps {
    data: any;
    contentString: string;
    onAddToGrid?: (component: ReactNode, header?: ReactNode) => void;
}

export function DefaultTool({ data, contentString, onAddToGrid }: DefaultToolProps) {
    // Try to extract a reasonable header from the data
    const getHeaderFromData = () => {
        if (data && data.type) {
            return `${data.type.charAt(0).toUpperCase() + data.type.slice(1).replace(/_/g, " ")}`;
        }
        return "Tool";
    };

    const handleAddToGrid = () => {
        if (onAddToGrid) {
            onAddToGrid(
                <ScrollArea className="h-full" style={{ maxHeight: "500px" }}>
                    <div className="whitespace-pre-line pr-4">{contentString}</div>
                </ScrollArea>,
                getHeaderFromData()
            );
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <ScrollArea className="h-full" style={{ maxHeight: "300px" }}>
                <div className="whitespace-pre-line pr-4">{contentString}</div>
            </ScrollArea>
            {onAddToGrid && (
                <div className="mt-2">
                    <Button variant="outline" size="sm" onClick={handleAddToGrid} className="text-xs">
                        Add to Dashboard
                    </Button>
                </div>
            )}
        </div>
    );
}
