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
	const [hasInitiatedConversation, setHasInitiatedConversation] = useState(false);
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [pendingToolResponses, setPendingToolResponses] = useState<ToolResponse[]>([]);
	const { address } = useAccount();
	const { handleTransaction } = useTransaction();
	const [memory, setMemory] = useState<Memory>(() => {
		if (typeof window !== 'undefined') {
			const savedMemory = localStorage.getItem('chatMemory');
			return savedMemory ? JSON.parse(savedMemory) : {};
		}
		return {};
	});
	const [agentMessageReceived, setAgentMessageReceived] = useState(false);

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

	useEffect(() => {
		const processToolResponses = async () => {
			if (agentMessageReceived && pendingToolResponses.length > 0) {
				for (const toolResponse of pendingToolResponses) {
					await handleToolResponse(toolResponse);
				}
				setPendingToolResponses([]);
				setAgentMessageReceived(false);
			}
		};

		processToolResponses();
	}, [agentMessageReceived, pendingToolResponses]);

	const handleToolResponse = async (toolResponse: ToolResponse) => {
		if (toolResponse.type === 'transaction' && toolResponse.transactions) {
			const toAddress = toolResponse.details?.data?.toAddress || undefined;
			await handleTransaction(toolResponse.transactions, toAddress);
		} else if (toolResponse.type === 'memory_update' && toolResponse.memory) {
			setMemory(toolResponse.memory);
		}
	};

	const processStreamMessage = async (data: any) => {
		console.log(data);
		switch (data.type) {
			case 'tool': {
				const toolResponse: ToolResponse = JSON.parse(data.content);
				setPendingToolResponses(prev => [...prev, toolResponse]);
				break;
			}
			case 'agent_reasoning': {
				setMessages(prev => {
					const lastMessage = prev[prev.length - 1];
					if (lastMessage?.role === 'assistant' && lastMessage?.type === 'agent_reasoning') {
						const updatedMessages = [...prev];
						updatedMessages[prev.length - 1] = {
							...lastMessage,
							content: lastMessage.content + '\n' + data.content
						};
						return updatedMessages;
					}
					return [...prev, {
						content: data.content,
						role: 'assistant',
						type: data.type,
					}];
				});
				break;
			}
			case 'agent': {
				setAgentMessageReceived(true);
				setMessages(prev => {
					return [...prev, {
						content: data.content,
						role: 'assistant',
						type: data.type,
					}];
				});
				break;
			}
			default: {
				setMessages(prev => {
					return [...prev, {
						content: data.content,
						role: 'assistant',
						type: data.type,
					}];
				});
				break;
			}
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