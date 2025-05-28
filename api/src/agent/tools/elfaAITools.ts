import { tool } from "@langchain/core/tools";
import { z } from "zod";

const ELFA_AI_BASE_URL = "https://api.elfa.ai";
const TWITTER_API_BASE_URL = "https://twitter-x.p.rapidapi.com";

interface ElfaAIMention {
    id: string;
    twitter_id: string;
    twitter_user_id: string;
    content: string;
    mentioned_at: string;
    type: string;
    metrics: {
        like_count: number;
        reply_count: number;
        repost_count: number;
        view_count: number;
    };
    sentiment: string;
}

interface ElfaAIResponse {
    success: boolean;
    data: ElfaAIMention[];
    metadata: {
        total: number;
        cursor?: string;
    };
}

interface TwitterUserInfo {
    id: string;
    username: string;
    name: string;
    profile_image_url: string;
    followers_count: number;
    verified: boolean;
    description: string;
    created_at: string;
}

async function fetchTwitterUserInfo(userId: string): Promise<TwitterUserInfo | null> {
    const rapidApiKey = process.env.RAPIDAPI_KEY;

    if (!rapidApiKey) {
        console.warn("RAPIDAPI_KEY not found, skipping user info fetch");
        return null;
    }

    try {
        const url = `${TWITTER_API_BASE_URL}/user/details?user_id=${userId}`;
        console.log("Fetching user info from:", url);
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "x-rapidapi-key": rapidApiKey,
                "x-rapidapi-host": "twitter-x.p.rapidapi.com",
            },
        });

        if (!response.ok) {
            console.log(response);
            console.warn(`Failed to fetch user info for ${userId}: ${response.status}`);
            return null;
        }

        const data = (await response.json()) as any;
        const user = data?.data?.user?.result;

        if (!user || !user.legacy) {
            return null;
        }

        return {
            id: user.rest_id,
            username: user.legacy.screen_name,
            name: user.legacy.name,
            profile_image_url: user.legacy.profile_image_url_https.replace("_normal", "_bigger"), // Get bigger image
            followers_count: user.legacy.followers_count,
            verified: user.is_blue_verified || user.legacy.verified,
            description: user.legacy.description,
            created_at: user.legacy.created_at,
        };
    } catch (error) {
        console.warn(`Error fetching user info for ${userId}:`, error);
        return null;
    }
}

// Cache for user info to avoid duplicate API calls
const userInfoCache = new Map<string, TwitterUserInfo | null>();

