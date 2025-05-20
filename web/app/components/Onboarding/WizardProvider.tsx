"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface OnboardingContextType {
    step: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onboardingData: Record<string, any>;
    nextStep: () => void;
    prevStep: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateOnboardingData: (newData: Partial<Record<string, any>>) => void;
    completeOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = (): OnboardingContextType => {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error("useOnboarding must be used within an WizardProvider");
    }
    return context;
};

interface WizardProviderProps {
    children: ReactNode;
    totalSteps: number;
}

export const WizardProvider = ({ children, totalSteps }: WizardProviderProps) => {
    const [step, setStep] = useState(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [onboardingData, setOnboardingData] = useState<Record<string, any>>({});

    const nextStep = useCallback(() => {
        setStep((prev) => Math.min(prev + 1, totalSteps - 1));
    }, [totalSteps]);

    const prevStep = useCallback(() => {
        setStep((prev) => Math.max(prev - 1, 0));
    }, []);

    const updateOnboardingData = useCallback((newData: Partial<Record<string, any>>) => {
        setOnboardingData((prev) => ({ ...prev, ...newData }));
    }, []);

    const completeOnboarding = useCallback(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("synapseOnboarded", "true");
            // Potentially redirect to the 'next' parameter or dashboard
            // router.replace(searchParams.get('next') || '/dashboard');
            console.log("Onboarding completed, flag set.");
        }
    }, []);

    return (
        <OnboardingContext.Provider
            value={{ step, onboardingData, nextStep, prevStep, updateOnboardingData, completeOnboarding }}
        >
            {children}
        </OnboardingContext.Provider>
    );
};
