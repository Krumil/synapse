"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletBalancesSchema = exports.CreateTransactionSchema = exports.TransactionActionSchema = void 0;
const zod_1 = require("zod");
exports.TransactionActionSchema = zod_1.z.object({
    action: zod_1.z.string().describe("The action to perform, e.g., 'stake', 'unstake', or 'add_liquidity'"),
    amount: zod_1.z.string().optional().describe("The amount to transact, as a string"),
    amountInSmallestUnit: zod_1.z.string().optional().describe("The amount in smallest unit"),
    asset: zod_1.z.string().optional().describe("The asset symbol, e.g., 'ETH'"),
    assetPair: zod_1.z.string().optional().describe("The asset pair for liquidity provision"),
    protocol: zod_1.z.string().describe("The protocol name, e.g., 'Nostra'"),
    userAddress: zod_1.z.string().describe("The user's wallet address")
});
exports.CreateTransactionSchema = zod_1.z.object({
    actions: zod_1.z.union([
        zod_1.z.array(exports.TransactionActionSchema),
        exports.TransactionActionSchema
    ]).describe("Single action or array of actions to perform")
});
exports.WalletBalancesSchema = zod_1.z.object({
    walletAddress: zod_1.z.string().describe("The StarkNet wallet address to check balances for"),
    contractAddresses: zod_1.z.array(zod_1.z.string())
        .optional()
        .describe("Optional array of specific token contract addresses to check")
});
