import { Button } from "@/components/ui/button"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChatMessage as ChatMessageType } from "@/types/chat"
interface ChatMessageProps {
	message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
	return (
		<div className="flex flex-col gap-2">
			<div className="message-content">
				{message.content}
			</div>

			{message.reasoning && (
				<Collapsible className="w-full">
					<CollapsibleTrigger asChild>
						<Button variant="ghost" size="sm" className="text-muted-foreground">
							View Reasoning
						</Button>
					</CollapsibleTrigger>
					<CollapsibleContent className="text-sm text-muted-foreground bg-muted p-4 rounded-md mt-2">
						{message.reasoning}
					</CollapsibleContent>
				</Collapsible>
			)}
		</div>
	)
} 