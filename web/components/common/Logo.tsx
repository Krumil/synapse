"use client";
import * as React from "react";
import Image from "next/image";

export const Logo = () => {
    return (
        <div className="flex items-center gap-2">
            <Image
                src="/logo.png"
                alt="Synapse Logo"
                width={32}
                height={32}
                className="object-contain brightness-0 dark:brightness-0 dark:invert"
            />
            <span className="font-bold text-lg">Synapse</span>
        </div>
    );
};
