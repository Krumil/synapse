"use client";
import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Github, Twitter, Linkedin } from "lucide-react";
import { Logo } from "@/components/common/Logo";

export const Footer = () => {
    return (
        <footer className="py-12 px-4 md:px-6 bg-background border-t">
            <div className="container mx-auto">
                <div className="flex flex-col md:flex-row justify-between">
                    <div className="mb-8 md:mb-0">
                        <Link href="/" className="flex items-center gap-2">
                            <Logo />
                        </Link>

                        <p className="mt-4 text-foreground/80 max-w-md">
                            Synapse DeFi Assistant helps you navigate the complex world of decentralized finance with
                            AI-powered insights and automation.
                        </p>

                        <div className="mt-6 flex space-x-4">
                            <Link
                                href="https://twitter.com"
                                className="text-foreground/80 hover:text-foreground transition-colors"
                            >
                                <Twitter size={20} />
                            </Link>
                            <Link
                                href="https://github.com"
                                className="text-foreground/80 hover:text-foreground transition-colors"
                            >
                                <Github size={20} />
                            </Link>
                            <Link
                                href="https://linkedin.com"
                                className="text-foreground/80 hover:text-foreground transition-colors"
                            >
                                <Linkedin size={20} />
                            </Link>
                        </div>

                        <p className="text-sm text-foreground/80 mt-6">
                            © {new Date().getFullYear()} Synapse DeFi. All rights reserved.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                        <div>
                            <h3 className="font-semibold mb-4">Product</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link href="#features" className="text-foreground/80 hover:text-foreground">
                                        Features
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#roadmap" className="text-foreground/80 hover:text-foreground">
                                        Roadmap
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="text-foreground/80 hover:text-foreground">
                                        Pricing
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="text-foreground/80 hover:text-foreground">
                                        Documentation
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-4">Company</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link href="#" className="text-foreground/80 hover:text-foreground">
                                        About
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="text-foreground/80 hover:text-foreground">
                                        Blog
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="text-foreground/80 hover:text-foreground">
                                        Careers
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="text-foreground/80 hover:text-foreground">
                                        Contact
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-4">Legal</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link href="#" className="text-foreground/80 hover:text-foreground">
                                        Privacy Policy
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="text-foreground/80 hover:text-foreground">
                                        Terms of Service
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="text-foreground/80 hover:text-foreground">
                                        Cookie Policy
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <Separator className="my-8" />

                <div className="flex flex-col md:flex-row items-center justify-between">
                    <p className="text-sm text-foreground/80">
                        Powered by{" "}
                        <Link href="https://starknet.io" className="hover:underline">
                            Starknet
                        </Link>
                        ,{" "}
                        <Link href="https://defillama.com" className="hover:underline">
                            DeFiLlama
                        </Link>
                        ,{" "}
                        <Link href="https://app.elfa.ai" className="hover:underline">
                            Elfa AI
                        </Link>
                        ,{" "}
                        <Link href="https://app.avnu.fi/" className="hover:underline">
                            AVNU
                        </Link>{" "}
                        and{" "}
                        <Link href="https://unruggable.meme" className="hover:underline">
                            Unruggable
                        </Link>
                    </p>
                    <div className="mt-4 md:mt-0">
                        <Button asChild variant="outline" size="sm">
                            <Link href="/app">
                                <span>Launch App</span>
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </footer>
    );
};
