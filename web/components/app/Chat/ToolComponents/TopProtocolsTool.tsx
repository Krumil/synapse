import { ProtocolsTable } from "@/components/ProtocolsTable/ProtocolsTable";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface TopProtocolsToolProps {
    data: {
        chain: string;
        totalProtocols: number;
        filteredProtocols: number;
        protocols: any[]; // Use proper typing based on your actual data structure
        type: string;
    };
    contentString?: string;
    onAddToGrid?: (component: ReactNode, header?: ReactNode) => void;
}

export function TopProtocolsTool({ data, onAddToGrid }: TopProtocolsToolProps) {
    const handleAddToGrid = () => {
        if (onAddToGrid) {
            onAddToGrid(
                <ProtocolsTable
                    chain={data.chain}
                    totalProtocols={data.totalProtocols}
                    filteredProtocols={data.filteredProtocols}
                    protocols={data.protocols}
                />,
                `Top Protocols${data.chain ? ` - ${data.chain}` : ""}`
            );
        }
    };

    return (
        <div className="w-full">
            <ProtocolsTable
                chain={data.chain}
                totalProtocols={data.totalProtocols}
                filteredProtocols={data.filteredProtocols}
                protocols={data.protocols}
            />
            {onAddToGrid && (
                <div className="mt-4">
                    <Button variant="outline" size="sm" onClick={handleAddToGrid} className="text-xs">
                        Add to Dashboard
                    </Button>
                </div>
            )}
        </div>
    );
}
