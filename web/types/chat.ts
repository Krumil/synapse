export interface ChatMessage {
	content: string;
	role: 'user' | 'assistant';
	type?: 'agent' | 'tool';
}

export interface ToolResponse {
	type: 'transaction' | 'memory_update' | string;
	status?: string;
	memory?: {
		preferences?: {
			risk_tolerance?: string;
			experience_level?: string;
			timeframe?: string;
			investment_goals?: string;
		};
		importantInfo?: Record<string, any>;
		lastUpdated?: string;
	};
	transactions?: any[];
	details?: {
		data?: {
			toAddress?: string;
		};
	};
	message?: string;
}