import { useState, useEffect } from 'react';
import { useAccount } from '@starknet-react/core';
import type { ChatMessage, ToolResponse } from '@/types/chat';
import { useTransaction } from '@/hooks/use-transaction';

interface Memory {
	preferences?: {
		risk_tolerance?: string;
		experience_level?: string;
		timeframe?: string;
		investment_goals?: string;
	};
	importantInfo?: Record<string, any>;
	lastUpdated?: string;
}

export function useChat() {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const { address } = useAccount();
	const { handleTransaction } = useTransaction();
	const [hasInitiatedConversation, setHasInitiatedConversation] = useState(false);
	const [memory, setMemory] = useState<Memory>(() => {
		if (typeof window !== 'undefined') {
			const savedMemory = localStorage.getItem('chatMemory');
			return savedMemory ? JSON.parse(savedMemory) : {};
		}
		return {};
	});

	useEffect(() => {
		if (typeof window !== 'undefined' && Object.keys(memory).length > 0) {
			localStorage.setItem('chatMemory', JSON.stringify(memory));
		}
	}, [memory]);

	useEffect(() => {
		if (address && !hasInitiatedConversation) {
			setHasInitiatedConversation(true);
			handleInitialConversation();
		}
	}, [address]);

	const handleToolResponse = async (toolResponse: ToolResponse) => {
		if (toolResponse.type === 'transaction' && toolResponse.transactions) {
			const toAddress = toolResponse.details?.data?.toAddress || undefined;
			await handleTransaction(toolResponse.transactions, toAddress);
		} else if (toolResponse.type === 'memory_update' && toolResponse.memory) {
			setMemory(toolResponse.memory);
		}
	};

	const processStreamMessage = async (data: any) => {
		if (data.type === 'tool') {
			const toolResponse: ToolResponse = JSON.parse(data.content);
			await handleToolResponse(toolResponse);
		} else {
			setMessages(prev => {
				if (prev.length > 0 && prev[prev.length - 1].role === 'assistant') {
					return [...prev.slice(0, -1), {
						content: prev[prev.length - 1].content + '\n' + data.content,
						role: 'assistant',
						type: data.type,
					}];
				}
				return [...prev, {
					content: data.content,
					role: 'assistant',
					type: data.type,
				}];
			});
		}
	};

	const handleInitialConversation = async () => {
		setIsLoading(true);
		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					messages: [{ role: 'user', content: "START_CONVERSATION" }],
					address,
					userId: address,
					existingMemory: memory,
				}),
			});

			if (!response.body) throw new Error('No response body');

			const reader = response.body.getReader();
			const decoder = new TextDecoder();

			while (true) {
				const { value, done } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value);
				const lines = chunk.split('\n');

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						try {
							const data = JSON.parse(line.slice(5));
							await processStreamMessage(data);
						} catch (error) {
							console.error('Error parsing SSE message:', error);
							setMessages(prev => [...prev, {
								role: 'assistant',
								content: 'Sorry, there was an error processing the response.'
							}]);
						}
					}
				}
			}
		} catch (error) {
			console.error('Error initiating conversation:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSend = async () => {
		if (!input.trim() || isLoading) return;

		if (!address) {
			setMessages(prev => [...prev, {
				content: "Please connect your wallet first",
				role: 'assistant',
			}]);
			return;
		}

		const userMessage = input.trim();
		setInput('');
		setIsLoading(true);

		setMessages(prev => [...prev, {
			role: 'user',
			content: userMessage
		}]);

		try {
			// update memory reading from local storage
			const savedMemory = localStorage.getItem('chatMemory');
			const existingMemory = savedMemory ? JSON.parse(savedMemory) : {};

			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					message: userMessage,
					messages: [...messages, { role: 'user', content: userMessage }],
					address,
					userId: address,
					existingMemory,
				}),
			});

			if (!response.body) throw new Error('No response body');

			const reader = response.body.getReader();
			const decoder = new TextDecoder();

			while (true) {
				const { value, done } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value);
				const lines = chunk.split('\n');

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						try {
							const data = JSON.parse(line.slice(5));
							await processStreamMessage(data);
						} catch (error) {
							console.error('Error parsing SSE message:', error);
							setMessages(prev => [...prev, {
								role: 'assistant',
								content: 'Sorry, there was an error processing the response.'
							}]);
						}
					}
				}
			}
		} catch (error) {
			console.error('Error sending message:', error);
			setMessages(prev => [...prev, {
				role: 'assistant',
				content: 'Sorry, there was an error processing your message.'
			}]);
		} finally {
			setIsLoading(false);
		}
	};

	return {
		messages,
		input,
		isLoading,
		setInput,
		handleSend,
		memory,
	};
}