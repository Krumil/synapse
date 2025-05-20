import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Synapse",
        short_name: "Synapse",
        description: "Your personal DeFi AI assistant for Starknet",
        start_url: "/",
        display: "standalone",
        background_color: "#0b0b0b",
        theme_color: "#0b0b0b",
        icons: [
            { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
    };
}
