import { tool } from "@langchain/core/tools";
import { z } from "zod";
import fs from 'fs';
import path from 'path';

// Load the configuration file
const configFilePath = path.join(__dirname, '../config/protocolConfig.json');
const configData = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));

// Utility function to convert amount to smallest unit
function convertAmountToSmallestUnit(amount: string, decimals: number): string {
	const amountNum = parseFloat(amount);
	if (isNaN(amountNum)) {
		throw new Error(`Invalid amount: ${amount}`);
	}
	const factor = 10 ** decimals;
	const amountInSmallestUnit = (amountNum * factor).toFixed(0);
	return amountInSmallestUnit;
}

// Split amount into low and high for u256
function splitUint256(amount: string): { amount_low: string; amount_high: string } {
	const amountBigInt = BigInt(amount);
	const maxUint128 = BigInt("0x100000000000000000000000000000000");
	const amount_low = (amountBigInt % maxUint128).toString();
	const amount_high = (amountBigInt / maxUint128).toString();
	return { amount_low, amount_high };
}

// Convert hex addresses to decimal strings
function hexToDecimalString(hex: string): string {
	if (hex.startsWith("0x")) {
		return BigInt(hex).toString(10);
	}
	return hex;
}

// Helper function to replace placeholders
function replacePlaceholders(str: string, params: Record<string, string | undefined>): string {
	return str.replace(/\{([^}]+)\}/g, (match, p1) => {
		const value = params[p1];
		if (value === undefined) {
			throw new Error(`Missing parameter "${p1}" for transaction generation.`);
		}
		return value;
	});
}

// Utility function to get current timestamp plus a buffer (e.g., 15 minutes)
function getDeadline(bufferMinutes: number = 15): string {
	const currentTime = Math.floor(Date.now() / 1000);
	return (currentTime + bufferMinutes * 60).toString();
}


// The tool
const createTransactionTool = tool(
	async ({ action, amount, amountInSmallestUnit, asset, protocol, userAddress }: { action: string; amount?: string; amountInSmallestUnit?: string; asset: string; protocol: string; userAddress: string }) => {
		try {
			// Validate protocol
			const protocolConfig = configData.protocols[protocol];
			if (!protocolConfig) {
				throw new Error(`Protocol "${protocol}" is not supported.`);
			}

			// Validate operation
			const operationConfig = protocolConfig.operations[action];
			if (!operationConfig) {
				throw new Error(`Action "${action}" is not supported for protocol "${protocol}".`);
			}



			// Validate asset
			const assetDetails = protocolConfig.contracts.assets[asset];
			if (!assetDetails) {
				throw new Error(`Asset "${asset}" is not supported on protocol "${protocol}".`);
			}
			const decimals = assetDetails.decimals;

			// Convert amount to smallest unit
			let amountInSmallestUnitStr: string;
			if (amountInSmallestUnit) {
				// Use provided amountInSmallestUnit
				amountInSmallestUnitStr = amountInSmallestUnit;
			} else if (amount) {
				amountInSmallestUnitStr = convertAmountToSmallestUnit(amount, decimals);
			} else {
				throw new Error("Either 'amount' or 'amountInSmallestUnit' must be provided.");
			}

			// Split amount into low and high for u256
			const { amount_low, amount_high } = splitUint256(amountInSmallestUnitStr);

			// Prepare dynamic parameters
			const dynamicParams = {
				assetContractAddress: hexToDecimalString(assetDetails.assetContractAddress),
				operationContractAddress: hexToDecimalString(assetDetails.operationContractAddress),
				amountInSmallestUnit: amountInSmallestUnitStr,
				amount_low: amount_low,
				amount_high: amount_high,
				userAddress: hexToDecimalString(userAddress),
			};

			// Generate transactions
			const transactions = operationConfig.transactions.map((txConfig: any) => {
				// Replace placeholders in contractAddress and calldata
				const contractAddress = replacePlaceholders(txConfig.contractAddress, dynamicParams);
				const calldata = txConfig.calldata.map((param: string) => replacePlaceholders(param, dynamicParams));

				// Build the transaction object
				const transaction: any = {
					contractAddress: contractAddress,
					entrypoint: txConfig.entrypoint,
					calldata: calldata,
				};

				// Include entrypointSelector if specified
				if (txConfig.entrypointSelector) {
					transaction.entrypointSelector = txConfig.entrypointSelector;
				}

				// Wrap in an object with the transaction name if provided
				if (txConfig.name === "approve") {
					return { approve: transaction };
				} else {
					return { transactionData: transaction };
				}
			});

			// Build the final result
			const result = {
				type: "transaction",
				transactions: transactions,
				details: {
					protocol: protocol,
					action: action,
					asset: asset,
					amount: amount || null,
					amountInSmallestUnit: amountInSmallestUnitStr,
					userAddress: userAddress,
				}
			};

			return JSON.stringify(result, null, 2);
		} catch (error) {
			throw new Error(`Failed to create transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	},
	{
		name: "create_transaction",
		description: "Generates transaction data based on dynamic parameters and a configuration file. Use this for defi actions like staking and unstaking. Supported protocols: Nostra",
		schema: z.object({
			action: z.string().describe("The action to perform, e.g., 'stake'"),
			amount: z.string().optional().describe("The amount to transact, as a string"),
			amountInSmallestUnit: z.string().optional().describe("The amount in smallest unit (e.g., wei for ETH)"),
			asset: z.string().describe("The asset symbol, e.g., 'ETH'"),
			protocol: z.string().describe("The protocol name, e.g., 'Nostra'"),
			userAddress: z.string().describe("The user's wallet address"),
		}),
	}
);

// Export the tool
export const defiTransactionTools = [
	createTransactionTool,
];
