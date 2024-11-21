"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryTools = exports.memoryTool = void 0;
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
// Store user memory with userId as key
const userMemoryStore = new Map();
const memoryToolSchema = zod_1.z.object({
    userId: zod_1.z.string().describe("User's wallet address"),
    action: zod_1.z.enum(["save", "retrieve"]).describe("Whether to save or retrieve memory"),
    key: zod_1.z.string().describe("The key for the specific information to save/retrieve"),
    value: zod_1.z.any().optional().describe("The value to save (only needed for save action)"),
    existingMemory: zod_1.z.record(zod_1.z.any()).optional().describe("Existing memory from local storage"),
});
exports.memoryTool = (0, tools_1.tool)(async ({ userId, action, key, value, existingMemory }) => {
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
        }
        else {
            // Retrieve all memory for the user
            return JSON.stringify({
                type: "memory_retrieve",
                status: "success",
                memory: userMemory || null,
                message: userMemory ? "Memory retrieved successfully" : "No memory found for user"
            });
        }
    }
    catch (error) {
        console.error("Error in memoryTool:", error);
        return JSON.stringify({
            type: "error",
            message: error.message,
            memory: null
        });
    }
}, {
    name: "MemoryTool",
    description: "Save or retrieve user-specific information between sessions",
    schema: memoryToolSchema,
});
exports.memoryTools = [exports.memoryTool];
