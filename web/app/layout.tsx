import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "./providers";
import { Space_Grotesk } from "next/font/google";
import { Syne } from "next/font/google";
import { Opulento } from "uvcanvas";
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

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    minimumScale: 1,
    maximumScale: 5,
    viewportFit: "cover",
    userScalable: true,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning data-lt-installed="true">
            <body
                className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${syne.variable} font-sans antialiased min-h-screen flex flex-col`}
            >
                <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
                    <Providers>
                        <div className="fixed inset-0 -z-10">
                            <div className="absolute inset-0 bg-background/90"></div>
                            <Opulento />
                        </div>
                        <main className="flex-1 w-full">{children}</main>
                    </Providers>
                </ThemeProvider>
            </body>
        </html>
    );
}
