import { useSendTransaction } from "@starknet-react/core";
import type { Call } from "starknet";
import type { TransactionResult } from "@/types/transaction";

export function useTransaction() {
    const { sendAsync, status } = useSendTransaction({ calls: undefined });

    const handleTransaction = async (txData: any): Promise<TransactionResult> => {
        try {
            console.log("txData", txData);

            // Handle both old format (array) and new format (object with transactions property)
            let transactionsArray;
            if (Array.isArray(txData)) {
                // Old format: direct array
                transactionsArray = txData;
            } else if (txData.transactions && Array.isArray(txData.transactions)) {
                // New format: object with transactions property
                transactionsArray = txData.transactions;
            } else {
                throw new Error("Invalid transaction data format");
            }

            const calls: Call[] = transactionsArray.map((tx: any) => {
                const txEntrypoint = tx.entrypoint;
                if (txEntrypoint) {
                    const contractAddress = tx.contractAddress;
                    const calldata = tx.calldata;

                    return {
                        contractAddress: contractAddress,
                        entrypoint: txEntrypoint,
                        calldata: calldata,
                    };
                }
                throw new Error("Invalid transaction format");
            });

            // Send the transaction using sendAsync with the calls
            const response = await sendAsync(calls);

            if (!response?.transaction_hash) {
                throw new Error("No transaction hash received");
            }

            return {
                status: "success",
                hash: response.transaction_hash,
            };
        } catch (error) {
            console.error("Transaction failed:", error);

            if (error instanceof Error && error.message.includes("User rejected request")) {
                return {
                    status: "error",
                    error: "Transaction was cancelled by user",
                };
            }

            return {
                status: "error",
                error: error instanceof Error ? error.message : "Unknown error occurred",
            };
        }
    };

    return {
        handleTransaction,
        transactionStatus: status,
    };
}
