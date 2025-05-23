"use client";

import { Suspense, lazy, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const Spline = lazy(() => import("@splinetool/react-spline"));

interface InteractiveRobotSplineProps {
    scene: string;
    className?: string;
}

const RobotLoadingPlaceholder = ({ className }: { className?: string }) => (
    <motion.div
        className={cn("w-full h-full flex items-center justify-center", className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
    >
        {/* Background gradient that matches the robot scene */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-black/40 rounded-2xl" />

        {/* Animated robot silhouette */}
        <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
            {/* Robot head placeholder */}
            <motion.div
                className="w-16 h-16 bg-blue-400/30 rounded-full border-2 border-blue-400/50"
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.7, 0.3],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Robot body placeholder */}
            <motion.div
                className="w-12 h-20 bg-blue-400/20 rounded-lg border-2 border-blue-400/40"
                animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.2, 0.6, 0.2],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.3,
                }}
            />

            {/* Loading text */}
            <motion.div
                className="text-white/70 text-sm font-medium"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            >
                Loading Whobee...
            </motion.div>

            {/* Loading dots */}
            <div className="flex space-x-1">
                {[0, 1, 2].map((index) => (
                    <motion.div
                        key={index}
                        className="w-2 h-2 bg-blue-400/60 rounded-full"
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.4, 1, 0.4],
                        }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: index * 0.2,
                        }}
                    />
                ))}
            </div>
        </div>
    </motion.div>
);

const RobotErrorFallback = ({ className }: { className?: string }) => (
    <motion.div
        className={cn("w-full h-full flex items-center justify-center", className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
    >
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-orange-900/20 to-black/40 rounded-2xl" />
        <div className="relative z-10 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-orange-400/30 rounded-full border-2 border-orange-400/50 flex items-center justify-center">
                <span className="text-orange-400 text-2xl">⚠</span>
            </div>
            <p className="text-white/70 text-sm">Unable to load 3D robot</p>
            <p className="text-white/50 text-xs">Please check your connection</p>
        </div>
    </motion.div>
);

export function InteractiveRobotSpline({ scene, className }: InteractiveRobotSplineProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const handleLoad = () => {
        setIsLoaded(true);
        setHasError(false);
    };

    const handleError = () => {
        setHasError(true);
        setIsLoaded(false);
    };

    if (hasError) {
        return <RobotErrorFallback className={className} />;
    }

    return (
        <div className={cn("relative w-full h-full", className)}>
            <Suspense fallback={null}>
                <motion.div
                    className="w-full h-full"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{
                        opacity: isLoaded ? 1 : 0,
                        scale: isLoaded ? 1 : 0.95,
                    }}
                    transition={{
                        duration: 1,
                        ease: "easeOut",
                        delay: isLoaded ? 0.2 : 0,
                    }}
                >
                    <Spline
                        scene={scene}
                        onLoad={handleLoad}
                        onError={handleError}
                        style={{
                            width: "100%",
                            height: "100%",
                            background: "transparent",
                        }}
                    />
                </motion.div>
            </Suspense>
        </div>
    );
}
