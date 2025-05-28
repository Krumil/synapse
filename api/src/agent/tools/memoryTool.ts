import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Define the improved structure for user memory
interface UserMemory {
    profile: {
        experienceLevel?: string;
        walletType?: string;
        preferredChains?: string[];
    };
    investmentPreferences: {
        riskTolerance?: string;
        investmentGoals?: string[];
        preferredProtocols?: string[];
        investmentAmount?: string;
    };
    transactionHistory: {
        recentActivities?: string[];
        frequentProtocols?: string[];
        lastTransactionDate?: string;
    };
    learningProgress: {
        topicsOfInterest?: string[];
        knowledgeAreas?: string[];
        questionsAsked?: string[];
    };
    context: {
        currentSession?: Record<string, any>;
        recentTopics?: string[];
        lastInteraction?: string;
    };
    metadata: {
        createdAt: string;
        lastUpdated: string;
        version: string;
    };
}

// Store user memory with userId as key
const userMemoryStore: Map<string, UserMemory> = new Map();

// Key normalization mapping to prevent duplicates
const keyMappings: Record<string, { category: keyof Omit<UserMemory, "metadata">; field: string }> = {
    // Profile mappings
    experience_level: { category: "profile", field: "experienceLevel" },
    experience: { category: "profile", field: "experienceLevel" },
    user_experience: { category: "profile", field: "experienceLevel" },
    wallet_type: { category: "profile", field: "walletType" },
    preferred_chains: { category: "profile", field: "preferredChains" },
    chains: { category: "profile", field: "preferredChains" },

    // Investment preferences mappings
    risk_tolerance: { category: "investmentPreferences", field: "riskTolerance" },
    risk_level: { category: "investmentPreferences", field: "riskTolerance" },
    risk_preference: { category: "investmentPreferences", field: "riskTolerance" },
    investment_goals: { category: "investmentPreferences", field: "investmentGoals" },
    goals: { category: "investmentPreferences", field: "investmentGoals" },
    investment_goal: { category: "investmentPreferences", field: "investmentGoals" },
    preferred_protocols: { category: "investmentPreferences", field: "preferredProtocols" },
    protocols: { category: "investmentPreferences", field: "preferredProtocols" },
    investment_amount: { category: "investmentPreferences", field: "investmentAmount" },
    amount: { category: "investmentPreferences", field: "investmentAmount" },

    // Transaction history mappings
    recent_activities: { category: "transactionHistory", field: "recentActivities" },
    activities: { category: "transactionHistory", field: "recentActivities" },
    frequent_protocols: { category: "transactionHistory", field: "frequentProtocols" },
    last_transaction: { category: "transactionHistory", field: "lastTransactionDate" },

    // Learning progress mappings
    topics_of_interest: { category: "learningProgress", field: "topicsOfInterest" },
    interests: { category: "learningProgress", field: "topicsOfInterest" },
    knowledge_areas: { category: "learningProgress", field: "knowledgeAreas" },
    knowledge: { category: "learningProgress", field: "knowledgeAreas" },
    questions_asked: { category: "learningProgress", field: "questionsAsked" },

    // Context mappings
    current_session: { category: "context", field: "currentSession" },
    recent_topics: { category: "context", field: "recentTopics" },
    topics: { category: "context", field: "recentTopics" },
};

// Validation for known values
const validValues = {
    experienceLevel: ["beginner", "intermediate", "advanced", "expert"],
    riskTolerance: ["very_low", "low", "medium", "high", "very_high"],
    investmentGoals: ["yield_farming", "trading", "holding", "staking", "lending", "arbitrage", "nft"],
};

function normalizeKey(key: string): { category: keyof Omit<UserMemory, "metadata">; field: string } | null {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    return keyMappings[normalizedKey] || null;
}

function validateValue(field: string, value: any): any {
    if (field === "experienceLevel" && typeof value === "string") {
        const normalized = value.toLowerCase();
        return validValues.experienceLevel.includes(normalized) ? normalized : value;
    }
    if (field === "riskTolerance" && typeof value === "string") {
        const normalized = value.toLowerCase();
        return validValues.riskTolerance.includes(normalized) ? normalized : value;
    }
    if (field === "investmentGoals") {
        if (typeof value === "string") {
            return [value];
        }
        return Array.isArray(value) ? value : [value];
    }
    if (field.includes("protocols") || field.includes("chains") || field.includes("activities")) {
        if (typeof value === "string") {
            return [value];
        }
        return Array.isArray(value) ? value : [value];
    }
    return value;
}

function initializeUserMemory(): UserMemory {
    return {
        profile: {},
        investmentPreferences: {},
        transactionHistory: {},
        learningProgress: {},
        context: {},
        metadata: {
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            version: "2.0",
        },
    };
}