async function fetchStarknetNews(
    keywords: string[] = ["Starknet", "STRK", "$STRK"],
    limit: number = 10,
    days: number = 2
): Promise<ElfaAIResponse> {
    const apiKey = process.env.ELFA_AI_API_KEY;

    if (!apiKey) {
        throw new Error("ELFA_AI_API_KEY environment variable is not set");
    }

    // Validate days parameter
    if (days < 1 || days > 30) {
        throw new Error("Days parameter must be between 1 and 30");
    }

    const to = Math.floor((Date.now() - 60 * 1000) / 1000); // 1 minute ago to avoid future timestamp
    const from = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);

    const keywordsParam = JSON.stringify(keywords);

    const url = `${ELFA_AI_BASE_URL}/v1/mentions/search?keywords=${encodeURIComponent(
        keywordsParam
    )}&limit=${limit}&from=${from}&to=${to}`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "x-elfa-api-key": apiKey,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`API Error Details:`, {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                body: errorBody,
                url: url,
            });
            throw new Error(`Elfa AI API error: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        const data = (await response.json()) as ElfaAIResponse;
        return data;
    } catch (error) {
        console.error("Full error details:", error);
        throw new Error(`Failed to fetch Starknet news: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

const getStarknetNewsTool = tool(
    async ({
        keywords = ["Starknet", "STRK", "$STRK"],
        limit = 10,
        days = 1,
        sortBy = "views",
        includeUserInfo = true,
    }: {
        keywords?: string[];
        limit?: number;
        days?: number;
        sortBy?: "engagement" | "recent" | "views";
        includeUserInfo?: boolean;
    }) => {
        try {
            const response = await fetchStarknetNews(keywords, limit, days);

            let sortedMentions = [...response.data];

            switch (sortBy) {
                case "engagement":
                    sortedMentions.sort((a, b) => {
                        const engagementA = a.metrics.like_count + a.metrics.repost_count + a.metrics.reply_count;
                        const engagementB = b.metrics.like_count + b.metrics.repost_count + b.metrics.reply_count;
                        return engagementB - engagementA;
                    });
                    break;
                case "views":
                    sortedMentions.sort((a, b) => b.metrics.view_count - a.metrics.view_count);
                    break;
                case "recent":
                    sortedMentions.sort(
                        (a, b) => new Date(b.mentioned_at).getTime() - new Date(a.mentioned_at).getTime()
                    );
                    break;
            }

            // Fetch user information for each mention if requested
            const mentionsWithUserInfo = await Promise.all(
                sortedMentions.map(async (mention) => {
                    let userInfo: TwitterUserInfo | null = null;

                    if (includeUserInfo && mention.twitter_user_id) {
                        // Check cache first
                        if (userInfoCache.has(mention.twitter_user_id)) {
                            userInfo = userInfoCache.get(mention.twitter_user_id) || null;
                        } else {
                            // Fetch user info and cache it
                            userInfo = await fetchTwitterUserInfo(mention.twitter_user_id);
                            userInfoCache.set(mention.twitter_user_id, userInfo);
                        }
                    }

                    return {
                        // Preserve all original API data
                        id: mention.id,
                        twitter_id: mention.twitter_id,
                        twitter_user_id: mention.twitter_user_id,
                        content: mention.content,
                        mentioned_at: mention.mentioned_at,
                        type: mention.type,
                        sentiment: mention.sentiment,

                        // Original metrics
                        metrics: {
                            like_count: mention.metrics.like_count,
                            reply_count: mention.metrics.reply_count,
                            repost_count: mention.metrics.repost_count,
                            view_count: mention.metrics.view_count,
                        },

                        // User information (if available)
                        user: userInfo
                            ? {
                                  id: userInfo.id,
                                  username: userInfo.username,
                                  name: userInfo.name,
                                  profile_image_url: userInfo.profile_image_url,
                                  followers_count: userInfo.followers_count,
                                  verified: userInfo.verified,
                                  description: userInfo.description,
                                  account_created: userInfo.created_at,
                              }
                            : null,

                        // Computed fields for frontend convenience
                        computed: {
                            totalEngagement:
                                mention.metrics.like_count + mention.metrics.repost_count + mention.metrics.reply_count,
                            engagementRate:
                                mention.metrics.view_count > 0
                                    ? (
                                          ((mention.metrics.like_count +
                                              mention.metrics.repost_count +
                                              mention.metrics.reply_count) /
                                              mention.metrics.view_count) *
                                          100
                                      ).toFixed(2)
                                    : "0.00",
                            formattedDate: new Date(mention.mentioned_at).toLocaleDateString(),
                            formattedTime: new Date(mention.mentioned_at).toLocaleTimeString(),
                            relativeTime: getRelativeTime(mention.mentioned_at),
                            isHighEngagement:
                                mention.metrics.like_count +
                                    mention.metrics.repost_count +
                                    mention.metrics.reply_count >
                                10,
                            isViral: mention.metrics.view_count > 1000,
                        },
                    };
                })
            );

            const result = {
                type: "starknet_ecosystem_news",
                timestamp: new Date().toISOString(),
                searchKeywords: keywords,
                timeframe: `${days} days`,
                totalResults: response.metadata.total,
                returnedResults: mentionsWithUserInfo.length,
                sortedBy: sortBy,
                cursor: response.metadata.cursor,
                mentions: mentionsWithUserInfo,

                // Include pagination metadata
                metadata: {
                    total: response.metadata.total,
                    cursor: response.metadata.cursor,
                    hasMore: !!response.metadata.cursor,
                    currentPage: Math.ceil(mentionsWithUserInfo.length / limit),
                    estimatedTotalPages: Math.ceil(response.metadata.total / limit),
                },

                // Summary statistics
                summary: {
                    totalMentions: response.metadata.total,
                    returnedMentions: mentionsWithUserInfo.length,
                    sentimentBreakdown: getSentimentBreakdown(sortedMentions),
                    typeBreakdown: getTypeBreakdown(sortedMentions),
                    topEngagement: Math.max(
                        ...sortedMentions.map(
                            (m) => m.metrics.like_count + m.metrics.repost_count + m.metrics.reply_count
                        )
                    ),
                    totalViews: sortedMentions.reduce((sum, m) => sum + m.metrics.view_count, 0),
                    averageEngagement:
                        sortedMentions.length > 0
                            ? (
                                  sortedMentions.reduce(
                                      (sum, m) =>
                                          sum + m.metrics.like_count + m.metrics.repost_count + m.metrics.reply_count,
                                      0
                                  ) / sortedMentions.length
                              ).toFixed(2)
                            : "0.00",
                    usersWithInfo: mentionsWithUserInfo.filter((m) => m.user !== null).length,
                    uniqueUsers: new Set(mentionsWithUserInfo.map((m) => m.twitter_user_id)).size,
                },
            };

            return JSON.stringify(result, null, 2);
        } catch (error) {
            throw new Error(
                `Failed to get Starknet ecosystem news: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    },
    {
        name: "get_starknet_ecosystem_news",
        description:
            "Get recent news and mentions about the Starknet ecosystem from social media, filtered by keywords and sorted by engagement, views, or recency. Includes detailed user information for each mention.",
        schema: z.object({
            keywords: z
                .array(z.string())
                .optional()
                .describe("Keywords to search for (default: ['Starknet', 'STRK', '$STRK'])"),
            limit: z.number().optional().describe("Maximum number of results to return (default: 10, max: 100)"),
            days: z.number().optional().describe("Number of days to look back (default: 7, max: 30)"),
            sortBy: z
                .enum(["engagement", "recent", "views"])
                .optional()
                .describe("Sort results by total engagement, recency, or view count (default: engagement)"),
            includeUserInfo: z
                .boolean()
                .optional()
                .describe("Whether to fetch detailed user information for each mention (default: true)"),
        }),
    }
);

function getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

function getSentimentBreakdown(mentions: ElfaAIMention[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    mentions.forEach((mention) => {
        const sentiment = mention.sentiment || "unknown";
        breakdown[sentiment] = (breakdown[sentiment] || 0) + 1;
    });
    return breakdown;
}

function getTypeBreakdown(mentions: ElfaAIMention[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    mentions.forEach((mention) => {
        breakdown[mention.type] = (breakdown[mention.type] || 0) + 1;
    });
    return breakdown;
}

export const elfaAITools = [getStarknetNewsTool];
