import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface ChatInputProps {
	input: string;
	isLoading: boolean;
	onInputChange: (value: string) => void;
	onSend: () => void;
}

export function ChatInput({ input, isLoading, onInputChange, onSend }: ChatInputProps) {
	return (
		<div className="flex gap-2 mt-4">
			<Input
				placeholder="Type your message..."
				value={input}
				onChange={(e) => onInputChange(e.target.value)}
				onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
				disabled={isLoading}
			/>
			<Button onClick={onSend} disabled={isLoading}>
				<Send className="h-4 w-4" />
			</Button>
		</div>
	);
}