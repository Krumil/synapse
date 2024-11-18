'use client';

import { Header } from '@/components/Header';
import { ChatMessage } from '@/components/Chat/ChatMessage';
import { ChatInput } from '@/components/Chat/ChatInput';
import { useChat } from '@/hooks/use-chat';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRef, useEffect } from "react";
import { BackgroundLines } from "@/components/ui/background-lines";

export default function Home() {
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const { messages, input, isLoading, setInput, handleSend } = useChat();

	useEffect(() => {
		if (scrollAreaRef.current) {
			scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
		}
	}, [messages]);

	return (
		<BackgroundLines>
			<div className="grid grid-rows-[auto_1fr_auto] min-h-screen">
				<Header />

				<main className="max-w-3xl mx-auto w-full pt-24 px-2">
					<Card className="p-6 relative z-20 border-0 bg-transparent shadow-none backdrop-blur-sm h-[calc(100vh-12rem)]">
						<ScrollArea className="h-full" ref={scrollAreaRef}>
							<div className="flex flex-col gap-4">
								{messages.map((message, index) => (
									<ChatMessage key={index} {...message} />
								))}
								{isLoading && (
									<ChatMessage role="assistant" content="Thinking..." />
								)}
							</div>
						</ScrollArea>
					</Card>
				</main>

				<div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-50">
					<ChatInput
						input={input}
						isLoading={isLoading}
						onInputChange={setInput}
						onSend={handleSend}
					/>
				</div>
			</div>
		</BackgroundLines>
	);
}