export const ERC20_ABI = [
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
] as const;

export const LP_ABI = [
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
] as const;

export const PRICE_FEED_ABI = [
	{
		name: "get_asset_price",
		type: "function",
		inputs: [
			{ name: "_asset", type: "core::starknet::contract_address::ContractAddress" }
		],
		outputs: [
			{ type: "core::integer::u256" }
		],
		state_mutability: "view"
	}
] as const;

export const STAKING_ABI = [
	{
		name: "token_index",
		type: "function",
		inputs: [],
		outputs: [{ type: "core::integer::u256" }],
		stateMutability: "view"
	}
] as const;

