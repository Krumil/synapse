import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "./providers";
import { SparklesCore } from "@/components/ui/sparkles";
import { Opulento } from "uvcanvas";
import { Space_Grotesk } from "next/font/google";
import { Syne } from "next/font/google";

const geistSans = localFont({
    src: "./fonts/GeistVF.woff",
    variable: "--font-geist-sans",
    weight: "100 900",
});
const geistMono = localFont({
    src: "./fonts/GeistMonoVF.woff",
    variable: "--font-geist-mono",
    weight: "100 900",
});

const spaceGrotesk = Space_Grotesk({
    subsets: ["latin"],
    variable: "--font-space-grotesk",
});

const syne = Syne({
    subsets: ["latin"],
    variable: "--font-syne",
});

export const metadata: Metadata = {
    title: "Synapse",
    description: "Your personal DeFi AI assistant for Starknet",
    applicationName: "Synapse",
    appleWebApp: { capable: true, title: "Synapse", statusBarStyle: "default" },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning data-lt-installed="true">
            <body
                className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${syne.variable} font-sans antialiased`}
            >
                <script type="module" defer src="https://cdn.jsdelivr.net/npm/ldrs/dist/auto/mirage.js"></script>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                    <Providers>
                        <div className="w-full absolute inset-0 h-screen">
                            {/* <SparklesCore
								id="tsparticlesfullpage"
								background="transparent"
								minSize={0.6}
								maxSize={1.4}
								particleDensity={100}
								className="w-full h-full"
								particleColor="#FFFFFF"
							/> */}
                            <Opulento />
                        </div>
                        <main className="max-w-3xl mx-auto w-full px-4">{children}</main>
                    </Providers>
                </ThemeProvider>
            </body>
        </html>
    );
}
