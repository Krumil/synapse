import Carousel, { CarouselItem } from "@/components/ui/Carousel/Carousel";
import { Button } from "@/components/ui/button";
import { FiTwitter } from "react-icons/fi";
import { ReactNode } from "react";
import { XCard } from "@/components/ui/x-gradient-card";

interface StarknetEcosystemNewsToolProps {
    data: any;
    contentString?: string;
    onAddToGrid?: (component: ReactNode, header?: ReactNode) => void;
}

interface EcosystemMention {
    id: number;
    twitter_id: string;
    twitter_user_id: string;
    content: string;
    mentioned_at: string;
    type: "post" | "repost" | "reply" | "quote";
    sentiment: "neutral" | "positive" | "negative";
    metrics: {
        like_count: number;
        reply_count: number;
        repost_count: number;
        view_count: number;
    };
    computed: {
        totalEngagement: number;
        engagementRate: string;
        formattedDate: string;
        formattedTime: string;
        relativeTime: string;
        isHighEngagement: boolean;
        isViral: boolean;
    };
    user?: {
        username: string;
        name: string;
        profile_image_url: string;
        verified: boolean;
        followers_count: number;
        description: string;
    };
}

interface EcosystemNewsData {
    type: string;
    timestamp: string;
    searchKeywords: string[];
    timeframe: string;
    totalResults: number;
    returnedResults: number;
    sortedBy: string;
    cursor?: string;
    mentions: EcosystemMention[];
    metadata?: {
        total: number;
        cursor: string;
        hasMore: boolean;
        currentPage: number;
        estimatedTotalPages: number;
    };
    summary?: {
        totalMentions: number;
        returnedMentions: number;
        sentimentBreakdown: Record<string, number>;
        typeBreakdown: Record<string, number>;
        topEngagement: number;
        totalViews: number;
        averageEngagement: string;
    };
}

export function StarknetEcosystemNewsTool({ data, contentString, onAddToGrid }: StarknetEcosystemNewsToolProps) {
    let newsData: EcosystemNewsData;

    try {
        // First check if data.content contains the social media data
        if (data.content && typeof data.content === "object" && data.content.type === "starknet_ecosystem_news") {
            newsData = data.content;
        }
        // Check if data directly contains the ecosystem news
        else if (data.type === "starknet_ecosystem_news" && data.mentions) {
            newsData = data;
        }
        // Try parsing contentString
        else if (contentString) {
            const parsed = JSON.parse(contentString);
            if (parsed.type === "starknet_ecosystem_news" && parsed.mentions) {
                newsData = parsed;
            } else {
                throw new Error("Invalid data structure in contentString");
            }
        }
        // Fallback: try parsing data as string
        else {
            newsData = typeof data === "string" ? JSON.parse(data) : data;
        }
    } catch (error) {
        console.error("Failed to parse ecosystem news data:", error);
        console.log("Received data:", data);
        return <div className="w-full p-3 bg-red-50 text-red-500 rounded-lg">Error: Invalid ecosystem news data</div>;
    }

    if (!newsData || !newsData.mentions) {
        console.error("No ecosystem news data found in:", data);
        return <div className="w-full p-3 bg-red-50 text-red-500 rounded-lg">Error: No ecosystem news data found</div>;
    }

    const { mentions } = newsData;

    // Convert mentions to carousel items for X posts
    const carouselItems: CarouselItem[] = mentions.map((mention, index) => ({
        id: index,
        title: `User ${mention.user?.username || mention.twitter_user_id}`,
        description: mention.content,
        icon: <FiTwitter className="h-[16px] w-[16px] text-white" />,
        postData: {
            link: `https://x.com/${mention.user?.username || mention.twitter_user_id}/status/${mention.twitter_id}`,
            authorName: mention.user?.name || `User ${mention.twitter_user_id}`,
            authorHandle: mention.user?.username || mention.twitter_user_id,
            authorImage:
                mention.user?.profile_image_url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${mention.user?.username || mention.twitter_user_id}`,
            content: [mention.content],
            isVerified: mention.user?.verified || false,
            timestamp: mention.computed?.formattedDate || "",
            metrics: mention.metrics
                ? {
                      likes: mention.metrics.like_count || 0,
                      replies: mention.metrics.reply_count || 0,
                      reposts: mention.metrics.repost_count || 0,
                      views: mention.metrics.view_count || 0,
                  }
                : undefined,
            userInfo: mention.user
                ? {
                      followersCount: mention.user.followers_count,
                      description: mention.user.description,
                  }
                : undefined,
        },
    }));

    const renderXPost = (item: CarouselItem, index: number) => (
        <div className="w-full h-full p-2">
            <XCard {...item.postData} />
        </div>
    );

    const handleAddToGrid = () => {
        if (onAddToGrid) {
            const component = (
                <div className="h-full">
                    <Carousel
                        items={carouselItems}
                        autoplay={true}
                        autoplayDelay={6000}
                        pauseOnHover={true}
                        loop={true}
                        round={true}
                        renderCustomContent={renderXPost}
                    />
                </div>
            );
            onAddToGrid(component, "");
        }
    };

    return (
        <div
            className="non-draggable w-full"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
        >
            <Carousel
                items={carouselItems}
                baseWidth={600}
                autoplay={true}
                autoplayDelay={8000}
                pauseOnHover={true}
                loop={true}
                round={false}
                renderCustomContent={renderXPost}
            />

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
