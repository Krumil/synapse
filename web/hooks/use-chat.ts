import { useState, useEffect, useRef } from 'react';
import { useAccount } from '@starknet-react/core';
import type { ChatMessage, ToolResponse, Memory } from '@/types/chat';
import { useTransaction } from '@/hooks/use-transaction';


export function useChat() {
	const [hasInitiatedConversation, setHasInitiatedConversation] = useState(false);
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const { address } = useAccount();
	const { handleTransaction, transactionStatus } = useTransaction();
	const [memory, setMemory] = useState<Memory>(() => {
		if (typeof window !== 'undefined') {
			const savedMemory = localStorage.getItem('chatMemory');
			return savedMemory ? JSON.parse(savedMemory) : {};
		}
		return {};
	});

	// Create a ref to store the latest transactionStatus
	const transactionStatusRef = useRef(transactionStatus);

	// Update the ref whenever transactionStatus changes
	useEffect(() => {
		transactionStatusRef.current = transactionStatus;
	}, [transactionStatus]);

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

	const waitForTransactionStatus = (): Promise<void> => {
		return new Promise((resolve) => {
			const checkStatus = () => {
				const currentStatus = transactionStatusRef.current;
				if (currentStatus === 'success' || currentStatus === 'error') {
					resolve();
				} else {
					setTimeout(checkStatus, 100); // Check every second
				}
			};
			checkStatus();
		});
	};

	const handleToolResponse = async (toolResponse: ToolResponse) => {
		if (toolResponse.type === 'transaction' && toolResponse.transactions) {
			const result = await handleTransaction(toolResponse.transactions);

			// Wait for transaction status to be confirmed
			await waitForTransactionStatus();

			if (result.status === 'error') {
				console.error('Transaction failed:', result.error);
			} else {
				console.log('Transaction successful:', result.hash);
			}
		} else if (toolResponse.type === 'memory_update' && toolResponse.memory) {
			setMemory(toolResponse.memory);
		} else if (toolResponse.type === 'wallet_balances') {
			setMessages((prev) => [
				...prev,
				{
					content: JSON.stringify({
						type: toolResponse.type,
						balances: toolResponse.data,
					}),
					role: 'assistant',
					type: 'tool',
				},
			]);
		} else if (toolResponse.type === 'top_protocols' && toolResponse.protocols) {
			setMessages((prev) => [
				...prev,
				{
					content: JSON.stringify({
						type: toolResponse.type,
						protocols: toolResponse.protocols,
						chain: toolResponse.chain,
						totalProtocols: toolResponse.totalProtocols,
						filteredProtocols: toolResponse.filteredProtocols,
					}),
					role: 'assistant',
					type: 'tool',
				},
			]);
		}
	};

	const handleDeleteMessage = (index: number) => {
		setMessages((prev: ChatMessage[]) => prev.filter((_: ChatMessage, i: number) => i !== index));
	};

	const processStreamMessage = async (data: any) => {
		switch (data.type) {
			case 'tool': {
				try {
					JSON.parse(data.content);
				} catch (e) {
					return;
				}
				const toolResponse: ToolResponse = JSON.parse(data.content);
				await handleToolResponse(toolResponse);
				break;
			}
			case 'agent_reasoning': {
				setMessages((prev) => {
					const lastMessage = prev[prev.length - 1];
					if (lastMessage?.role === 'assistant' && lastMessage?.type === 'agent_reasoning') {
						const updatedMessages = [...prev];
						updatedMessages[prev.length - 1] = {
							...lastMessage,
							content: lastMessage.content + '\n' + data.content,
						};
						return updatedMessages;
					}
					return [
						...prev,
						{
							content: data.content,
							role: 'assistant',
							type: data.type,
						},
					];
				});
				break;
			}
			case 'agent': {
				setMessages((prev) => {
					return [
						...prev,
						{
							content: data.content,
							role: 'assistant',
							type: data.type,
						},
					];
				});
				break;
			}
			default: {
				setMessages((prev) => {
					return [
						...prev,
						{
							content: data.content,
							role: 'assistant',
							type: data.type,
						},
					];
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
					messages: [{ role: 'user', content: 'START_CONVERSATION' }],
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
							const data = JSON.parse(line.slice(6)); // Adjusted slice to account for 'data: '
							await processStreamMessage(data);
						} catch (error) {
							console.error('Error parsing SSE message:', error);
							setMessages((prev) => [
								...prev,
								{
									role: 'assistant',
									content: 'Sorry, there was an error processing the response.',
									type: 'agent',
								},
							]);
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
			setMessages((prev) => [
				...prev,
				{
					content: 'Please connect your wallet first',
					role: 'assistant',
					type: 'agent',
				},
			]);
			setTimeout(() => {
				setMessages((prev) => prev.slice(0, -1));
			}, 3000);
			return;
		}

		const userMessage = input.trim();
		setInput('');
		setIsLoading(true);

		setMessages((prev) => [
			...prev,
			{
				role: 'user',
				content: userMessage,
			},
		]);

		try {
			// Update memory reading from local storage
			const savedMemory = localStorage.getItem('chatMemory');
			const existingMemory = savedMemory ? JSON.parse(savedMemory) : {};
			const filteredMessages = messages.filter(msg =>
				msg.role === 'user' || (msg.role === 'assistant' && msg.type === 'agent')
			);

			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					message: userMessage,
					messages: [...filteredMessages, { role: 'user', content: userMessage }],
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
							const data = JSON.parse(line.slice(6)); // Adjusted slice to account for 'data: '
							await processStreamMessage(data);
						} catch (error) {
							console.error('Error parsing SSE message:', error);
							setMessages((prev) => [
								...prev,
								{
									role: 'assistant',
									content: 'Sorry, there was an error processing the response.',
									type: 'agent',
								},
							]);
						}
					}
				}
			}
		} catch (error) {
			console.error('Error sending message:', error);
			setMessages((prev) => [
				...prev,
				{
					role: 'assistant',
					content: 'Sorry, there was an error processing your message.',
				},
			]);
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
		handleDeleteMessage,
		memory,
	};
}
