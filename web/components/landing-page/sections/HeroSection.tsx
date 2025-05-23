"use client";
import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnimatedGroup, transitionVariants } from "@/components/common/AnimatedGroup";
import { InteractiveRobotSpline } from "@/components/interactive-3d-robot";

export const HeroSection = () => {
    const ROBOT_SCENE_URL = "https://prod.spline.design/7-AQITOwmSNeGDwW/scene.splinecode";

    return (
        <section className="overflow-hidden">
            <div className="relative pt-16">
                <div className="absolute inset-0 -z-10 size-full"></div>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
                    <div className="sm:mx-auto lg:mr-auto">
                        <AnimatedGroup
                            variants={{
                                container: {
                                    visible: {
                                        transition: {
                                            staggerChildren: 0.05,
                                            delayChildren: 0.75,
                                        },
                                    },
                                },
                                ...transitionVariants,
                            }}
                        >
                            <h1 className="mt-8 max-w-2xl text-balance text-4xl sm:text-5xl md:text-6xl font-medium lg:mt-16">
                                Your AI Assistant for Starknet DeFi
                            </h1>
                            <p className="mt-8 max-w-2xl text-pretty text-lg">
                                Synapse delivers personalized guidance for yield farming, liquidity provision, and
                                portfolio management on Starknet, adapting to your risk profile and investment goals
                                through natural language interaction.
                            </p>
                            <div className="mt-12 flex items-center gap-2">
                                <div key={1} className="bg-foreground/10 rounded-[14px] border p-0.5">
                                    <Button asChild size="lg" className="rounded-xl px-5 text-base">
                                        <Link href="/app">
                                            <span className="text-nowrap">Launch App</span>
                                        </Link>
                                    </Button>
                                </div>
                                <Button
                                    key={2}
                                    asChild
                                    size="lg"
                                    variant="ghost"
                                    className="h-[42px] rounded-xl px-5 text-base"
                                >
                                    <Link href="#features">
                                        <span className="text-nowrap">Explore Features</span>
                                    </Link>
                                </Button>
                            </div>
                        </AnimatedGroup>
                    </div>
                </div>
                <AnimatedGroup
                    variants={{
                        container: {
                            visible: {
                                transition: {
                                    staggerChildren: 0.05,
                                    delayChildren: 0.75,
                                },
                            },
                        },
                        ...transitionVariants,
                    }}
                >
                    <div className="relative overflow-hidden px-2">
                        <div className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden rounded-xl">
                            <InteractiveRobotSpline scene={ROBOT_SCENE_URL} className="absolute inset-0 z-0" />

                            {/* <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                                <div className="text-center max-w-3xl mx-auto px-4 sm:px-6 md:px-8">
                                    <div className="absolute inset-0 bg-black/20 rounded-2xl -z-10" />

                                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white drop-shadow-2xl leading-tight">
                                        Meet Synapse
                                    </h1>
                                    <p className="mt-4 text-sm sm:text-base md:text-lg lg:text-xl text-white/90 drop-shadow-lg max-w-2xl mx-auto leading-relaxed">
                                        Your AI companion for Starknet DeFi
                                    </p>
                                </div>
                            </div> */}
                        </div>
                    </div>
                </AnimatedGroup>
            </div>
        </section>
    );
};
