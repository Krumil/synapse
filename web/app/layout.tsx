
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "./providers";
import { SparklesCore } from '@/components/ui/sparkles';
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

export const metadata: Metadata = {
	title: "Create Next App",
	description: "Generated by create next app",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<script
					type="module"
					defer
					src="https://cdn.jsdelivr.net/npm/ldrs/dist/auto/mirage.js"
				></script>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					<Providers>
						<div className="w-full absolute inset-0 h-screen">
							<SparklesCore
								id="tsparticlesfullpage"
								background="transparent"
								minSize={0.6}
								maxSize={1.4}
								particleDensity={100}
								className="w-full h-full"
								particleColor="#FFFFFF"
							/>
						</div>
						{children}
					</Providers>
				</ThemeProvider>
			</body>
		</html>
	);
}

