import { tool } from "@langchain/core/tools";
import { z } from "zod";
import Parser from "rss-parser";

const parser = new Parser();

const getStarknetBlogFeedTool = tool(
    async ({ limit = 5 }: { limit?: number }) => {
        try {
            const feedUrl = "https://www.starknet.io/blog/rss.xml";
            const feed = await parser.parseURL(feedUrl);

            const items = feed.items.slice(0, limit).map((item) => ({
                title: item.title || "",
                link: item.link || "",
                pubDate: item.pubDate || "",
                content: item.contentSnippet?.substring(0, 200) + "..." || "",
            }));

            return JSON.stringify(
                {
                    source: "Starknet Blog",
                    url: feedUrl,
                    timestamp: new Date().toISOString(),
                    items: items,
                },
                null,
                2
            );
        } catch (error) {
            throw new Error(
                `Failed to fetch Starknet blog feed: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    },
    {
        name: "get_starknet_blog_feed",
        description:
            "Get the latest posts from the official Starknet blog, which contains official releases, roadmap updates, and ecosystem round-ups",
        schema: z.object({
            limit: z.number().optional().describe("Maximum number of blog posts to return (default: 5)"),
        }),
    }
);

const getStarknetDevNewsletterTool = tool(
    async ({ limit = 5 }: { limit?: number }) => {
        try {
            const feedUrl = "https://starknet-research.beehiiv.com/feed";
            const feed = await parser.parseURL(feedUrl);

            const items = feed.items.slice(0, limit).map((item) => ({
                title: item.title || "",
                link: item.link || "",
                pubDate: item.pubDate || "",
                content: item.contentSnippet?.substring(0, 200) + "..." || "",
            }));

            return JSON.stringify(
                {
                    source: "Starknet Dev Newsletter",
                    url: feedUrl,
                    timestamp: new Date().toISOString(),
                    items: items,
                },
                null,
                2
            );
        } catch (error) {
            throw new Error(
                `Failed to fetch Starknet Dev Newsletter: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    },
    {
        name: "get_starknet_dev_newsletter",
        description:
            "Get the latest issues of the Starknet Dev Newsletter, which contains Cairo tips, dev-tool releases, and hackathon winners",
        schema: z.object({
            limit: z.number().optional().describe("Maximum number of newsletter issues to return (default: 5)"),
        }),
    }
);

const getStarknetStatusTool = tool(
    async ({ limit = 5 }: { limit?: number }) => {
        try {
            const feedUrl = "https://status.starknet.io/history.rss";
            const feed = await parser.parseURL(feedUrl);

            const items = feed.items.slice(0, limit).map((item) => ({
                title: item.title || "",
                link: item.link || "",
                pubDate: item.pubDate || "",
                content: item.contentSnippet?.substring(0, 200) + "..." || "",
            }));

            return JSON.stringify(
                {
                    source: "Starknet Status",
                    url: feedUrl,
                    timestamp: new Date().toISOString(),
                    status: items.length > 0 ? "Incidents found" : "No recent incidents",
                    items: items,
                },
                null,
                2
            );
        } catch (error) {
            throw new Error(
                `Failed to fetch Starknet Status feed: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    },
    {
        name: "get_starknet_status",
        description: "Get the latest network status updates from Starknet, including uptime and maintenance alerts",
        schema: z.object({
            limit: z.number().optional().describe("Maximum number of status updates to return (default: 5)"),
        }),
    }
);

export const starknetFeedsTools = [getStarknetBlogFeedTool, getStarknetDevNewsletterTool, getStarknetStatusTool];
