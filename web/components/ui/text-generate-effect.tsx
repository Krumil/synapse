"use client";
import { useEffect } from "react";
import { motion, stagger, useAnimate } from "framer-motion";
import { cn } from "@/lib/utils";

export const TextGenerateEffect = ({
    words,
    className,
    filter = true,
    duration = 0.1,
    onComplete,
}: {
    words: string;
    className?: string;
    filter?: boolean;
    duration?: number;
    onComplete?: () => void;
}) => {
    const [scope, animate] = useAnimate();
    const wordsArray = words.split(" ");

    useEffect(() => {
        const animateText = async () => {
            await animate(
                "span",
                {
                    opacity: 1,
                    filter: filter ? "blur(0px)" : "none",
                },
                {
                    duration: duration ? duration : 1,
                    delay: stagger(0.05),
                }
            );
            onComplete?.();
        };

        animateText();
    }, [words, filter, duration, animate, onComplete]);

    const renderWords = () => {
        return (
            <motion.div ref={scope}>
                {wordsArray.map((word, idx) => {
                    return (
                        <motion.span
                            key={word + idx}
                            className="dark:text-white text-black opacity-0"
                            style={{
                                filter: filter ? "blur(10px)" : "none",
                            }}
                        >
                            {word}{" "}
                        </motion.span>
                    );
                })}
            </motion.div>
        );
    };

    return (
        <div className={cn(className)}>
            <div>
                <div className=" dark:text-white text-black">{renderWords()}</div>
            </div>
        </div>
    );
};
