"use client";
import * as React from "react";

export const LoadingAnimation = () => {
    return (
        <div className="flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-primary animate-pulse mx-1"></div>
            <div className="w-4 h-4 rounded-full bg-primary animate-pulse mx-1 animation-delay-200"></div>
            <div className="w-4 h-4 rounded-full bg-primary animate-pulse mx-1 animation-delay-400"></div>
        </div>
    );
};
