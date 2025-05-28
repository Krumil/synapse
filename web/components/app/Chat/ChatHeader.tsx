"use client";
import { ThemeToggle } from "@/components/theme-toggle";
import WalletSection from "@/components/WalletSection";

export function ChatHeader() {
    return (
        <div className="w-full flex justify-between items-center">
            <h1 className="text-4xl font-bold">Synapse</h1>
            <div className="flex items-center gap-4">
                {/* <ThemeToggle /> */}
                <WalletSection />
            </div>
        </div>
    );
}
