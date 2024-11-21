"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LP_ABI = exports.ERC20_ABI = void 0;
exports.ERC20_ABI = [
    {
        name: "balanceOf",
        type: "function",
        inputs: [{ name: "account", type: "felt" }],
        outputs: [{ name: "balance", type: "Uint256" }],
        stateMutability: "view"
    },
    {
        name: "decimals",
        type: "function",
        inputs: [],
        outputs: [{ name: "decimals", type: "felt" }],
        stateMutability: "view"
    }
];
exports.LP_ABI = [
    {
        name: "get_reserves",
        type: "function",
        inputs: [],
        outputs: [
            { name: "reserve0", type: "(felt, felt)" }, // Uint256 is represented as (low, high)
            { name: "reserve1", type: "(felt, felt)" } // Uint256 is represented as (low, high)
        ],
        stateMutability: "view"
    },
    {
        name: "total_supply",
        type: "function",
        inputs: [],
        outputs: [{ name: "supply", type: "(felt, felt)" }], // Uint256 is represented as (low, high)
        stateMutability: "view"
    }
];
