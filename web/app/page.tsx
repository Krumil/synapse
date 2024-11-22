'use client';

import { Header } from '@/components/Header';
import { ChatMessage } from '@/components/Chat/ChatMessage';
import { ChatInput } from '@/components/Chat/ChatInput';
import { useChat } from '@/hooks/use-chat';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRef, useEffect } from "react";
import type { } from 'ldrs'
import 'ldrs/mirage'


export default function Home() {
	const scrollAreaRef = useRef<any>(null);
	const { messages, input, isLoading, setInput, handleSend } = useChat();

	useEffect(() => {
		console.log('messages', messages);
		const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
		if (viewport) {
			viewport.scrollTop = viewport.scrollHeight;
		}
	}, [messages]);

	return (
		<div className="grid grid-rows-[auto_1fr_auto] min-h-screen">
			<Header />

			<main className="max-w-3xl mx-auto w-full pt-24">
				<Card className="p-1 relative z-20 border-0 bg-transparent shadow-none backdrop-blur-sm h-[calc(100vh-12rem)]">
					<ScrollArea className="h-full" ref={scrollAreaRef}>
						<div className="flex flex-col gap-4 px-3">
							{messages.map((message, index) => (
								<ChatMessage key={index} {...message} />
							))}
							<div className="flex justify-center py-4">
								{isLoading && (
									<div
										className="animate-in fade-in duration-500"
										style={{ animationTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
									>
										<l-mirage
											size="105"
											speed="2.5"
											color="currentColor"
										></l-mirage>
									</div>
								)}
							</div>
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
	);
}
