export interface ChatMessage {
	content: string;
	role: 'user' | 'assistant';
	type?: 'agent' | 'tool';
}

export type ToolResponse = {
	type: 'transaction' | 'knowledge' | 'memory_update' | 'memory_retrieve' | 'error';
	message?: string;
	answer?: string;
	transactions?: any[];
	memory?: {
		preferences: Record<string, any>;
		importantInfo: Record<string, any>;
		lastUpdated: string;
	};
	details?: any;
	conversationHistory?: Array<{ sender: string; content: string }>;
};