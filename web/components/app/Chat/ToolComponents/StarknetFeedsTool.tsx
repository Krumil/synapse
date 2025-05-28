import { useState, ReactNode, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, MessageCircle, Repeat2, Eye, ExternalLink } from "lucide-react";

interface FeedItem {
    title: string;
    link: string;
    pubDate: string;
    content: string;
}

interface Feed {
    source: string;
    url: string;
    timestamp: string;
    items: FeedItem[];
    status?: string;
}

interface TweetAuthor {
    username: string;
    name: string;
    followers: number;
    verified: boolean;
}

interface TweetEngagement {
    likes: number;
    retweets: number;
    replies: number;
    quotes: number;
    views: number;
    totalEngagement: number;
}

interface Tweet {
    id: number;
    text: string;
    author: TweetAuthor;
    createdAt: string;
    engagement: TweetEngagement;
    hashtags: string[];
    mentions: string[];
    urls: string[];
}

interface SocialMediaFeed {
    type: string;
    timestamp: string;
    searchKeywords: string[];
    timeframe: string;
    totalResults: number;
    returnedResults: number;
    sortedBy: string;
    mentions: Tweet[];
}

interface StarknetFeedsToolProps {
    data: {
        type: string;
        feedType?: string;
        starknetBlogFeed?: Feed;
        starknetDevNewsletter?: Feed;
        starknetStatus?: Feed;
        // New social media properties
        timestamp?: string;
        searchKeywords?: string[];
        timeframe?: string;
        totalResults?: number;
        returnedResults?: number;
        sortedBy?: string;
        mentions?: Tweet[];
        content?: any;
    };
    contentString?: string;
    onAddToGrid?: (component: ReactNode, header?: ReactNode) => void;
}

