"use client";
import { TextGenerateEffect } from "../ui/text-generate-effect";
import { ChatMessage as ChatMessageType } from "../../types/chat";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"

export function ChatMessage({ content, role, type }: ChatMessageType) {
	// Helper function to convert newlines to <br> tags
	const formatContent = (text: string) => {
		return text.split('\n').map((line, i) => (
			<span key={i}>
				{line}
				{i !== text.split('\n').length - 1 && <br />}
			</span>
		));
	};

	if (!content) return null;
	return (
		<div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
			<div
				className={`max-w-[80%] rounded-lg ${type === 'agent_reasoning' ? 'px-3 py-1' : 'p-3'} ${role === 'user'
					? 'bg-primary text-primary-foreground ml-4'
					: type === 'tool'
						? 'bg-orange-100 dark:bg-orange-900 mr-4'
						: 'bg-muted mr-4'
					}`}
			>
				<div className="flex flex-col gap-2">
					{role === 'user' && (
						<div className="whitespace-pre-line">{content}</div>
					)}

					{role === 'assistant' && type === 'agent' && (
						<TextGenerateEffect words={content} className="whitespace-pre-line" />
					)}

					{type === 'agent_reasoning' && (
						<Collapsible className="w-full">
							<CollapsibleTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
										<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
									</svg>
									View Agent Reasoning
								</Button>
							</CollapsibleTrigger>
							<CollapsibleContent>
								<div className="text-sm text-muted-foreground bg-secondary/30 backdrop-blur-sm px-3 pb-2 rounded-lg border border-secondary/50">
									{formatContent(content)}
								</div>
							</CollapsibleContent>
						</Collapsible>
					)}
				</div>
			</div>
		</div>
	);
}