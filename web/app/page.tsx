'use client';

import { Header } from '@/components/Header';
import { ChatMessage } from '@/components/Chat/ChatMessage';
import { ChatInput } from '@/components/Chat/ChatInput';
import { useChat } from '@/hooks/use-chat';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRef, useEffect } from "react";

export default function Home() {
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const { messages, input, isLoading, setInput, handleSend } = useChat();

	useEffect(() => {
		if (scrollAreaRef.current) {
			scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
		}
	}, [messages]);

	return (
		<div className="grid grid-rows-[auto_1fr_auto] min-h-screen p-8 gap-8 font-[family-name:var(--font-geist-sans)]">
			<Header />

			<main className="max-w-3xl mx-auto w-full">
				<Card className="p-6">
					<div className="flex-1">
						<ScrollArea className="h-[70vh]" ref={scrollAreaRef}>
							<div className="flex flex-col gap-4">
								{messages.map((message, index) => (
									<ChatMessage key={index} {...message} />
								))}
								{isLoading && (
									<ChatMessage role="assistant" content="Thinking..." />
								)}
							</div>
						</ScrollArea>
					</div>

					<ChatInput
						input={input}
						isLoading={isLoading}
						onInputChange={setInput}
						onSend={handleSend}
					/>
				</Card>
			</main>
		</div>
	);
}