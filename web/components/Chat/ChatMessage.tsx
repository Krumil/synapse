"use client";
import { motion } from "framer-motion";
import { TextGenerateEffect } from "../ui/text-generate-effect";
import { ChatMessage as ChatMessageType } from "../../types/chat";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { Chart } from "@/components/WalletBalance/Chart";
import { ProtocolsTable } from "@/components/ProtocolsTable/ProtocolsTable";
import { X } from "lucide-react";

export function ChatMessage({ content, role, type, onDelete }: ChatMessageType & { onDelete: () => void }) {
	const formatContent = (text: string) => {
		return text.split('\n').map((line, i) => (
			<span key={i}>
				{line}
				{i !== text.split('\n').length - 1 && <br />}
			</span>
		));
	};

	// Add this helper function to safely parse JSON content
	const parseToolContent = () => {
		try {
			return JSON.parse(content);
		} catch (e) {
			console.error(e);
			return null;
		}
	};

	if (!content) return null;

	// Get parsed content for tool responses
	const toolContent = type === 'tool' ? parseToolContent() : null;

	return (
		<div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3, ease: "easeOut" }}
				className={`rounded-lg relative ${type === 'agent_reasoning' ? 'px-3 py-1' : 'p-3'} ${role === 'user'
					? 'bg-primary text-primary-foreground ml-10'
					: type === 'tool'
						? 'bg-transparent mr-10 p-0 w-[100%]'
						: 'bg-muted mr-10'
					}`}
			>
				<button
					onClick={onDelete}
					className="absolute top-1/2 -translate-y-1/2 -right-[35px] p-1 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
				>
					<X size={20} />
				</button>

				<div className="flex flex-col gap-2">
					{role === 'user' && (
						<div className="whitespace-pre-line">{content}</div>
					)}

					{role === 'assistant' && type === 'agent' && (
						<TextGenerateEffect words={content} className="whitespace-pre-line" />
					)}

					{role === 'assistant' && type === 'tool' && toolContent?.type === 'wallet_balances' && (
						<div className="w-full">
							<Chart data={toolContent.balances} />
						</div>
					)}

					{role === 'assistant' && type === 'tool' && toolContent?.type === 'top_protocols' && (
						<ProtocolsTable
							chain={toolContent.chain}
							totalProtocols={toolContent.totalProtocols}
							filteredProtocols={toolContent.filteredProtocols}
							protocols={toolContent.protocols}
						/>
					)}

					{role === 'assistant' && type === 'tool' && toolContent?.type !== 'wallet_balances' && toolContent?.type !== 'top_protocols' && (
						<div className="whitespace-pre-line">{content}</div>
					)}

					{role === 'assistant' && type === 'agent_reasoning' && (
						<Collapsible className="w-full">
							<CollapsibleTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className="flex items-center w-full justify-start gap-2 text-muted-foreground hover:text-primary transition-colors"
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
			</motion.div>
		</div>
	);
}