import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { RpcProvider, constants } from "starknet";
import { Factory, EkuboLaunchData, constants as unruggableConstants } from "@unruggable_starknet/core";
import { parseFormatedPercentage } from "../utils/defiUtils";

if (!process.env.ALCHEMY_API_ENDPOINT || !process.env.ALCHEMY_API_KEY) {
	throw new Error("Alchemy API configuration is missing");
}

const ALCHEMY_API_ENDPOINT = process.env.ALCHEMY_API_ENDPOINT + process.env.ALCHEMY_API_KEY;
const provider = new RpcProvider({ nodeUrl: ALCHEMY_API_ENDPOINT });

const chainId = constants.StarknetChainId.SN_MAIN
const factory = new Factory({ provider, chainId });
const QUOTE_TOKENS_ADDRESS = {
	ETH: "0x049D36570D4e46f48e99674bd3fcc84644DdD6b96F7C741B1562B82f9e004dC7",
	STARK:
		"0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D",
	USDC:
		"0x053C91253BC9682c04929cA02ED00b3E423f6710D2ee7e0D5EBB06F3eCF368A8",
};

const createMemecoinTool = tool(
	async ({ owner, name, symbol, initialSupply }) => {
		try {
			// Prepare deployment data
			const data = {
				owner,
				name,
				symbol,
				initialSupply,
			};

			// Use the SDK's method to get deployment calldata and token address
			const { tokenAddress, calls } = factory.getDeployCalldata(data);

			// Return the transaction details and token address
			return JSON.stringify(
				{
					type: "transaction",
					transactions: calls,
					tokenAddress: tokenAddress,
					details: {
						action: "create_memecoin",
						owner,
						name,
						symbol,
						initialSupply,
					},
				},
				null,
				2
			);
		} catch (error) {
			throw new Error(
				`Failed to create memecoin: ${error instanceof Error ? error.message : "Unknown error"
				}`
			);
		}
	},
	{
		name: "create_memecoin",
		description:
			"Creates a new memecoin on StarkNet and returns the calculated memecoin address",
		schema: z.object({
			owner: z
				.string()
				.describe("The owner's address that will receive the initial supply"),
			name: z.string().describe("The name of the memecoin"),
			symbol: z.string().describe("The symbol of the memecoin"),
			initialSupply: z
				.string()
				.describe(
					"The initial supply of tokens (as a string representing a big integer between 1 and 10^10)"
				),
		}),
	}
);

const launchMemecoinTool = tool(
	async ({
		memecoinAddress,
		teamAllocations = [],
		holdLimit,
		antiBotDuration,
		ekuboFee,
		quoteToken,
		startingMarketCap,
	}) => {
		try {
			// Retrieve the Memecoin object
			const memecoin = await factory.getMemecoin(memecoinAddress);
			if (!memecoin) {
				throw new Error(`Memecoin at address ${memecoinAddress} not found or is not a memecoin.`);
			}
			// Convert teamAllocations to the expected format
			const formattedTeamAllocations = teamAllocations.map(({ address, amount }) => ({
				address,
				amount: amount
			}));

			const quoteTokenAddress = QUOTE_TOKENS_ADDRESS[quoteToken];
			const quoteTokenObj = unruggableConstants.QUOTE_TOKENS[chainId][quoteTokenAddress];

			// Prepare the launch data
			const data: EkuboLaunchData = {
				amm: unruggableConstants.AMM.EKUBO,
				antiBotPeriod: parseInt(antiBotDuration || "86400"), // Ensure it's a number
				fees: parseFormatedPercentage(ekuboFee || "0"),
				holdLimit: parseFormatedPercentage(holdLimit || "0"),
				quoteToken: quoteTokenObj,
				startingMarketCap: startingMarketCap, // Ensure this is a string representing USD value
				teamAllocations: formattedTeamAllocations,
			};

			// Use the SDK's method to get launch calldata
			const { calls } = await factory.getEkuboLaunchCalldata(memecoin, data);

			// Return the transaction details
			return JSON.stringify(
				{
					type: "transaction",
					transactions: calls,
					details: {
						action: "launch_memecoin",
						memecoinAddress,
						teamAllocations,
						holdLimit,
						antiBotDuration,
						ekuboFee,
						quoteToken,
						totalSupply: memecoin.totalSupply,
						startingMarketCap,
					},
				},
				null,
				2
			);
		} catch (error) {
			throw new Error(
				`Failed to launch memecoin: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	},
	{
		name: "launch_memecoin",
		description:
			"Launches a memecoin on the Ekubo exchange. Suggested parameters: Hold Limit: 5% per wallet, Anti-Bot Duration: 1 hour (3600 seconds), Ekubo Fee: 0.3%, Quote Token: ETH, Starting Market Cap: $10,000",
		schema: z.object({
			memecoinAddress: z.string().describe("The address of the memecoin to launch"),
			teamAllocations: z
				.array(
					z.object({
						address: z.string().describe("The address to allocate tokens to"),
						amount: z.string().describe("The amount of tokens to allocate to the address in units not percentage"),
					})
				)
				.optional(),
			holdLimit: z.string().optional().describe("The hold limit for the memecoin in percentage, suggested: 5% per wallet"),
			antiBotDuration: z.string().optional().describe("The duration of the anti-bot period in seconds, suggested: 1 hour (3600 seconds)"),
			ekuboFee: z.string().optional().describe("The ekubo fee for the memecoin, suggested: 0.3%"),
			quoteToken: z.enum(["ETH", "STARK", "USDC"]).describe("The quote token for the memecoin, suggested: ETH"),
			startingMarketCap: z.string().describe("Starting market cap in USD, suggested: $10,000"),
		}),
	}
);

export const memeTools = [createMemecoinTool, launchMemecoinTool];