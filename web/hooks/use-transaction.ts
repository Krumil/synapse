import { useRef } from 'react';
import { useSendTransaction } from '@starknet-react/core';
import type { Call } from 'starknet';
import type { TransactionData, TransactionResult } from '@/types/transaction';

export function useTransaction() {
	const currentCallsRef = useRef<Call[]>([]);
	const { sendAsync, status } = useSendTransaction({
		calls: currentCallsRef.current
	});

	const handleTransaction = async (txData: any): Promise<TransactionResult> => {
		try {
			const calls: Call[] = txData.map((tx: any) => {
				const txEntrypoint = tx.entrypoint
				if (txEntrypoint) {
					let contractAddress = tx.contractAddress;
					let calldata = tx.calldata;

					return {
						contractAddress: contractAddress,
						entrypoint: txEntrypoint,
						calldata: calldata,
					};
				}
				throw new Error('Invalid transaction format');
			});

			currentCallsRef.current = calls;

			const response = await sendAsync(calls);

			if (!response?.transaction_hash) {
				throw new Error('No transaction hash received');
			}

			return {
				status: 'success',
				hash: response.transaction_hash
			};

		} catch (error) {
			console.error('Transaction failed:', error);

			if (error instanceof Error && error.message.includes('User rejected request')) {
				return {
					status: 'error',
					error: 'Transaction was cancelled by user'
				};
			}

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