"use client";
import * as React from "react";
import { Header } from "@/components/landing-page/Header";
import { Footer } from "@/components/landing-page/Footer";
import { HeroSection } from "@/components/landing-page/sections/HeroSection";
import { FeaturesSection } from "@/components/landing-page/sections/FeaturesSection";
import { RoadmapSection } from "@/components/landing-page/sections/RoadmapSection";

// Main landing page component
const SynapseLandingPage = () => {
    return (
        <div className="relative min-h-screen">
            <div className="relative z-0 flex min-h-screen flex-col">
                <Header />
                <main className="flex-grow">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <HeroSection />
                        <FeaturesSection />
                        <RoadmapSection />
                    </div>
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default SynapseLandingPage;