export function StarknetFeedsTool({ data, contentString = "", onAddToGrid }: StarknetFeedsToolProps) {
    const [activeTab, setActiveTab] = useState<string>("social");

    // Try to parse content string if feeds aren't in the data object directly
    const parsedFeeds: Record<string, Feed> = {};
    let socialMediaData: SocialMediaFeed | null = null;

    // First check if data.content contains the social media data
    if (data.content && typeof data.content === "object") {
        if (data.content.type === "starknet_ecosystem_news" && data.content.mentions) {
            socialMediaData = data.content as SocialMediaFeed;
        }
    }

    // Check if we have social media data directly in the data prop
    if (!socialMediaData && data.mentions && data.type === "starknet_ecosystem_news") {
        socialMediaData = data as SocialMediaFeed;
    }

    try {
        if (!socialMediaData && contentString) {
            const parsed = JSON.parse(contentString);

            // Check if it's social media data
            if (parsed.type === "starknet_ecosystem_news" && parsed.mentions) {
                socialMediaData = parsed;
            } else {
                // Handle RSS feed data
                if (parsed.starknetBlogFeed) parsedFeeds.starknetBlogFeed = parsed.starknetBlogFeed;
                if (parsed.starknetDevNewsletter) parsedFeeds.starknetDevNewsletter = parsed.starknetDevNewsletter;
                if (parsed.starknetStatus) parsedFeeds.starknetStatus = parsed.starknetStatus;

                // If parsing found a single feed, set active tab appropriately
                if (parsed.source) {
                    if (parsed.source.includes("Blog")) parsedFeeds.starknetBlogFeed = parsed;
                    else if (parsed.source.includes("Newsletter")) parsedFeeds.starknetDevNewsletter = parsed;
                    else if (parsed.source.includes("Status")) parsedFeeds.starknetStatus = parsed;
                }
            }
        }
    } catch (e) {
        console.error("Failed to parse content string:", e);
    }

    // Use either the data object or the parsed content
    const blogFeed = data.starknetBlogFeed || parsedFeeds.starknetBlogFeed;
    const devNewsletter = data.starknetDevNewsletter || parsedFeeds.starknetDevNewsletter;
    const statusFeed = data.starknetStatus || parsedFeeds.starknetStatus;

    // Set default active tab based on available data
    useEffect(() => {
        if (socialMediaData) setActiveTab("social");
        else if (blogFeed) setActiveTab("blog");
        else if (devNewsletter) setActiveTab("newsletter");
        else if (statusFeed) setActiveTab("status");
    }, [socialMediaData, blogFeed, devNewsletter, statusFeed]);

    // Calculate number of available tabs for dynamic grid layout
    const availableTabs = [socialMediaData ? 1 : 0, blogFeed ? 1 : 0, devNewsletter ? 1 : 0, statusFeed ? 1 : 0].reduce(
        (sum, count) => sum + count,
        0
    );

    // Format date nicely
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch (e) {
            return dateString;
        }
    };

    // Format engagement numbers
    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
        if (num >= 1000) return (num / 1000).toFixed(1) + "K";
        return num.toString();
    };

    // Truncate long tweet text
    const truncateText = (text: string, maxLength: number = 280) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    };

    const handleAddToGrid = () => {
        if (onAddToGrid) {
            // Create a simplified version of the component for the grid
            onAddToGrid(
                <Card className="w-full h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M4 11a9 9 0 0 1 9 9" />
                                <path d="M4 4a16 16 0 0 1 16 16" />
                                <circle cx="5" cy="19" r="1" />
                            </svg>
                            Starknet Feeds
                        </CardTitle>
                        <CardDescription>Latest updates from the Starknet ecosystem</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-full" style={{ maxHeight: "300px" }}>
                            <div className="space-y-4 pr-4">
                                {socialMediaData &&
                                    socialMediaData.mentions.slice(0, 3).map((tweet, idx) => (
                                        <Card key={idx} className="p-3">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                    {tweet.author.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium text-sm truncate">
                                                            @{tweet.author.username.slice(0, 10)}...
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDate(tweet.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-foreground mb-2">
                                                        {truncateText(tweet.text, 120)}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Heart className="w-3 h-3" />
                                                            {formatNumber(tweet.engagement.likes)}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Repeat2 className="w-3 h-3" />
                                                            {formatNumber(tweet.engagement.retweets)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>,
                "Starknet Feeds"
            );
        }
    };

    // If no data is available, show a message
    if (!blogFeed && !devNewsletter && !statusFeed && !socialMediaData) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Starknet Feeds</CardTitle>
                    <CardDescription>No feed data available</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="w-full">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M4 11a9 9 0 0 1 9 9" />
                            <path d="M4 4a16 16 0 0 1 16 16" />
                            <circle cx="5" cy="19" r="1" />
                        </svg>
                        Starknet Feeds
                    </CardTitle>
                    <CardDescription>
                        {socialMediaData
                            ? `Latest social mentions (${socialMediaData.returnedResults} of ${socialMediaData.totalResults} results)`
                            : "Latest updates from the Starknet ecosystem"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className={`grid w-full grid-cols-${availableTabs}`}>
                            {socialMediaData && (
                                <TabsTrigger value="social">
                                    Social
                                    <Badge variant="outline" className="ml-2">
                                        {socialMediaData.mentions.length}
                                    </Badge>
                                </TabsTrigger>
                            )}
                            <TabsTrigger value="blog" disabled={!blogFeed}>
                                Blog
                                {blogFeed && blogFeed.items.length > 0 && (
                                    <Badge variant="outline" className="ml-2">
                                        {blogFeed.items.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="newsletter" disabled={!devNewsletter}>
                                Newsletter
                                {devNewsletter && devNewsletter.items.length > 0 && (
                                    <Badge variant="outline" className="ml-2">
                                        {devNewsletter.items.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="status" disabled={!statusFeed}>
                                Status
                                {statusFeed && statusFeed.status && (
                                    <Badge
                                        variant={statusFeed.status.includes("No") ? "outline" : "destructive"}
                                        className="ml-2"
                                    >
                                        {statusFeed.status.includes("No") ? "OK" : "!"}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        {socialMediaData && (
                            <TabsContent value="social" className="mt-4">
                                <div className="mb-4">
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {socialMediaData.searchKeywords.map((keyword, idx) => (
                                            <Badge key={idx} variant="secondary" className="text-xs">
                                                {keyword}
                                            </Badge>
                                        ))}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Timeframe: {socialMediaData.timeframe} • Sorted by: {socialMediaData.sortedBy}
                                    </p>
                                </div>

                                <ScrollArea className="h-full" style={{ maxHeight: "500px" }}>
                                    <div className="space-y-4 pr-4">
                                        {socialMediaData.mentions.map((tweet, idx) => (
                                            <motion.div
                                                key={tweet.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: idx * 0.1 }}
                                            >
                                                <Card className="p-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                                            {tweet.author.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="font-medium truncate">
                                                                    @{tweet.author.username}
                                                                </span>
                                                                {tweet.author.verified && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        ✓
                                                                    </Badge>
                                                                )}
                                                                <span className="text-sm text-muted-foreground">
                                                                    {formatNumber(tweet.author.followers)} followers
                                                                </span>
                                                                <span className="text-sm text-muted-foreground">•</span>
                                                                <span className="text-sm text-muted-foreground">
                                                                    {formatDate(tweet.createdAt)}
                                                                </span>
                                                            </div>

                                                            <p className="text-foreground mb-3 whitespace-pre-wrap">
                                                                {tweet.text}
                                                            </p>

                                                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                                                <span className="flex items-center gap-1 hover:text-red-500 transition-colors">
                                                                    <Heart className="w-4 h-4" />
                                                                    {formatNumber(tweet.engagement.likes)}
                                                                </span>
                                                                <span className="flex items-center gap-1 hover:text-green-500 transition-colors">
                                                                    <Repeat2 className="w-4 h-4" />
                                                                    {formatNumber(tweet.engagement.retweets)}
                                                                </span>
                                                                <span className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                                                                    <MessageCircle className="w-4 h-4" />
                                                                    {formatNumber(tweet.engagement.replies)}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Eye className="w-4 h-4" />
                                                                    {formatNumber(tweet.engagement.views)}
                                                                </span>
                                                            </div>

                                                            {tweet.hashtags.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mt-2">
                                                                    {tweet.hashtags.map((hashtag, hashIdx) => (
                                                                        <Badge
                                                                            key={hashIdx}
                                                                            variant="outline"
                                                                            className="text-xs"
                                                                        >
                                                                            #{hashtag}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        )}

                        {blogFeed && (
                            <TabsContent value="blog" className="mt-4">
                                <ScrollArea className="h-full" style={{ maxHeight: "500px" }}>
                                    <div className="space-y-4 pr-4">
                                        {blogFeed.items.map((item, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: idx * 0.1 }}
                                            >
                                                <Card>
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-base">{item.title}</CardTitle>
                                                        <CardDescription>{formatDate(item.pubDate)}</CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="pb-2">
                                                        <p className="text-sm text-muted-foreground">{item.content}</p>
                                                    </CardContent>
                                                    <CardFooter>
                                                        <Button variant="outline" size="sm" asChild>
                                                            <a
                                                                href={item.link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                Read More
                                                            </a>
                                                        </Button>
                                                    </CardFooter>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        )}

                        {devNewsletter && (
                            <TabsContent value="newsletter" className="mt-4">
                                <ScrollArea className="h-full" style={{ maxHeight: "500px" }}>
                                    <div className="space-y-4 pr-4">
                                        {devNewsletter.items.map((item, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: idx * 0.1 }}
                                            >
                                                <Card>
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-base">{item.title}</CardTitle>
                                                        <CardDescription>{formatDate(item.pubDate)}</CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="pb-2">
                                                        <p className="text-sm text-muted-foreground">{item.content}</p>
                                                    </CardContent>
                                                    <CardFooter>
                                                        <Button variant="outline" size="sm" asChild>
                                                            <a
                                                                href={item.link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                Read More
                                                            </a>
                                                        </Button>
                                                    </CardFooter>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        )}

                        {statusFeed && (
                            <TabsContent value="status" className="mt-4">
                                <div className="mb-4">
                                    <Card className="bg-muted">
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-center">
                                                <CardTitle className="text-base">Current Status</CardTitle>
                                                <Badge
                                                    variant={
                                                        statusFeed.status?.includes("No") ? "outline" : "destructive"
                                                    }
                                                >
                                                    {statusFeed.status?.includes("No")
                                                        ? "All Systems Operational"
                                                        : "Issues Detected"}
                                                </Badge>
                                            </div>
                                            <CardDescription>
                                                Last updated: {formatDate(statusFeed.timestamp)}
                                            </CardDescription>
                                        </CardHeader>
                                    </Card>
                                </div>

                                <ScrollArea className="h-full" style={{ maxHeight: "400px" }}>
                                    <div className="space-y-4 pr-4">
                                        {statusFeed.items.length > 0 ? (
                                            statusFeed.items.map((item, idx) => (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                                                >
                                                    <Card>
                                                        <CardHeader className="pb-2">
                                                            <CardTitle className="text-base">{item.title}</CardTitle>
                                                            <CardDescription>
                                                                {formatDate(item.pubDate)}
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="pb-2">
                                                            <p className="text-sm text-muted-foreground">
                                                                {item.content}
                                                            </p>
                                                        </CardContent>
                                                        <CardFooter>
                                                            <Button variant="outline" size="sm" asChild>
                                                                <a
                                                                    href={item.link}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    View Details
                                                                </a>
                                                            </Button>
                                                        </CardFooter>
                                                    </Card>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <Card className="bg-muted bg-opacity-50">
                                                <CardContent className="pt-6 text-center">
                                                    <p className="text-muted-foreground">No incidents reported</p>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        )}
                    </Tabs>
                </CardContent>
            </Card>

            {onAddToGrid && (
                <div className="mt-4">
                    <Button variant="outline" size="sm" onClick={handleAddToGrid} className="text-xs">
                        Add to Dashboard
                    </Button>
                </div>
            )}
        </div>
    );
}
