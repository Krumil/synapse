"use client";
import * as React from "react";
import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

// Animation variants
const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: "blur(12px)",
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
            transition: {
                type: "spring",
                bounce: 0.3,
                duration: 1.5,
            },
        },
    },
};

// AnimatedGroup component
interface AnimatedGroupProps {
    children: React.ReactNode;
    className?: string;
    variants?: {
        container?: Variants;
        item?: Variants;
    };
    preset?: string;
}

export function AnimatedGroup({ children, className, variants }: AnimatedGroupProps) {
    const containerVariants = variants?.container || {
        visible: {
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.75,
            },
        },
    };
    const itemVariants = variants?.item || transitionVariants.item;

    return (
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className={cn(className)}>
            {React.Children.map(children, (child, index) => (
                <motion.div key={index} variants={itemVariants}>
                    {child}
                </motion.div>
            ))}
        </motion.div>
    );
}

export { transitionVariants };
