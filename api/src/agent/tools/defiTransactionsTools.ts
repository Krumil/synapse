import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
	hexToDecimalString,
	getDeadline,
	convertAmountToSmallestUnit,
	splitUint256,
	replacePlaceholders,
	getTokensFromS3,
	extractDefiTokens,
	fetchTokenPrices,
	fetchTokenBalance,
	filterNonZeroBalances,
	getTokenPrice,
} from "../utils/defiUtils";
import fs from 'fs';
import path from 'path';
import { ProtocolConfig } from "../../types/defi";

// Load the configuration file
const configFilePath = path.join(__dirname, '../../config/protocolConfig.json');
const configData: ProtocolConfig = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));

// Main tool function
const createTransactionsTool = tool(
	async (input: {
		actions: Array<{
			action: string;
			amount?: string;
			amountInSmallestUnit?: string;
			protocol: string;
			userAddress: string;
			asset?: string;
			assetPair?: string;
		}> | {
			action: string;
			amount?: string;
			amountInSmallestUnit?: string;
			protocol: string;
			userAddress: string;
			asset?: string;
			assetPair?: string;
		};
	}) => {
		try {
			// Convert single action to array for unified processing
			const actionsArray = Array.isArray(input.actions) ? input.actions : [input.actions];

			const results = await Promise.all(
				actionsArray.map(async (actionInput) => {
					const { action, amount, amountInSmallestUnit, asset, assetPair, protocol, userAddress } = actionInput;

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

						// Fetch token prices directly instead of using tokenPricesUSD parameter
						const [token0Price, token1Price] = await Promise.all([
							getTokenPrice(token0Details.assetContractAddress),
							getTokenPrice(token1Details.assetContractAddress)
						]);

						const amount0USD = totalAmountUSD / 2;
						const amount1USD = totalAmountUSD / 2;

						const amount0Tokens = amount0USD / token0Price;
						const amount1Tokens = amount1USD / token1Price;

						// Convert token amounts to smallest units
						const amount0InSmallestUnit = convertAmountToSmallestUnit(amount0Tokens.toString(), token0Details.decimals);
						const amount1InSmallestUnit = convertAmountToSmallestUnit(amount1Tokens.toString(), token1Details.decimals);

						// Split amounts into low and high for u256
						const { low: amount0_low, high: amount0_high } = splitUint256(amount0InSmallestUnit);
						const { low: amount1_low, high: amount1_high } = splitUint256(amount1InSmallestUnit);

						// Set minimum amounts (e.g., 95% of desired amounts)
						const slippageTolerance = 0.8;
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

						return transaction;
					});

					return {
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
				})
			);

			// If it was a single action, return just that result
			if (!Array.isArray(input.actions)) {
				return JSON.stringify(results[0], null, 2);
			}

			// For multiple actions, merge the results
			const mergedResult = {
				type: "transaction",
				transactions: results.reduce((acc, curr) => acc.concat(curr.transactions), []),
				details: results.map(result => result.details)
			};

			return JSON.stringify(mergedResult, null, 2);
		} catch (error) {
			throw new Error(`Failed to create transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	},
	{
		name: "create_transaction",
		description: "Generates transaction data based on dynamic parameters and a configuration file. Supports single or multiple DeFi actions like staking, unstaking, and adding liquidity. Supported protocols: Nostra",
		schema: z.object({
			actions: z.union([
				z.array(
					z.object({
						action: z.string().describe("The action to perform, e.g., 'stake', 'unstake', or 'add_liquidity'"),
						amount: z.string().optional().describe("The amount to transact, as a string (for 'stake' and 'add_liquidity')"),
						amountInSmallestUnit: z.string().optional().describe("The amount in smallest unit (e.g., wei for ETH)"),
						asset: z.string().optional().describe("The asset symbol, e.g., 'ETH' (required for 'stake' and 'unstake')"),
						assetPair: z.string().optional().describe("The asset pair for liquidity provision, e.g., 'ETH/USDC' (required for 'add_liquidity')"),
						protocol: z.string().describe("The protocol name, e.g., 'Nostra'"),
						userAddress: z.string().describe("The user's wallet address")
					})
				),
				z.object({
					action: z.string().describe("The action to perform, e.g., 'stake', 'unstake', or 'add_liquidity'"),
					amount: z.string().optional().describe("The amount to transact, as a string (for 'stake' and 'add_liquidity')"),
					amountInSmallestUnit: z.string().optional().describe("The amount in smallest unit (e.g., wei for ETH)"),
					asset: z.string().optional().describe("The asset symbol, e.g., 'ETH' (required for 'stake' and 'unstake')"),
					assetPair: z.string().optional().describe("The asset pair for liquidity provision, e.g., 'ETH/USDC' (required for 'add_liquidity')"),
					protocol: z.string().describe("The protocol name, e.g., 'Nostra'"),
					userAddress: z.string().describe("The user's wallet address")
				})
			]).describe("Single action or array of actions to perform")
		})
	}
);

const getWalletBalancesTool = tool(
	async (input: { walletAddress: string }) => {
		try {
			const tokens = await getTokensFromS3();

			// Extract DeFi tokens
			const defiTokens = extractDefiTokens();

			// Fetch all token prices
			const tokenPrices = await fetchTokenPrices(
				tokens,
				defiTokens,
			);

			const tokensToCheck = [...tokens, ...Array.from(defiTokens).map(token => ({
				address: token.address,
				name: token.name,
				symbol: token.symbol
			}))];

			// Fetch all balances of both regular and DeFi tokens
			const balancesWithUSD = await Promise.all(
				tokensToCheck.map((token: any) =>
					fetchTokenBalance(token, input.walletAddress, tokenPrices)
				)
			);

			// Filter balances
			const filteredBalances = filterNonZeroBalances(balancesWithUSD);

			return JSON.stringify(
				{
					type: "wallet_balances",
					data: filteredBalances,
					details: {
						walletAddress: input.walletAddress,
					}
				},
				null,
				2
			);
		} catch (error) {
			throw new Error(
				`Failed to fetch wallet balances: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	},
	{
		name: "get_wallet_balances",
		description:
			"Fetches ERC20 token balances and their USD values for a specified wallet address on StarkNet",
		schema: z.object({
			walletAddress: z.string().describe(
				"The StarkNet wallet address to check balances for"
			),
			contractAddresses: z
				.array(z.string())
				.optional()
				.describe("Optional array of specific token contract addresses to check")
		})
	}
);

// Update exports
export const defiTransactionsTools = [createTransactionsTool, getWalletBalancesTool];

