export interface TransactionData {
	contractAddress: string;
	entrypoint: string;
	calldata?: string[];
}

export interface TransactionResult {
	status: 'success' | 'error';
	hash?: string;
	error?: string;
}