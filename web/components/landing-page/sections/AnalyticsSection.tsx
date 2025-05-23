"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, BarChart3, Gauge } from "lucide-react";

export const AnalyticsSection = () => {
    const analyticsFeatures = [
        {
            title: "Real-Time Yield Comparisons",
            description: "Compare yields across multiple protocols in real-time to identify the best opportunities.",
            icon: <LineChart className="h-10 w-10 text-primary" />,
        },
        {
            title: "Portfolio Performance Tracking",
            description: "Monitor your investments with detailed metrics, historical trends, and export capabilities.",
            icon: <LineChart className="h-10 w-10 text-primary" />,
        },
        {
            title: "Risk Assessment",
            description: "Personalized risk analysis based on your profile and market conditions.",
            icon: <Gauge className="h-10 w-10 text-primary" />,
        },
        {
            title: "Market Opportunity Alerts",
            description: "Get notified about significant APY changes and emerging opportunities in the market.",
            icon: <BarChart3 className="h-10 w-10 text-primary" />,
        },
    ];

    return (
        <section className="bg-muted/40 py-16 md:py-24 dark:bg-muted/5" id="analytics">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
                <div className="text-center mb-12">
                    <h2 className="text-balance text-3xl sm:text-4xl lg:text-5xl font-semibold">
                        Data-Driven Insights
                    </h2>
                    <p className="mt-4 max-w-2xl mx-auto">
                        Make informed decisions with comprehensive analytics and personalized recommendations
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {analyticsFeatures.map((feature, index) => (
                        <Card key={index} className="bg-card border-0 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-6 flex flex-col items-center text-center">
                                <div className="mb-4 rounded-full bg-primary/10 p-3">{feature.icon}</div>
                                <h3 className="text-lg font-medium mb-2">{feature.title}</h3>
                                <p className="text-sm text-foreground/70">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="mt-16 relative mx-auto max-w-4xl overflow-hidden rounded-xl border shadow-lg">
                    <img
                        className="w-full h-auto"
                        src="https://placehold.co/1200x600/2a2a2a/white?text=Analytics+Dashboard"
                        alt="Synapse Analytics Dashboard"
                    />
                </div>
            </div>
        </section>
    );
};
