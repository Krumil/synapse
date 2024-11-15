interface ChatMessageProps {
	content: string;
	role: 'user' | 'assistant';
	type?: 'agent' | 'tool';
}

export function ChatMessage({ content, role, type }: ChatMessageProps) {
	// Helper function to check if content is HTML
	const isHTML = (str: string) => {
		const trimmed = str.trim();
		return trimmed.startsWith('<') && trimmed.endsWith('>');
	};

	return (
		<div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
			<div
				className={`max-w-[80%] rounded-lg p-3 ${role === 'user'
						? 'bg-primary text-primary-foreground ml-4'
						: type === 'tool'
							? 'bg-orange-100 dark:bg-orange-900 mr-4'
							: 'bg-muted mr-4'
					}`}
			>
				{isHTML(content) ? (
					<div dangerouslySetInnerHTML={{ __html: content }} />
				) : (
					content
				)}
			</div>
		</div>
	);
}