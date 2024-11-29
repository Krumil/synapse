'use client';

import { Header } from '@/components/Header';
import { ChatMessage } from '@/components/Chat/ChatMessage';
import { ChatInput } from '@/components/Chat/ChatInput';
import { useChat } from '@/hooks/use-chat';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRef, useEffect, useState, useCallback } from "react";
import type { } from 'ldrs'
import 'ldrs/mirage'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function Home() {
	const scrollAreaRef = useRef<any>(null);
	const { messages, input, isLoading, setInput, handleSend } = useChat();
	const [showDisclaimer, setShowDisclaimer] = useState(true);
	const [optionsClicked, setOptionsClicked] = useState(false);

	const handleOptionClick = useCallback((value: string) => {
		setInput(value);
		setOptionsClicked(true);
	}, [setInput]);

	useEffect(() => {
		// Check if user has seen the disclaimer
		const hasSeenSynapseDisclaimer = localStorage.getItem('hasSeenSynapseDisclaimer');
		if (hasSeenSynapseDisclaimer) {
			setShowDisclaimer(false);
		}
	}, []);

	const handleDisclaimerClose = () => {
		localStorage.setItem('hasSeenSynapseDisclaimer', 'true');
		setShowDisclaimer(false);
	};

	useEffect(() => {
		const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
		if (viewport) {
			viewport.scrollTop = viewport.scrollHeight;
		}
	}, [messages]);

	useEffect(() => {
		if (optionsClicked) {
			handleSend();
			setOptionsClicked(false);
		}
	}, [input]);

	const handleInputChange = useCallback((value: string) => {
		setInput(value);
	}, []);

	const handleMessageSend = useCallback(() => {
		handleSend();
	}, [handleSend]);

	return (
		<div className="grid grid-rows-[auto_1fr_auto] min-h-screen">
			<Dialog
				open={showDisclaimer}
				onOpenChange={(open) => {
					// Only allow closing through the button click
					if (!open && !localStorage.getItem('hasSeenSynapseDisclaimer')) {
						setShowDisclaimer(true);
					}
				}}
			>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Important Disclaimer</DialogTitle>
						<DialogDescription className="space-y-4">
							<p>
								Welcome! Please note that this application is an experimental project developed for a hackathon and is currently in beta.
							</p>
							<p>
								Any financial information or suggestions provided by this application should not be considered as financial advice. This tool is for educational and experimental purposes only.
							</p>
							<p>
								Please consult with qualified financial professionals before making any investment or financial decisions.
							</p>
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button onClick={handleDisclaimerClose}>I Understand</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Header />

			<main className="max-w-3xl mx-auto w-full pt-24">
				<Card className="p-1  relative z-20 border-0 bg-transparent shadow-none backdrop-blur-sm h-[calc(100vh-12rem)]">
					<ScrollArea className="h-full" ref={scrollAreaRef}>
						<div className="flex flex-col gap-4 px-3">
							{messages.map((message, index) => (
								<ChatMessage key={index} {...message} onOptionClick={handleOptionClick} />
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
					onInputChange={handleInputChange}
					onSend={handleMessageSend}
				/>
			</div>
		</div>
	);
}