const memoryToolSchema = z.object({
    userId: z.string().describe("User's wallet address"),
    action: z
        .enum(["save", "retrieve", "summary", "update"])
        .describe("Action to perform: save new info, retrieve all, get summary, or update existing"),
    key: z.string().optional().describe("The key for the specific information to save/update"),
    value: z.any().optional().describe("The value to save (only needed for save/update actions)"),
    category: z.string().optional().describe("Specific category to retrieve (profile, investmentPreferences, etc.)"),
    existingMemory: z.record(z.any()).optional().describe("Existing memory from local storage"),
});

export const memoryTool = tool(
    async ({ userId, action, key, value, category, existingMemory }) => {
        try {
            // Initialize or update memory from existing storage
            if (existingMemory && !userMemoryStore.has(userId)) {
                const migratedMemory = initializeUserMemory();

                // Migrate old format to new format
                if (existingMemory.preferences || existingMemory.importantInfo) {
                    const oldData = { ...existingMemory.preferences, ...existingMemory.importantInfo };
                    for (const [oldKey, oldValue] of Object.entries(oldData)) {
                        const mapping = normalizeKey(oldKey);
                        if (mapping) {
                            const validatedValue = validateValue(mapping.field, oldValue);
                            (migratedMemory[mapping.category] as any)[mapping.field] = validatedValue;
                        }
                    }
                }

                migratedMemory.metadata.lastUpdated = new Date().toISOString();
                userMemoryStore.set(userId, migratedMemory);
            }

            // Get or initialize user memory
            let userMemory = userMemoryStore.get(userId) || initializeUserMemory();

            switch (action) {
                case "save":
                case "update":
                    if (!key || value === undefined) {
                        return JSON.stringify({
                            type: "error",
                            message: "Key and value are required for save/update actions",
                        });
                    }

                    const mapping = normalizeKey(key);
                    if (!mapping) {
                        return JSON.stringify({
                            type: "error",
                            message: `Unknown key: ${key}. Please use a recognized field name.`,
                        });
                    }

                    const validatedValue = validateValue(mapping.field, value);
                    const categoryData = userMemory[mapping.category] as any;

                    // For array fields, merge instead of replace if updating
                    if (
                        action === "update" &&
                        Array.isArray(categoryData[mapping.field]) &&
                        Array.isArray(validatedValue)
                    ) {
                        const existing = categoryData[mapping.field] || [];
                        const merged = [...new Set([...existing, ...validatedValue])];
                        categoryData[mapping.field] = merged;
                    } else {
                        categoryData[mapping.field] = validatedValue;
                    }

                    userMemory.metadata.lastUpdated = new Date().toISOString();
                    userMemoryStore.set(userId, userMemory);

                    console.log(`Memory ${action}d:`, {
                        category: mapping.category,
                        field: mapping.field,
                        value: validatedValue,
                    });

                    return JSON.stringify({
                        type: "memory_update",
                        status: "success",
                        memory: userMemory,
                        message: `Successfully ${action}d ${mapping.field} in ${mapping.category}`,
                    });

                case "retrieve":
                    if (category) {
                        const categoryData = userMemory[category as keyof UserMemory];
                        return JSON.stringify({
                            type: "memory_retrieve",
                            status: "success",
                            memory: { [category]: categoryData },
                            message: `Retrieved ${category} successfully`,
                        });
                    }

                    return JSON.stringify({
                        type: "memory_retrieve",
                        status: "success",
                        memory: userMemory,
                        message: "Memory retrieved successfully",
                    });

                case "summary":
                    const summary = {
                        userId,
                        profile: {
                            experience: userMemory.profile.experienceLevel || "unknown",
                            chains: userMemory.profile.preferredChains?.length || 0,
                        },
                        preferences: {
                            riskLevel: userMemory.investmentPreferences.riskTolerance || "unknown",
                            goals: userMemory.investmentPreferences.investmentGoals?.length || 0,
                            protocols: userMemory.investmentPreferences.preferredProtocols?.length || 0,
                        },
                        activity: {
                            recentActivities: userMemory.transactionHistory.recentActivities?.length || 0,
                            lastUpdate: userMemory.metadata.lastUpdated,
                        },
                        learning: {
                            interests: userMemory.learningProgress.topicsOfInterest?.length || 0,
                            knowledge: userMemory.learningProgress.knowledgeAreas?.length || 0,
                        },
                    };

                    return JSON.stringify({
                        type: "memory_summary",
                        status: "success",
                        summary,
                        message: "User memory summary generated",
                    });

                default:
                    return JSON.stringify({
                        type: "error",
                        message: "Invalid action. Use save, retrieve, summary, or update.",
                    });
            }
        } catch (error: any) {
            console.error("Error in memoryTool:", error);
            return JSON.stringify({
                type: "error",
                message: error.message,
                memory: null,
            });
        }
    },
    {
        name: "MemoryTool",
        description:
            "Advanced user memory management with intelligent categorization, deduplication, and tailored storage for DeFi users",
        schema: memoryToolSchema,
    }
);

export const memoryTools = [memoryTool];
