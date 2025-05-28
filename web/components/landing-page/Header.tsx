"use client";
import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/theme-toggle";
import WalletSection from "@/components/WalletSection";
import { cn } from "@/lib/utils";

export const Header = () => {
    const [menuState, setMenuState] = React.useState(false);
    const [scrolled, setScrolled] = React.useState(false);

    React.useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const menuItems = [
        { name: "Features", href: "#features" as const },
        { name: "Roadmap", href: "#roadmap" as const },
        // { name: "Docs", href: "#docs" as const },
        // { name: "About", href: "#about" as const },
    ];

    return (
        <header>
            <nav
                data-state={menuState && "active"}
                className={cn(
                    "group fixed z-20 w-full border-b transition-colors duration-150",
                    scrolled && "bg-background/95 backdrop-blur-3xl"
                )}
            >
                <div className="container mx-auto max-w-5xl px-4 sm:px-6 transition-all duration-300">
                    <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                        <div className="flex w-full items-center justify-between gap-12 lg:w-auto">
                            <Link href="/" aria-label="home" className="flex items-center space-x-2">
                                <Logo />
                            </Link>

                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState ? "Close Menu" : "Open Menu"}
                                className="relative z-20 block cursor-pointer p-2.5 lg:hidden"
                            >
                                <Menu className="group-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                            </button>

                            <div className="hidden lg:block">
                                <ul className="flex gap-8 text-sm">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                className="text-foreground/80 hover:text-accent-foreground block duration-150"
                                            >
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="bg-background/95 backdrop-blur-lg group-data-[state=active]:block lg:group-data-[state=active]:flex fixed top-[4rem] left-0 right-0 lg:relative lg:top-0 mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 p-6 shadow-2xl md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:bg-transparent lg:p-0 lg:shadow-none">
                            <div className="lg:hidden">
                                <ul className="space-y-6 text-base">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                className="text-foreground/80 hover:text-accent-foreground block duration-150"
                                            >
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex items-center gap-4">
                                {/* <ThemeToggle /> */}
                                <WalletSection />
                                {/* <Button asChild>
                                    <Link href="#">
                                        <span>Launch App</span>
                                    </Link>
                                </Button> */}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
};
