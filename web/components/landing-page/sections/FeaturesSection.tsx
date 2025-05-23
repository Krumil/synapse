"use client";
import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Bot, Shield, PieChart, Settings2 } from "lucide-react";

export const FeaturesSection = () => {
    return (
        <section className="bg-muted/80 py-16 md:py-32 dark:bg-transparent" id="features">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
                <div className="text-center">
                    <h2 className="text-balance text-3xl sm:text-4xl lg:text-5xl font-semibold">Core Features</h2>
                    <p className="mt-4">
                        Simplifying Starknet DeFi for users of all backgrounds with powerful AI assistance
                    </p>
                </div>
                <Card className="mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-hidden shadow-zinc-950/5 *:text-center md:mt-16">
                    <div className="group shadow-zinc-950/5">
                        <CardHeader className="pb-3">
                            <div
                                aria-hidden
                                className="relative mx-auto size-36 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"
                            >
                                <div className="absolute inset-0 [--border:black] dark:[--border:white] bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:24px_24px] opacity-10" />
                                <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-t border-l">
                                    <Bot className="size-6" aria-hidden />
                                </div>
                            </div>
                            <h3 className="mt-6 font-medium">Personalized Guidance</h3>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">
                                Customized recommendations based on your risk profile, experience level, and financial
                                goals through natural language interaction.
                            </p>
                        </CardContent>
                    </div>

                    <div className="group shadow-zinc-950/5">
                        <CardHeader className="pb-3">
                            <div
                                aria-hidden
                                className="relative mx-auto size-36 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"
                            >
                                <div className="absolute inset-0 [--border:black] dark:[--border:white] bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:24px_24px] opacity-10" />
                                <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-t border-l">
                                    <Settings2 className="size-6" aria-hidden />
                                </div>
                            </div>
                            <h3 className="mt-6 font-medium">Automated Strategies</h3>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">
                                Set up custom DeFi strategies with one-click actions for deposits, withdrawals, and
                                swaps across multiple protocols on Starknet.
                            </p>
                        </CardContent>
                    </div>

                    <div className="group shadow-zinc-950/5">
                        <CardHeader className="pb-3">
                            <div
                                aria-hidden
                                className="relative mx-auto size-36 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"
                            >
                                <div className="absolute inset-0 [--border:black] dark:[--border:white] bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:24px_24px] opacity-10" />
                                <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-t border-l">
                                    <PieChart className="size-6" aria-hidden />
                                </div>
                            </div>
                            <h3 className="mt-6 font-medium">Portfolio Management</h3>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">
                                Comprehensive Starknet token tracking, performance metrics, portfolio diversification
                                recommendations, and CSV export for analytics.
                            </p>
                        </CardContent>
                    </div>

                    <div className="group shadow-zinc-950/5">
                        <CardHeader className="pb-3">
                            <div
                                aria-hidden
                                className="relative mx-auto size-36 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"
                            >
                                <div className="absolute inset-0 [--border:black] dark:[--border:white] bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:24px_24px] opacity-10" />
                                <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-t border-l">
                                    <Shield className="size-6" aria-hidden />
                                </div>
                            </div>
                            <h3 className="mt-6 font-medium">Risk Alerts</h3>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">
                                Proactive notifications about significant APY changes, pool health issues, and market
                                opportunities on Starknet through your preferred channels.
                            </p>
                        </CardContent>
                    </div>
                </Card>
            </div>
        </section>
    );
};
