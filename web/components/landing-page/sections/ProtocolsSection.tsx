"use client";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const ProtocolsSection = () => {
    const protocols = [
        {
            name: "Nostra",
            description:
                "Single-asset staking, liquidity pool management, and auto-compounding with risk-adjusted pool recommendations.",
            logo: "https://placehold.co/100/2a2a2a/white?text=N",
            link: "#nostra",
        },
        {
            name: "Avnu",
            description:
                "Real-time price feeds, volume and TVL tracking, market trend analysis, and historical data visualization.",
            logo: "https://placehold.co/100/2a2a2a/white?text=A",
            link: "#avnu",
        },
        {
            name: "Unruggable × Ekubo",
            description:
                "One-click secure memecoin deployment with anti-bot measures, customizable tokenomics, and automated liquidity.",
            logo: "https://placehold.co/100/2a2a2a/white?text=U×E",
            link: "#unruggable",
        },
        {
            name: "JediSwap",
            description:
                "Integrated liquidity pools and limit orders on Starknet with seamless deposit/withdraw functionality.",
            logo: "https://placehold.co/100/2a2a2a/white?text=JS",
            link: "#jediswap",
        },
    ];

    return (
        <section className="py-16 md:py-24" id="protocols">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
                <div className="text-center">
                    <h2 className="text-balance text-3xl sm:text-4xl lg:text-5xl font-semibold">
                        Integrated Protocols
                    </h2>
                    <p className="mt-4 max-w-2xl mx-auto">
                        Interact seamlessly with leading Starknet protocols through our AI assistant
                    </p>
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {protocols.map((protocol, index) => (
                        <Card key={index} className="overflow-hidden transition-all hover:shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 rounded-lg overflow-hidden">
                                        <img
                                            src={protocol.logo}
                                            alt={`${protocol.name} logo`}
                                            className="h-16 w-16 object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-medium">{protocol.name}</h3>
                                        <p className="mt-2 text-sm text-foreground/80">{protocol.description}</p>
                                        <Button variant="link" className="mt-2 px-0" asChild>
                                            <a href={protocol.link}>Learn more</a>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};
