"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defiTransactionsTools = void 0;
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const starknet_1 = require("starknet");
const contracts_1 = require("../../constants/contracts");
const defiUtils_1 = require("../utils/defiUtils");
// Load the configuration file
const configFilePath = path_1.default.join(__dirname, '../../config/protocolConfig.json');
const configData = JSON.parse(fs_1.default.readFileSync(configFilePath, 'utf-8'));
async function getTokenPrice(tokenAddress) {
    try {
        // For basic tokens, use the existing price feed
        const { data } = await axios_1.default.get(`https://starknet.impulse.avnu.fi/v1/tokens/${tokenAddress}/prices/line`);
        const currentPrice = data[data.length - 1]?.value;
        if (!currentPrice) {
            throw new Error(`No price data available for token ${tokenAddress}`);
        }
        return currentPrice;
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            throw new Error(`Failed to fetch price for token ${tokenAddress}: ${error.message}`);
        }
        throw error;
    }
}
async function getLPTokenPrice(poolAddress, provider, protocolConfig, protocol, underlyingTokens) {
    try {
        const poolContract = new starknet_1.Contract(contracts_1.LP_ABI, poolAddress, provider);
        // Get pool data
        const [reservesResult, totalSupplyResult] = await Promise.all([
            poolContract.call("get_reserves", []),
            poolContract.call("total_supply", [])
        ]);
        // Reconstruct reserves and total supply
        const reserve0 = (0, defiUtils_1.reconstructUint256)(reservesResult.reserve0[0], reservesResult.reserve0[1]);
        const reserve1 = (0, defiUtils_1.reconstructUint256)(reservesResult.reserve1[0], reservesResult.reserve1[1]);
        const totalSupply = (0, defiUtils_1.reconstructUint256)(totalSupplyResult.supply[0], totalSupplyResult.supply[1]);
        // Get underlying token configs
        const token0Config = protocolConfig.protocols[protocol].contracts.assets[underlyingTokens[0]];
        const token1Config = protocolConfig.protocols[protocol].contracts.assets[underlyingTokens[1]];
        // Get underlying token prices
        const token0Price = await getTokenPrice(token0Config.assetContractAddress);
        const token1Price = await getTokenPrice(token1Config.assetContractAddress);
        // Calculate reserves in USD
        const reserve0USD = Number(reserve0) * token0Price / (10 ** token0Config.decimals);
        const reserve1USD = Number(reserve1) * token1Price / (10 ** token1Config.decimals);
        // Total pool value in USD
        const totalPoolValueUSD = reserve0USD + reserve1USD;
        // Price per LP token = Total Pool Value / Total Supply
        return totalPoolValueUSD / (Number(totalSupply) / (10 ** 18));
    }
    catch (error) {
        console.error(`Failed to calculate LP token price for pool ${poolAddress}:`, error);
        throw error;
    }
}
// Main tool function
const createTransactionsTool = (0, tools_1.tool)(async (input) => {
    try {
        // Convert single action to array for unified processing
        const actionsArray = Array.isArray(input.actions) ? input.actions : [input.actions];
        const results = await Promise.all(actionsArray.map(async (actionInput) => {
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
            const dynamicParams = {
                userAddress: (0, defiUtils_1.hexToDecimalString)(userAddress),
                deadline: (0, defiUtils_1.getDeadline)(),
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
                const stakingContractAddress = (0, defiUtils_1.hexToDecimalString)(assetDetails.stakingContractAddress);
                dynamicParams.assetContractAddress = (0, defiUtils_1.hexToDecimalString)(assetDetails.assetContractAddress);
                dynamicParams.stakingContractAddress = stakingContractAddress;
                let amountInSmallestUnitStr;
                if (action === "stake") {
                    // Handle stake action
                    if (amountInSmallestUnit) {
                        amountInSmallestUnitStr = amountInSmallestUnit;
                    }
                    else if (amount) {
                        amountInSmallestUnitStr = (0, defiUtils_1.convertAmountToSmallestUnit)(amount, decimals);
                    }
                    else {
                        throw new Error("Either 'amount' or 'amountInSmallestUnit' must be provided for staking.");
                    }
                    const { low: amount_low, high: amount_high } = (0, defiUtils_1.splitUint256)(amountInSmallestUnitStr);
                    dynamicParams.amountInSmallestUnit = amountInSmallestUnitStr;
                    dynamicParams.amount_low = amount_low;
                    dynamicParams.amount_high = amount_high;
                }
                else if (action === "unstake") {
                    // Handle unstake action (burn all tokens)
                    const maxUint128 = "340282366920938463463374607431768211455";
                    dynamicParams.amount_low = maxUint128;
                    dynamicParams.amount_high = maxUint128;
                }
            }
            else if (action === "add_liquidity") {
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
                const token0Price = await getTokenPrice(token0Details.assetContractAddress);
                const token1Price = await getTokenPrice(token1Details.assetContractAddress);
                const amount0USD = totalAmountUSD / 2;
                const amount1USD = totalAmountUSD / 2;
                const amount0Tokens = amount0USD / token0Price;
                const amount1Tokens = amount1USD / token1Price;
                // Convert token amounts to smallest units
                const amount0InSmallestUnit = (0, defiUtils_1.convertAmountToSmallestUnit)(amount0Tokens.toString(), token0Details.decimals);
                const amount1InSmallestUnit = (0, defiUtils_1.convertAmountToSmallestUnit)(amount1Tokens.toString(), token1Details.decimals);
                // Split amounts into low and high for u256
                const { low: amount0_low, high: amount0_high } = (0, defiUtils_1.splitUint256)(amount0InSmallestUnit);
                const { low: amount1_low, high: amount1_high } = (0, defiUtils_1.splitUint256)(amount1InSmallestUnit);
                // Set minimum amounts (e.g., 95% of desired amounts)
                const slippageTolerance = 0.8;
                const amount0MinTokens = amount0Tokens * slippageTolerance;
                const amount1MinTokens = amount1Tokens * slippageTolerance;
                const amount0MinInSmallestUnit = (0, defiUtils_1.convertAmountToSmallestUnit)(amount0MinTokens.toString(), token0Details.decimals);
                const amount1MinInSmallestUnit = (0, defiUtils_1.convertAmountToSmallestUnit)(amount1MinTokens.toString(), token1Details.decimals);
                const { low: amount0_min_low, high: amount0_min_high } = (0, defiUtils_1.splitUint256)(amount0MinInSmallestUnit);
                const { low: amount1_min_low, high: amount1_min_high } = (0, defiUtils_1.splitUint256)(amount1MinInSmallestUnit);
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
            }
            else {
                throw new Error(`Unsupported action: "${action}"`);
            }
            // Generate transactions
            const transactions = operationConfig.transactions.map((txConfig) => {
                // Replace placeholders in contractAddress and calldata
                const contractAddress = (0, defiUtils_1.replacePlaceholders)(txConfig.contractAddress, dynamicParams);
                const calldata = txConfig.calldata.map((param) => (0, defiUtils_1.replacePlaceholders)(param, dynamicParams));
                // Build the transaction object
                const transaction = {
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
        }));
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
    }
    catch (error) {
        throw new Error(`Failed to create transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}, {
    name: "create_transaction",
    description: "Generates transaction data based on dynamic parameters and a configuration file. Supports single or multiple DeFi actions like staking, unstaking, and adding liquidity. Supported protocols: Nostra",
    schema: zod_1.z.object({
        actions: zod_1.z.union([
            zod_1.z.array(zod_1.z.object({
                action: zod_1.z.string().describe("The action to perform, e.g., 'stake', 'unstake', or 'add_liquidity'"),
                amount: zod_1.z.string().optional().describe("The amount to transact, as a string (for 'stake' and 'add_liquidity')"),
                amountInSmallestUnit: zod_1.z.string().optional().describe("The amount in smallest unit (e.g., wei for ETH)"),
                asset: zod_1.z.string().optional().describe("The asset symbol, e.g., 'ETH' (required for 'stake' and 'unstake')"),
                assetPair: zod_1.z.string().optional().describe("The asset pair for liquidity provision, e.g., 'ETH/USDC' (required for 'add_liquidity')"),
                protocol: zod_1.z.string().describe("The protocol name, e.g., 'Nostra'"),
                userAddress: zod_1.z.string().describe("The user's wallet address")
            })),
            zod_1.z.object({
                action: zod_1.z.string().describe("The action to perform, e.g., 'stake', 'unstake', or 'add_liquidity'"),
                amount: zod_1.z.string().optional().describe("The amount to transact, as a string (for 'stake' and 'add_liquidity')"),
                amountInSmallestUnit: zod_1.z.string().optional().describe("The amount in smallest unit (e.g., wei for ETH)"),
                asset: zod_1.z.string().optional().describe("The asset symbol, e.g., 'ETH' (required for 'stake' and 'unstake')"),
                assetPair: zod_1.z.string().optional().describe("The asset pair for liquidity provision, e.g., 'ETH/USDC' (required for 'add_liquidity')"),
                protocol: zod_1.z.string().describe("The protocol name, e.g., 'Nostra'"),
                userAddress: zod_1.z.string().describe("The user's wallet address")
            })
        ]).describe("Single action or array of actions to perform")
    })
});
const getWalletBalancesTool = (0, tools_1.tool)(async (input) => {
    try {
        if (!process.env.ALCHEMY_API_ENDPOINT || !process.env.ALCHEMY_API_KEY) {
            throw new Error("Alchemy API configuration is missing");
        }
        const ALCHEMY_API_ENDPOINT = process.env.ALCHEMY_API_ENDPOINT + process.env.ALCHEMY_API_KEY;
        const provider = new starknet_1.RpcProvider({ nodeUrl: ALCHEMY_API_ENDPOINT });
        const tokens = await (0, defiUtils_1.getTokensFromS3)();
        const protocolConfig = require("../config/protocolConfig.json");
        // Extract additional contract addresses from protocol config
        const defiAddresses = new Set();
        // Get staking contract addresses
        Object.values(protocolConfig.protocols.Nostra.contracts.assets).forEach((asset) => {
            if (asset.stakingContractAddress) {
                defiAddresses.add(asset.stakingContractAddress);
            }
        });
        Object.values(protocolConfig.protocols.Nostra.contracts.pairs).forEach((pair) => {
            if (pair.pairAddress) {
                defiAddresses.add(pair.pairAddress);
            }
        });
        // Split regular tokens and DeFi tokens (additional addresses)
        const regularTokenAddresses = tokens.map((token) => token.l2_token_address);
        const defiTokenAddresses = Array.from(defiAddresses);
        // Batch fetch all token prices in one go
        const tokenPrices = new Map();
        try {
            // Fetch regular token prices
            const regularPricePromises = regularTokenAddresses.map(async (address) => {
                try {
                    const price = await getTokenPrice(address);
                    tokenPrices.set(address, price);
                }
                catch (error) {
                    console.warn(`Failed to fetch price for regular token ${address}`);
                }
            });
            // Fetch DeFi token prices with proper token key lookup
            const defiPricePromises = defiTokenAddresses.map(async (address) => {
                try {
                    // Find token key by matching address with protocol config
                    const tokenKey = Object.entries(protocolConfig.protocols.Nostra.contracts.pairs)
                        .find(([_, pair]) => pair.pairAddress === address)?.[0] ||
                        Object.entries(protocolConfig.protocols.Nostra.contracts.assets)
                            .find(([_, asset]) => asset.stakingContractAddress === address)?.[0];
                    if (tokenKey) {
                        const underlyingTokens = (0, defiUtils_1.parseUnderlyingTokens)(tokenKey);
                        if (underlyingTokens.length > 0) {
                            const price = await getLPTokenPrice(address, provider, protocolConfig, "Nostra", underlyingTokens);
                            tokenPrices.set(address, price);
                        }
                    }
                }
                catch (error) {
                    console.warn(`Failed to fetch price for DeFi token ${address}`);
                }
            });
            await Promise.all([...regularPricePromises, ...defiPricePromises]);
        }
        catch (error) {
            console.error("Failed to fetch token prices:", error);
        }
        // Create combined list of tokens to check
        const tokensToCheck = [
            ...tokens,
            ...Array.from(defiAddresses).map((address) => ({
                l2_token_address: address,
                name: `Contract-${address.slice(0, 8)}`, // Add a short version of the address as name
                symbol: 'CONTRACT'
            }))
        ];
        // Batch fetch all balances
        const balancesWithUSD = await Promise.all(tokensToCheck.map(async (token) => {
            try {
                const contract = new starknet_1.Contract(contracts_1.ERC20_ABI, token.l2_token_address, provider);
                // Get balance and decimals in a single Promise.all
                const [balanceResult, decimalsResult] = await Promise.all([
                    contract.call("balanceOf", [input.walletAddress]),
                    contract.call("decimals", [])
                ]);
                const balance = balanceResult.balance;
                const decimals = Number(decimalsResult.decimals);
                if (!balance) {
                    return {
                        contract_address: token.l2_token_address,
                        name: token.name,
                        symbol: token.symbol,
                        balance: "0",
                        decimals: decimals.toString(),
                        valueUSD: "0"
                    };
                }
                const balanceInSmallestUnit = balance.toString();
                const balanceInTokens = Number(balanceInSmallestUnit) / Math.pow(10, decimals);
                // Use cached token price
                const tokenPrice = tokenPrices.get(token.l2_token_address);
                const valueUSD = tokenPrice ? (balanceInTokens * tokenPrice).toFixed(2) : null;
                return {
                    contract_address: token.l2_token_address,
                    name: token.name,
                    symbol: token.symbol,
                    balance: balanceInSmallestUnit,
                    decimals: decimals.toString(),
                    valueUSD
                };
            }
            catch (error) {
                console.error(`Failed to fetch balance for token ${token.l2_token_address}:`, error);
                return {
                    contract_address: token.l2_token_address,
                    name: token.name,
                    symbol: token.symbol,
                    balance: "0",
                    decimals: "0",
                    valueUSD: null,
                    error: "Failed to fetch balance"
                };
            }
        }));
        return JSON.stringify({
            type: "wallet_balances",
            data: balancesWithUSD,
            details: {
                walletAddress: input.walletAddress,
            }
        }, null, 2);
    }
    catch (error) {
        throw new Error(`Failed to fetch wallet balances: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}, {
    name: "get_wallet_balances",
    description: "Fetches ERC20 token balances and their USD values for a specified wallet address on StarkNet",
    schema: zod_1.z.object({
        walletAddress: zod_1.z.string().describe("The StarkNet wallet address to check balances for"),
        contractAddresses: zod_1.z
            .array(zod_1.z.string())
            .optional()
            .describe("Optional array of specific token contract addresses to check")
    })
});
// Update exports
exports.defiTransactionsTools = [createTransactionsTool, getWalletBalancesTool];
