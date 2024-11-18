import { ThemeToggle } from "@/components/theme-toggle";
import WalletSection from '@/components/WalletSection';

export function Header() {
	return (
		<header className="fixed top-0 left-0 right-0 max-w-3xl mx-auto w-full z-50">
			<div className="flex justify-between items-center p-4">
				<h1 className="text-4xl font-bold">Synapse</h1>
				<div className="flex items-center gap-4">
					<ThemeToggle />
					<WalletSection />
				</div>
			</div>
		</header>
	);
}