import { XCard } from "@/components/ui/x-gradient-card";
import { ReactNode, useMemo } from "react";
import { Button } from "@/components/ui/button";
import Carousel, { CarouselItem } from "@/components/ui/Carousel/Carousel";
import { FiTwitter } from "react-icons/fi";

interface XToolProps {
    data: any;
    contentString?: string;
    onAddToGrid?: (component: ReactNode, header?: ReactNode) => void;
}

export function XTool({ data, contentString, onAddToGrid }: XToolProps) {
    const carouselItems: CarouselItem[] = useMemo(() => {
        let xData = null;

        if (data?.content && typeof data.content === "object" && data.content.mentions) {
            xData = data.content.mentions;
        } else if (data?.mentions) {
            xData = data.mentions;
        } else {
            xData = data?.posts || data?.data || data;
        }

        if (!xData) {
            return [];
        }

        const posts = Array.isArray(xData) ? xData : [xData];

        return posts.map((post, index) => ({
            id: index,
            title:
                post.user?.name || post.author?.name || post.author?.username || post.username || `User ${index + 1}`,
            description: post.content || post.text || "No content available",
            icon: <FiTwitter className="h-[16px] w-[16px] text-white" />,
            postData: {
                link: `https://x.com/${
                    post.user?.username || post.author?.username || post.username || "unknown"
                }/status/${post.twitter_id || post.id}`,
                authorName:
                    post.user?.name ||
                    post.author?.name ||
                    post.author?.username ||
                    post.username ||
                    `User ${index + 1}`,
                authorHandle: post.user?.username || post.author?.username || post.username || `user${index + 1}`,
                authorImage:
                    post.user?.profile_image_url ||
                    post.author?.profileImage ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${
                        post.user?.username || post.author?.username || index
                    }`,
                content: [post.content || post.text || "No content available"],
                isVerified: post.user?.verified || post.author?.verified || false,
                timestamp:
                    post.computed?.formattedDate ||
                    (post.createdAt
                        ? new Date(post.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                          })
                        : "Unknown date"),
                metrics: post.metrics
                    ? {
                          likes: post.metrics.like_count || 0,
                          replies: post.metrics.reply_count || 0,
                          reposts: post.metrics.repost_count || 0,
                          views: post.metrics.view_count || 0,
                      }
                    : undefined,
                userInfo: post.user
                    ? {
                          followersCount: post.user.followers_count,
                          description: post.user.description,
                      }
                    : undefined,
                originalData: post,
            },
        }));
    }, [data]);

    if (carouselItems.length === 0) {
        console.error("No X post data found in:", data);
        return <div className="w-full p-3 bg-red-50 text-red-500 rounded-lg">Error: No X post data found</div>;
    }

    const renderXPost = (item: CarouselItem, index: number) => (
        <div className="w-full h-full">
            <XCard {...item.postData} />
        </div>
    );

    const handleAddToGrid = () => {
        if (onAddToGrid) {
            const component = (
                <div style={{ position: "relative" }}>
                    <Carousel
                        items={carouselItems}
                        autoplay={true}
                        autoplayDelay={6000}
                        pauseOnHover={true}
                        loop={true}
                        round={false}
                        renderCustomContent={renderXPost}
                    />
                </div>
            );
            onAddToGrid(component, "Starknet News");
        }
    };

    return (
        <div className="w-full space-y-4">
            <div style={{ position: "relative" }}>
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
            </div>
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
