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
function splitUint256(amount: string): { low: string; high: string } {
	const amountBigInt = BigInt(amount);
	const maxUint128 = BigInt("0x100000000000000000000000000000000");
	const low = (amountBigInt % maxUint128).toString();
	const high = (amountBigInt / maxUint128).toString();
	return { low, high };
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

// Main tool function
const createTransactionTool = tool(
	async (input: {
		action: string;
		amount?: string;
		amountInSmallestUnit?: string;
		asset?: string;
		assetPair?: string;
		protocol: string;
		userAddress: string;
	}) => {
		const { action, amount, amountInSmallestUnit, asset, assetPair, protocol, userAddress } = input;

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

			// Prepare dynamic parameters
			const dynamicParams: Record<string, string> = {
				userAddress: hexToDecimalString(userAddress),
				deadline: getDeadline(),
			};

			if (action === "stake" || action === "unstake") {
				// Validate asset
				if (!asset) {
					throw new Error("Asset must be provided for staking actions.");
				}
				const assetDetails = protocolConfig.contracts.assets[asset];
				if (!assetDetails) {
					throw new Error(`Asset "${asset}" is not supported on protocol "${protocol}".`);
				}

				const decimals = assetDetails.decimals;
				const stakingContractAddress = hexToDecimalString(assetDetails.stakingContractAddress);
				dynamicParams.assetContractAddress = hexToDecimalString(assetDetails.assetContractAddress);
				dynamicParams.stakingContractAddress = stakingContractAddress;

				let amountInSmallestUnitStr: string;

				if (action === "stake") {
					// Handle stake action
					if (amountInSmallestUnit) {
						amountInSmallestUnitStr = amountInSmallestUnit;
					} else if (amount) {
						amountInSmallestUnitStr = convertAmountToSmallestUnit(amount, decimals);
					} else {
						throw new Error("Either 'amount' or 'amountInSmallestUnit' must be provided for staking.");
					}

					const { low: amount_low, high: amount_high } = splitUint256(amountInSmallestUnitStr);
					dynamicParams.amountInSmallestUnit = amountInSmallestUnitStr;
					dynamicParams.amount_low = amount_low;
					dynamicParams.amount_high = amount_high;
				} else if (action === "unstake") {
					// Handle unstake action (burn all tokens)
					const maxUint128 = "340282366920938463463374607431768211455";
					dynamicParams.amount_low = maxUint128;
					dynamicParams.amount_high = maxUint128;
				}
			} else if (action === "add_liquidity") {
				// Handle add_liquidity action
				if (!assetPair || !amount) {
					throw new Error("Both 'assetPair' and 'amount' must be provided for add_liquidity action.");
				}

				// Split asset pair
				const [token0Symbol, token1Symbol] = assetPair.split("/");
				if (!token0Symbol || !token1Symbol) {
					throw new Error("Invalid asset pair format. Expected format: 'TOKEN0/TOKEN1'.");
				}

				// Get asset details
				const token0Details = protocolConfig.contracts.assets[token0Symbol];
				const token1Details = protocolConfig.contracts.assets[token1Symbol];
				if (!token0Details || !token1Details) {
					throw new Error(`Assets "${token0Symbol}" or "${token1Symbol}" are not supported.`);
				}

				// Get pair address
				const pairDetails = protocolConfig.contracts.pairs[assetPair];
				if (!pairDetails) {
					throw new Error(`Pair "${assetPair}" is not supported.`);
				}

				// For simplicity, assume equal split of total amount between tokens
				const totalAmountUSD = parseFloat(amount);
				if (isNaN(totalAmountUSD) || totalAmountUSD <= 0) {
					throw new Error("Invalid amount provided for add_liquidity.");
				}

				const amount0USD = totalAmountUSD / 2;
				const amount1USD = totalAmountUSD / 2;

				// Placeholder: Fetch token prices to convert USD amounts to token amounts
				// For this example, let's assume 1 ETH = $2000, 1 USDC = $1
				const tokenPricesUSD = {
					"ETH": 3100,
					"USDC": 1
				};

				const amount0Tokens = amount0USD / tokenPricesUSD[token0Symbol as keyof typeof tokenPricesUSD];
				const amount1Tokens = amount1USD / tokenPricesUSD[token1Symbol as keyof typeof tokenPricesUSD];

				// Convert token amounts to smallest units
				const amount0InSmallestUnit = convertAmountToSmallestUnit(amount0Tokens.toString(), token0Details.decimals);
				const amount1InSmallestUnit = convertAmountToSmallestUnit(amount1Tokens.toString(), token1Details.decimals);

				// Split amounts into low and high for u256
				const { low: amount0_low, high: amount0_high } = splitUint256(amount0InSmallestUnit);
				const { low: amount1_low, high: amount1_high } = splitUint256(amount1InSmallestUnit);

				// Set minimum amounts (e.g., 95% of desired amounts)
				const slippageTolerance = 0.95;
				const amount0MinTokens = amount0Tokens * slippageTolerance;
				const amount1MinTokens = amount1Tokens * slippageTolerance;

				const amount0MinInSmallestUnit = convertAmountToSmallestUnit(amount0MinTokens.toString(), token0Details.decimals);
				const amount1MinInSmallestUnit = convertAmountToSmallestUnit(amount1MinTokens.toString(), token1Details.decimals);

				const { low: amount0_min_low, high: amount0_min_high } = splitUint256(amount0MinInSmallestUnit);
				const { low: amount1_min_low, high: amount1_min_high } = splitUint256(amount1MinInSmallestUnit);

				dynamicParams.token0ContractAddress = token0Details.assetContractAddress;
				dynamicParams.token1ContractAddress = token1Details.assetContractAddress;
				dynamicParams.pairAddress = pairDetails.pairAddress;
				dynamicParams.addLiquidityContractAddress = pairDetails.addLiquidityContractAddress;

				dynamicParams.amount0_low = amount0_low;
				dynamicParams.amount0_high = amount0_high;
				dynamicParams.amount1_low = amount1_low;
				dynamicParams.amount1_high = amount1_high;

				dynamicParams.amount0_min_low = amount0_min_low;
				dynamicParams.amount0_min_high = amount0_min_high;
				dynamicParams.amount1_min_low = amount1_min_low;
				dynamicParams.amount1_min_high = amount1_min_high;
			} else {
				throw new Error(`Unsupported action: "${action}"`);
			}

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
				if (txConfig.name.startsWith("approve")) {
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
					asset: asset || null,
					assetPair: assetPair || null,
					amount: amount || null,
					amountInSmallestUnit: amountInSmallestUnit || null,
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
		description: "Generates transaction data based on dynamic parameters and a configuration file. Use this for DeFi actions like staking, unstaking, and adding liquidity. Supported protocols: Nostra",
		schema: z.object({
			action: z.string().describe("The action to perform, e.g., 'stake', 'unstake', or 'add_liquidity'"),
			amount: z.string().optional().describe("The amount to transact, as a string (for 'stake' and 'add_liquidity')"),
			amountInSmallestUnit: z.string().optional().describe("The amount in smallest unit (e.g., wei for ETH)"),
			asset: z.string().optional().describe("The asset symbol, e.g., 'ETH' (required for 'stake' and 'unstake')"),
			assetPair: z.string().optional().describe("The asset pair for liquidity provision, e.g., 'ETH/USDC' (required for 'add_liquidity')"),
			protocol: z.string().describe("The protocol name, e.g., 'Nostra'"),
			userAddress: z.string().describe("The user's wallet address"),
		}),
	}
);

// Export the tool
export const defiTransactionTools = [
	createTransactionTool,
];
