"use client";
import * as React from "react";

export const RoadmapSection = () => {
    const roadmapItems = [
        {
            quarter: "Q1 2025",
            title: "Initial Launch",
            description: "Launch of core platform with Starknet integration and basic AI assistant capabilities",
            completed: true,
        },
        {
            quarter: "Q1 2025",
            title: "Protocol Integrations",
            description:
                "Integration with Nostra and Avnu for staking, liquidity pools, and market analytics on Starknet",
            completed: true,
        },
        {
            quarter: "Q1 2025",
            title: "Guided Onboarding",
            description: "Risk assessment quiz, interactive tutorials, and personalized dashboard experience",
            completed: true,
        },
        {
            quarter: "Q2 2025",
            title: "Mobile & PWA Release",
            description: "Launch of Progressive Web App and native mobile applications for Starknet interactions",
            completed: true,
        },
        {
            quarter: "Q3 2025",
            title: "Gaming Ecosystem Integration",
            description:
                "Integration with Starknet gaming protocols like Influence and Realms, enabling in-game asset tracking and cross-game inventory management",
            completed: false,
        },
        {
            quarter: "Q4 2025",
            title: "AI Strategy Builder",
            description: "Advanced AI-powered strategy creator with natural language configuration on Starknet",
            completed: false,
        },
        {
            quarter: "Q4 2025",
            title: "Community Plugin System",
            description: "Open ecosystem for community-developed Starknet protocol integrations and custom analytics",
            completed: false,
        },
    ];

    return (
        <section className="py-16 md:pt-32" id="roadmap">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
                <div className="text-center mb-12">
                    <h2 className="text-balance text-3xl sm:text-4xl lg:text-5xl font-semibold">Roadmap</h2>
                    <p className="mt-4">Our development journey since January 2025 and future plans</p>
                </div>

                <div className="relative">
                    <div className="absolute left-1/2 h-full w-0.5 -translate-x-1/2 bg-border"></div>

                    <div className="space-y-12">
                        {roadmapItems.map((item, index) => (
                            <div
                                key={index}
                                className={`relative ${
                                    index % 2 === 0
                                        ? "md:pr-12 md:text-right md:ml-auto md:mr-1/2"
                                        : "md:pl-12 md:text-left md:mr-auto md:ml-1/2"
                                } md:w-1/2 p-6`}
                            >
                                <div
                                    className={`absolute top-6 ${
                                        index % 2 === 0 ? "md:-right-4" : "md:-left-4"
                                    } left-6 md:left-auto size-8 rounded-full border-4 ${
                                        item.completed
                                            ? "bg-primary border-primary/40"
                                            : "bg-muted border-muted-foreground/40"
                                    }`}
                                ></div>

                                <div className="bg-card rounded-lg p-6 shadow-sm">
                                    <span className="inline-block px-3 py-1 text-xs rounded-full bg-muted mb-2">
                                        {item.quarter}
                                    </span>
                                    <h3 className="text-xl font-medium">{item.title}</h3>
                                    <p className="mt-2 text-foreground/80">{item.description}</p>
                                    {item.completed && (
                                        <span className="mt-3 inline-flex items-center text-xs text-primary">
                                            Completed
                                            <svg
                                                className="ml-1 h-3 w-3"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
