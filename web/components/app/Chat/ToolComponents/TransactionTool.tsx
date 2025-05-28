import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTransaction } from "@/hooks/use-transaction";
import { CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface TransactionToolProps {
    data: {
        type: "transaction";
        transactions: Array<{
            contractAddress: string;
            entrypoint: string;
            calldata: string[];
        }>;
        details: {
            protocol?: string;
            action?: string;
            quoteId?: string;
            sellTokenAddress?: string;
            buyTokenAddress?: string;
            sellAmount?: string;
            userAddress?: string;
            slippage?: number;
            includeApprove?: boolean;
        };
    };
    contentString?: string;
    onAddToGrid?: (component: ReactNode, header?: ReactNode) => void;
}

export function TransactionTool({ data, contentString = "", onAddToGrid }: TransactionToolProps) {
    const { handleTransaction, transactionStatus } = useTransaction();
    const [executionResult, setExecutionResult] = useState<{
        status: "success" | "error" | null;
        hash?: string;
        error?: string;
    }>({ status: null });

    const executeTransaction = async () => {
        try {
            setExecutionResult({ status: null });
            const result = await handleTransaction(data);
            setExecutionResult(result);
        } catch (error) {
            setExecutionResult({
                status: "error",
                error: error instanceof Error ? error.message : "Unknown error occurred",
            });
        }
    };

    const formatAddress = (address: string) => {
        if (!address) return "";
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const getStatusIcon = () => {
        if (transactionStatus === "pending") {
            return <Loader2 className="h-4 w-4 animate-spin" />;
        }
        if (executionResult.status === "success") {
            return <CheckCircle className="h-4 w-4 text-green-500" />;
        }
        if (executionResult.status === "error") {
            return <XCircle className="h-4 w-4 text-red-500" />;
        }
        return null;
    };

    const getStatusText = () => {
        if (transactionStatus === "pending") return "Executing...";
        if (executionResult.status === "success") return "Transaction Successful";
        if (executionResult.status === "error") return "Transaction Failed";
        return "Ready to Execute";
    };

    return (
        <div className="w-full space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        Details
                        {getStatusIcon()}
                    </h3>
                    <p className="text-sm text-muted-foreground">{getStatusText()}</p>
                </div>
                {data.details?.protocol && <Badge variant="secondary">{data.details.protocol}</Badge>}
            </div>

            <Separator />

            {/* Transaction Summary */}
            {data.details && (
                <div className="space-y-2">
                    <h4 className="font-medium text-sm">Summary</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm bg-muted/40 rounded-md p-3">
                        {data.details.action && (
                            <div>
                                <span className="text-muted-foreground">Action:</span>
                                <span className="ml-2 capitalize">{data.details.action}</span>
                            </div>
                        )}
                        {data.details.slippage && (
                            <div>
                                <span className="text-muted-foreground">Slippage:</span>
                                <span className="ml-2">{data.details.slippage}%</span>
                            </div>
                        )}
                        {data.details.userAddress && (
                            <div className="col-span-2">
                                <span className="text-muted-foreground">User Address:</span>
                                <span className="ml-2 font-mono">{formatAddress(data.details.userAddress)}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Transaction Calls */}
            <div className="space-y-2">
                <h4 className="font-medium text-sm">Calls ({data.transactions.length})</h4>
                <div className="space-y-2">
                    {data.transactions.map((tx, index) => (
                        <div
                            key={index}
                            className="border rounded-lg p-3 text-sm hover:border-border/80 transition-colors"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline">Call {index + 1}</Badge>
                                <span className="font-mono text-xs text-muted-foreground">
                                    {formatAddress(tx.contractAddress)}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Function:</span>
                                <span className="ml-2 font-mono">{tx.entrypoint}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Parameters:</span>
                                <span className="ml-2">{tx.calldata.length} arguments</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Execution Result */}
            {executionResult.status === "success" && executionResult.hash && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-800 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-semibold">Transaction Successful</span>
                    </div>
                    <div className="mt-2 text-sm">
                        <span className="text-green-700 dark:text-green-500">Transaction Hash:</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-xs bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                                {formatAddress(executionResult.hash)}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`https://starkscan.co/tx/${executionResult.hash}`, "_blank")}
                            >
                                <ExternalLink className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {executionResult.status === "error" && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
                        <XCircle className="h-4 w-4" />
                        <span className="font-semibold">Transaction Failed</span>
                    </div>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-400">{executionResult.error}</div>
                </div>
            )}

            {/* Execute Button */}
            <div className="flex justify-end pt-2">
                <Button
                    onClick={executeTransaction}
                    disabled={transactionStatus === "pending" || executionResult.status === "success"}
                    className="min-w-[120px]"
                >
                    {transactionStatus === "pending" ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Executing...
                        </>
                    ) : executionResult.status === "success" ? (
                        "Completed"
                    ) : (
                        "Execute Transaction"
                    )}
                </Button>
            </div>
        </div>
    );
}
