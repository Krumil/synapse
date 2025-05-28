import { VerifiedIcon, Heart, MessageCircle, Repeat2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReplyProps {
    authorName: string;
    authorHandle: string;
    authorImage: string;
    content: string;
    isVerified?: boolean;
    timestamp: string;
}

interface MetricsProps {
    likes: number;
    replies: number;
    reposts: number;
    views: number;
}

interface UserInfoProps {
    followersCount: number;
    description: string;
}

interface XCardProps {
    link: string;
    authorName: string;
    authorHandle: string;
    authorImage: string;
    content: string[];
    isVerified?: boolean;
    timestamp: string;
    reply?: ReplyProps;
    metrics?: MetricsProps;
    userInfo?: UserInfoProps;
}

// Helper function to format numbers
const formatNumber = (num: number): string => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
};

function XCard({
    link = "https://x.com/dorian_baffier/status/1880291036410572934",
    authorName = "Dorian",
    authorHandle = "dorian_baffier",
    authorImage = "https://pbs.twimg.com/profile_images/1854916060807675904/KtBJsyWr_400x400.jpg",
    content = [
        "All components from KokonutUI can now be open in @v0 🎉",
        "1. Click on 'Open in V0'",
        "2. Customize with prompts",
        "3. Deploy to your app",
    ],
    isVerified = true,
    timestamp = "Jan 18, 2025",
    metrics,
    userInfo,
}: XCardProps) {
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        window.open(link, "_blank", "noopener,noreferrer");
    };

    return (
        <div
            onClick={handleClick}
            className={cn(
                "w-full min-w-[400px] md:min-w-[500px] max-w-xl rounded-2xl relative isolate overflow-hidden cursor-pointer",
                "bg-white/5 dark:bg-black/90",
                "bg-gradient-to-br from-black/5 to-black/[0.02] dark:from-white/5 dark:to-white/[0.02]",
                "backdrop-blur-xl backdrop-saturate-[180%]",
                "will-change-transform translate-z-0",
                "transition-transform hover:scale-[1.02]"
            )}
        >
            <div
                className={cn(
                    "w-full p-5 rounded-xl relative",
                    "bg-gradient-to-br from-black/[0.05] to-transparent dark:from-white/[0.08] dark:to-transparent",
                    "backdrop-blur-md backdrop-saturate-150",
                    "will-change-transform translate-z-0",
                    "before:absolute before:inset-0 before:bg-gradient-to-br before:from-black/[0.02] before:to-black/[0.01] dark:before:from-white/[0.03] dark:before:to-white/[0.01] before:opacity-0 before:transition-opacity before:pointer-events-none",
                    "hover:before:opacity-100"
                )}
            >
                <div className="flex gap-3">
                    <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full overflow-hidden">
                            <img src={authorImage} alt={authorName} className="h-full w-full object-cover" />
                        </div>
                    </div>

                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                    <span className="font-semibold text-black dark:text-white/90 hover:underline cursor-pointer">
                                        {authorName}
                                    </span>
                                    {isVerified && <VerifiedIcon className="h-4 w-4 text-blue-400" />}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-black dark:text-white/60 text-sm">@{authorHandle}</span>
                                    {userInfo?.followersCount && (
                                        <span className="text-black dark:text-white/50 text-xs">
                                            {formatNumber(userInfo.followersCount)} followers
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                type="button"
                                className="h-8 w-8 text-black dark:text-white/80 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg p-1 flex items-center justify-center"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="1200"
                                    height="1227"
                                    fill="none"
                                    viewBox="0 0 1200 1227"
                                    className="w-4 h-4"
                                >
                                    <title>X</title>
                                    <path
                                        fill="currentColor"
                                        d="M714.163 519.284 1160.89 0h-105.86L667.137 450.887 357.328 0H0l468.492 681.821L0 1226.37h105.866l409.625-476.152 327.181 476.152H1200L714.137 519.284h.026ZM569.165 687.828l-47.468-67.894-377.686-540.24h162.604l304.797 435.991 47.468 67.894 396.2 566.721H892.476L569.165 687.854v-.026Z"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-2">
                    {content.map((item, index) => (
                        <p key={index} className="text-black dark:text-white/90 text-base">
                            {item}
                        </p>
                    ))}
                    <span className="text-black dark:text-white/50 text-sm mt-2 block">{timestamp}</span>
                </div>

                {/* Metrics Section */}
                {/* {metrics && (
                    <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10">
                        <div className="flex items-center justify-between text-black dark:text-white/60">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1 text-sm">
                                    <Heart className="h-4 w-4" />
                                    <span>{formatNumber(metrics.likes)}</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm">
                                    <MessageCircle className="h-4 w-4" />
                                    <span>{formatNumber(metrics.replies)}</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm">
                                    <Repeat2 className="h-4 w-4" />
                                    <span>{formatNumber(metrics.reposts)}</span>
                                </div>
                                {metrics.views > 0 && (
                                    <div className="flex items-center gap-1 text-sm">
                                        <Eye className="h-4 w-4" />
                                        <span>{formatNumber(metrics.views)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )} */}

                {/* User Description */}
                {userInfo?.description && (
                    <div className="mt-2 text-xs text-black dark:text-white/50 line-clamp-2">
                        {userInfo.description}
                    </div>
                )}
            </div>
        </div>
    );
}

export { XCard };
