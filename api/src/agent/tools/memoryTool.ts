import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Define the structure for user memory
interface UserMemory {
	preferences: Record<string, any>;
	importantInfo: Record<string, any>;
	lastUpdated: string;
}

// Store user memory with userId as key
const userMemoryStore: Map<string, UserMemory> = new Map();

const memoryToolSchema = z.object({
	userId: z.string().describe("User's wallet address"),
	action: z.enum(["save", "retrieve"]).describe("Whether to save or retrieve memory"),
	key: z.string().describe("The key for the specific information to save/retrieve"),
	value: z.any().optional().describe("The value to save (only needed for save action)"),
	existingMemory: z.record(z.any()).optional().describe("Existing memory from local storage"),
});

export const memoryTool = tool(
	async ({ userId, action, key, value, existingMemory }) => {
		try {
			// Initialize or update memory from existing storage
			if (existingMemory && !userMemoryStore.has(userId)) {
				userMemoryStore.set(userId, {
					preferences: existingMemory.preferences || {},
					importantInfo: existingMemory.importantInfo || {},
					lastUpdated: existingMemory.lastUpdated || new Date().toISOString()
				});
			}

			// Get or initialize user memory
			let userMemory = userMemoryStore.get(userId) || {
				preferences: {},
				importantInfo: {},
				lastUpdated: new Date().toISOString()
			};

			if (action === "save") {
				// Determine if the key belongs to preferences or important info
				const category = key.startsWith("pref_") ? "preferences" : "importantInfo";
				const cleanKey = key.replace(/^(pref_|info_)/, "");

				userMemory[category][cleanKey] = value;
				userMemory.lastUpdated = new Date().toISOString();
				userMemoryStore.set(userId, userMemory);

				return JSON.stringify({
					type: "memory_update",
					status: "success",
					memory: userMemory,
					message: `Successfully saved ${cleanKey} to ${category}`
				});
			} else {
				// Retrieve all memory for the user
				return JSON.stringify({
					type: "memory_retrieve",
					status: "success",
					memory: userMemory || null,
					message: userMemory ? "Memory retrieved successfully" : "No memory found for user"
				});
			}

		} catch (error: any) {
			console.error("Error in memoryTool:", error);
			return JSON.stringify({
				type: "error",
				message: error.message,
				memory: null
			});
		}
	},
	{
		name: "MemoryTool",
		description: "Save or retrieve user-specific information between sessions",
		schema: memoryToolSchema,
	}
);

export const memoryTools = [memoryTool];