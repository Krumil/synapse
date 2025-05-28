import { Chart } from "@/components/WalletBalance/Chart";
import { useEffect, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface WalletBalancesToolProps {
    data: any;
    contentString?: string;
    onAddToGrid?: (component: ReactNode, header?: ReactNode) => void;
}

export function WalletBalancesTool({ data, contentString, onAddToGrid }: WalletBalancesToolProps) {
    const balancesData = data.balances || data.data;

    if (!balancesData) {
        console.error("No balances data found in:", data);
        return <div className="w-full p-3 bg-red-50 text-red-500 rounded-lg">Error: No wallet balance data found</div>;
    }

    const handleAddToGrid = () => {
        if (onAddToGrid) {
            onAddToGrid(<Chart data={balancesData} />, "Portfolio");
        }
    };

    return (
        <div className="w-full">
            <Chart data={balancesData} />
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
