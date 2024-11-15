import { useState } from 'react';
import { useAccount } from '@starknet-react/core';
import type { ChatMessage, ToolResponse } from '@/types/chat';
import { useTransaction } from '@/hooks/use-transaction';

export function useChat() {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState('add 10 USDC to the ETH/USDC pool on nostra');
	const [isLoading, setIsLoading] = useState(false);
	const { address } = useAccount();
	const { handleTransaction } = useTransaction();

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
					userId: address,
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

							if (data.type === 'tool') {
								const toolResponse: ToolResponse = JSON.parse(data.content);
								if (toolResponse.type === 'transaction' && toolResponse.transactions) {
									const toAddress = toolResponse.details.data?.toAddress || null;
									await handleTransaction(toolResponse.transactions, toAddress);
								}
								// if (toolResponse.type === 'knowledge') {
								// 	setMessages(prev => [...prev, {
								// 		role: 'assistant',
								// 		content: toolResponse.message || toolResponse.answer || 'Processed successfully.',
								// 		type: 'tool'
								// 	}]);
								// }
							} else {
								setMessages(prev => {
									if (data.type === 'agent' && prev.length > 0 && prev[prev.length - 1].type === 'agent') {
										return [...prev.slice(0, -1), {
											content: data.content,
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
	};
}