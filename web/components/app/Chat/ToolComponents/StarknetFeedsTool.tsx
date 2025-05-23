import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface StarknetFeedsToolProps {
    data: {
        type: string;
        feedType?: string;
        starknetBlogFeed?: Feed;
        starknetDevNewsletter?: Feed;
        starknetStatus?: Feed;
    };
    contentString?: string;
    onAddToGrid?: (component: ReactNode, header?: ReactNode) => void;
}

export function StarknetFeedsTool({ data, contentString = "", onAddToGrid }: StarknetFeedsToolProps) {
    const [activeTab, setActiveTab] = useState<string>("blog");

    // Try to parse content string if feeds aren't in the data object directly
    const parsedFeeds: Record<string, Feed> = {};

    try {
        if (!data.starknetBlogFeed && !data.starknetDevNewsletter && !data.starknetStatus && contentString) {
            const parsed = JSON.parse(contentString);

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
    } catch (e) {
        console.error("Failed to parse content string:", e);
    }

    // Use either the data object or the parsed content
    const blogFeed = data.starknetBlogFeed || parsedFeeds.starknetBlogFeed;
    const devNewsletter = data.starknetDevNewsletter || parsedFeeds.starknetDevNewsletter;
    const statusFeed = data.starknetStatus || parsedFeeds.starknetStatus;

    // Format date nicely
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch (e) {
            return dateString;
        }
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
                        <Tabs defaultValue={activeTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="blog" disabled={!blogFeed}>
                                    Blog
                                </TabsTrigger>
                                <TabsTrigger value="newsletter" disabled={!devNewsletter}>
                                    Newsletter
                                </TabsTrigger>
                                <TabsTrigger value="status" disabled={!statusFeed}>
                                    Status
                                </TabsTrigger>
                            </TabsList>

                            {blogFeed && (
                                <TabsContent value="blog" className="mt-4">
                                    <ScrollArea className="h-full" style={{ maxHeight: "300px" }}>
                                        <div className="space-y-4 pr-4">
                                            {blogFeed.items.slice(0, 3).map((item, idx) => (
                                                <Card key={idx}>
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-base">{item.title}</CardTitle>
                                                        <CardDescription>{formatDate(item.pubDate)}</CardDescription>
                                                    </CardHeader>
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
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </TabsContent>
                            )}

                            {devNewsletter && (
                                <TabsContent value="newsletter" className="mt-4">
                                    <ScrollArea className="h-full" style={{ maxHeight: "300px" }}>
                                        <div className="space-y-4 pr-4">
                                            {devNewsletter.items.slice(0, 3).map((item, idx) => (
                                                <Card key={idx}>
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-base">{item.title}</CardTitle>
                                                        <CardDescription>{formatDate(item.pubDate)}</CardDescription>
                                                    </CardHeader>
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
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </TabsContent>
                            )}

                            {statusFeed && (
                                <TabsContent value="status" className="mt-4">
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
                                </TabsContent>
                            )}
                        </Tabs>
                    </CardContent>
                </Card>,
                "Starknet Feeds"
            );
        }
    };

    // If no data is available, show a message
    if (!blogFeed && !devNewsletter && !statusFeed) {
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
                    <CardDescription>Latest updates from the Starknet ecosystem</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
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
