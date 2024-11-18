import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";

interface ChatInputProps {
	input: string;
	isLoading: boolean;
	onInputChange: (value: string) => void;
	onSend: () => void;
}

export function ChatInput({ input, isLoading, onInputChange, onSend }: ChatInputProps) {
	const placeholders = [
		"Swap 0.1 ETH to USDC",
		"Check my Nostra LP positions",
		"What's the price of ETH on Starknet?",
		"Show my Nostra pool rewards",
		"Add liquidity to ETH/USDC pool",
		"Remove liquidity from USDC/USDT pool",
		"Show Starknet gas fees",
		"Check my token balances",
	];

	return (
		<div className="flex-1">
			<PlaceholdersAndVanishInput
				placeholders={placeholders}
				onChange={(e) => onInputChange(e.target.value)}
				onSubmit={(e) => {
					e.preventDefault();
					onSend();
				}}
			/>
		</div>
	);
}