"use client";
import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnimatedGroup, transitionVariants } from "@/components/common/AnimatedGroup";
import { InteractiveRobotSpline } from "@/components/interactive-3d-robot";
import { InfiniteSlider } from "@/components/ui/infinite-slider";

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
                        </div>
                    </div>

                    {/* Partner logos slider */}
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl mt-16 mb-8">
                        <div className="text-center mb-8">
                            <p className="text-sm text-foreground/60 font-medium">POWERED BY</p>
                        </div>
                        <InfiniteSlider gap={48} reverse className="w-full">
                            <img
                                src="https://www.starknet.io/wp-content/themes/Starknet/assets/img/starknet-logo-light.svg"
                                alt="Starknet logo"
                                className="h-[60px] w-auto opacity-60 hover:opacity-100 transition-opacity"
                            />
                            <img
                                src="https://defillama.com/defillama-press-kit/defi/PNG/defillama.png"
                                alt="DeFiLlama logo"
                                className="h-[60px] w-auto opacity-60 hover:opacity-100 transition-opacity"
                            />
                            <img
                                src="https://cdn.prod.website-files.com/65da058eff5fcdc97cc38d79/6762cd624d5ee9aec11ad95d_Elfa-logo.svg"
                                alt="Elfa AI logo"
                                className="h-[60px] w-auto opacity-60 hover:opacity-100 transition-opacity"
                            />
                            <img
                                src="https://app.avnu.fi/AVNU_logo_white.svg"
                                alt="AVNU logo"
                                className="h-[60px] w-auto opacity-60 hover:opacity-100 transition-opacity"
                            />
                        </InfiniteSlider>
                    </div>
                </AnimatedGroup>
            </div>
        </section>
    );
};
