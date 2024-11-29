import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { hexToDecimalString } from "../utils/defiUtils";

const MEMECOIN_CONTRACT = "0x01a46467a9246f45c8c340f1f155266a26a71c07bd55d36e8d1c7d0d438a2dbc";

// Helper function to convert string to felt252 decimal representation
function stringToFelt252(str: string): string {
	// Convert string to hex first
	let hex = '0x';
	for (let i = 0; i < str.length; i++) {
		hex += str.charCodeAt(i).toString(16);
	}

	// Convert hex to decimal
	return BigInt(hex).toString();
}

const createMemecoinTool = tool(
	async ({
		owner,
		name,
		symbol,
		initialSupply,
		contractAddressSalt
	}: {
		owner: string;
		name: string;
		symbol: string;
		initialSupply: string;
		contractAddressSalt?: string;
	}) => {
		try {
			// Convert owner address to decimal if it's in hex format
			const ownerDecimal = owner.startsWith('0x') ? hexToDecimalString(owner) : owner;

			// Convert name and symbol to felt252 decimal representation
			const nameFelt = stringToFelt252(name);
			const symbolFelt = stringToFelt252(symbol);

			// Generate a random salt if not provided
			const salt = contractAddressSalt || Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString();

			const transaction = {
				contractAddress: MEMECOIN_CONTRACT,
				entrypoint: "create_memecoin",
				calldata: [
					ownerDecimal,
					nameFelt,
					symbolFelt,
					initialSupply,
					"0",
					salt
				]
			};

			return JSON.stringify({
				type: "transaction",
				transactions: [transaction],
				details: {
					action: "create_memecoin",
					owner: owner,
					name: name,
					symbol: symbol,
					initialSupply: initialSupply,
					salt: salt
				}
			}, null, 2);

		} catch (error) {
			throw new Error(`Failed to create memecoin transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	},
	{
		name: "create_memecoin",
		description: "Creates a new memecoin on StarkNet",
		schema: z.object({
			owner: z.string().describe("The owner's address that will receive the initial supply"),
			name: z.string().describe("The name of the memecoin (will be converted to felt252)"),
			symbol: z.string().describe("The symbol of the memecoin (will be converted to felt252)"),
			initialSupply: z.string().describe("The initial supply of tokens (in smallest unit)"),
			contractAddressSalt: z.string().optional().describe("Optional salt for contract address generation")
		})
	}
);

export const memeTools = [createMemecoinTool];