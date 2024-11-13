import { useState } from 'react';
import { useAccount } from '@starknet-react/core';
import type { ChatMessage, ToolResponse } from '@/types/chat';
import { useTransaction } from '@/hooks/use-transaction';

export function useChat() {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const { address } = useAccount();
	const { handleTransaction } = useTransaction();

	const handleToolResponse = async (data: { type: string; content: string }) => {
		if (data.type === 'tool') {
			try {
				const toolResponse: ToolResponse = JSON.parse(data.content);

				if (toolResponse.type === 'transaction' && toolResponse.transactions) {
					await handleTransaction(toolResponse.transactions);
					setMessages(prev => [...prev, {
						role: 'assistant',
						content: toolResponse.message || 'Transaction processed successfully.',
						type: 'tool'
					}]);
				} else if (toolResponse.type === 'knowledge') {
					setMessages(prev => [...prev, {
						role: 'assistant',
						content: toolResponse.answer || 'No answer available.',
						type: 'tool'
					}]);
				} else {
					setMessages(prev => [...prev, {
						role: 'assistant',
						content: toolResponse.message || 'Processed successfully.',
						type: 'tool'
					}]);
				}
			} catch (error) {
				console.error('Error parsing tool response:', error);
				setMessages(prev => [...prev, {
					role: 'assistant',
					content: 'Sorry, there was an error processing the response.'
				}]);
			}
		} else {
			setMessages(prev => [...prev, {
				role: 'assistant',
				content: data.content
			}]);
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
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					message: userMessage,
					address,
				}),
			});

			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			const data = await response.json();
			await handleToolResponse(data);
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
	};
}