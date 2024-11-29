export interface ChatMessage {
	content: string;
	role: 'user' | 'assistant';
	type?: 'agent' | 'tool' | 'agent_reasoning' | 'wallet_balances';
}

export interface ToolResponse {
	type: 'transaction' | 'memory_update' | 'top_protocols' | string;
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
	data?: any;
	protocols?: any[];
	chain?: string;
	totalProtocols?: number;
	filteredProtocols?: number;
}

export interface Memory {
	preferences?: {
		risk_tolerance?: string;
		experience_level?: string;
		timeframe?: string;
		investment_goals?: string;
	};
	importantInfo?: Record<string, any>;
	lastUpdated?: string;
}