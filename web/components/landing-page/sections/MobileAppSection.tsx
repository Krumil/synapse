"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { ArrowDownToLine, Smartphone } from "lucide-react";

export const MobileAppSection = () => {
    return (
        <section className="py-16 md:py-24" id="mobile-app">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-balance text-3xl sm:text-4xl font-semibold">Starknet DeFi on the Go</h2>
                        <p className="mt-6 text-lg">
                            Access your Starknet portfolio, perform transactions, and receive alerts from anywhere with
                            our mobile app and Progressive Web App experience.
                        </p>
                        <ul className="mt-6 space-y-3">
                            <li className="flex items-start gap-3">
                                <div className="flex-shrink-0 rounded-full bg-primary/10 p-1">
                                    <svg className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <span>Dark/light theme with accessibility features</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="flex-shrink-0 rounded-full bg-primary/10 p-1">
                                    <svg className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <span>Touch-optimized interface for mobile users</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="flex-shrink-0 rounded-full bg-primary/10 p-1">
                                    <svg className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <span>WalletConnect 2.0 for secure Starknet wallet connections</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="flex-shrink-0 rounded-full bg-primary/10 p-1">
                                    <svg className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <span>Offline capabilities for viewing Starknet portfolios</span>
                            </li>
                        </ul>
                        <div className="mt-8 flex flex-wrap gap-4">
                            <Button className="gap-2">
                                <ArrowDownToLine size={16} />
                                <span>Download iOS App</span>
                            </Button>
                            <Button className="gap-2">
                                <ArrowDownToLine size={16} />
                                <span>Download Android App</span>
                            </Button>
                            <Button variant="outline" className="gap-2">
                                <Smartphone size={16} />
                                <span>Install PWA</span>
                            </Button>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 blur-xl opacity-70 rounded-3xl -z-10"></div>
                        <div className="relative mx-auto max-w-xs">
                            <img
                                src="https://placehold.co/400x800/2a2a2a/white?text=Synapse+Starknet"
                                alt="Synapse Starknet Mobile App"
                                className="w-full rounded-3xl border-4 border-background shadow-xl"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
