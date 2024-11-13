import { ThemeToggle } from "@/components/theme-toggle";
import WalletSection from '@/components/WalletSection';

export function Header() {
	return (
		<header className="max-w-3xl mx-auto w-full">
			<div className="flex justify-between items-center">
				<h1 className="text-4xl font-bold">Synapse</h1>
				<div className="flex items-center gap-4">
					<ThemeToggle />
					<WalletSection />
				</div>
			</div>
		</header>
	);
}