import { useRef } from 'react';
import { useSendTransaction } from '@starknet-react/core';
import type { Call } from 'starknet';
import type { TransactionData, TransactionResult } from '@/types/transaction';

export function useTransaction() {
	const currentCallsRef = useRef<Call[]>([]);
	const { sendAsync, status } = useSendTransaction({
		calls: currentCallsRef.current
	});

	const handleTransaction = async (txData: TransactionData[]): Promise<TransactionResult> => {
		try {
			const calls: Call[] = txData.map(tx => ({
				contractAddress: tx.contractAddress,
				entrypoint: tx.entrypoint,
				calldata: tx.calldata || []
			}));

			currentCallsRef.current = calls;

			const response = await sendAsync();

			if (!response?.transaction_hash) {
				throw new Error('No transaction hash received');
			}

			return {
				status: 'success',
				hash: response.transaction_hash
			};

		} catch (error) {
			console.error('Transaction failed:', error);
			return {
				status: 'error',
				error: error instanceof Error ? error.message : 'Unknown error occurred'
			};
		} finally {
			currentCallsRef.current = [];
		}
	};

	return {
		handleTransaction,
		transactionStatus: status,
	};
}