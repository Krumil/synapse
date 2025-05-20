"use client";

import React from "react";
import { useOnboarding } from "./WizardProvider";

export const WelcomeStep = () => {
    const { nextStep, updateOnboardingData } = useOnboarding();

    const handleConnectWallet = () => {
        console.log("Connect wallet clicked - Placeholder");
        updateOnboardingData({ walletAttempted: true });
        // Actual wallet connection logic would go here
        // On success: nextStep();
    };

    const handleExplore = () => {
        console.log("Explore without wallet clicked - Placeholder");
        updateOnboardingData({ mode: "explore" });
        nextStep();
    };

    return (
        <div className="p-8 rounded-lg shadow-xl bg-white dark:bg-gray-800">
            <h1 className="text-2xl font-bold mb-4 text-center text-gray-900 dark:text-white">Welcome to Synapse!</h1>
            <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                    Global TVL Snapshot: <span className="font-semibold">[Data to be fetched via useDefiData]</span>
                </p>
                {/* Sparkline could go here */}
            </div>
            <div className="flex flex-col space-y-4">
                <button
                    onClick={handleConnectWallet}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    Connect Wallet
                </button>
                <button
                    onClick={handleExplore}
                    className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    Explore without wallet
                </button>
            </div>
            {/* Temporary button for testing navigation */}
            <button onClick={nextStep} className="mt-4 text-sm text-blue-500 hover:underline">
                Next (Dev)
            </button>
        </div>
    );
};
