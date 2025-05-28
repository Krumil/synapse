import { WalletBalancesTool } from "./WalletBalancesTool";
import { TopProtocolsTool } from "./TopProtocolsTool";
import { TransactionTool } from "./TransactionTool";
import { XTool } from "./XTool";
import { StarknetEcosystemNewsTool } from "./StarknetEcosystemNewsTool";
import { ComponentType, ReactNode } from "react";

export interface ToolComponent {
    data: any;
    contentString?: string;
    onAddToGrid?: (component: ReactNode, header?: ReactNode) => void;
}

export interface ToolDimensions {
    w?: number; // width in grid units
    h?: number; // height in grid units
    minW?: number; // minimum width
    maxW?: number; // maximum width
    minH?: number; // minimum height
    maxH?: number; // maximum height
    x?: number; // preferred x position
    y?: number; // preferred y position
}

export interface ToolConfig {
    component: ComponentType<ToolComponent>;
    dimensions?: ToolDimensions;
}

// Default dimensions for all tools
export const DEFAULT_TOOL_DIMENSIONS: ToolDimensions = {
    w: 1,
    h: 1,
    minW: 1,
    maxW: 2,
    minH: 1,
    maxH: 3,
};

export const TOOL_COMPONENTS: Record<string, ComponentType<ToolComponent>> = {
    wallet_balances: WalletBalancesTool,
    top_protocols: TopProtocolsTool,
    transaction: TransactionTool,
    x_posts: XTool,
    starknet_ecosystem_news: StarknetEcosystemNewsTool,
};

// Enhanced tool registry with dimension configurations
export const TOOL_CONFIGS: Record<string, ToolConfig> = {
    wallet_balances: {
        component: WalletBalancesTool,
        dimensions: {
            w: 1,
            h: 2,
            minW: 1,
            maxW: 2,
            minH: 1,
            maxH: 3,
        },
    },
    top_protocols: {
        component: TopProtocolsTool,
        dimensions: {
            w: 1,
            h: 1,
            minW: 1,
            maxW: 3,
            minH: 1,
            maxH: 2,
        },
    },
    transaction: {
        component: TransactionTool,
        dimensions: {
            w: 1,
            h: 1,
            minW: 1,
            maxW: 2,
            minH: 1,
            maxH: 2,
        },
    },
    x_posts: {
        component: XTool,
        dimensions: {
            w: 1,
            h: 2,
            minW: 1,
            maxW: 2,
            minH: 1,
            maxH: 3,
        },
    },
    starknet_ecosystem_news: {
        component: StarknetEcosystemNewsTool,
        dimensions: {
            w: 1,
            h: 1,
            minW: 1,
            maxW: 3,
            minH: 1,
            maxH: 2,
        },
    },
};

// Helper function to get tool configuration with fallbacks
export function getToolConfig(toolType: string): ToolConfig {
    const config = TOOL_CONFIGS[toolType];
    if (config) {
        return {
            component: config.component,
            dimensions: { ...DEFAULT_TOOL_DIMENSIONS, ...config.dimensions },
        };
    }

    // Fallback to legacy registry
    const component = TOOL_COMPONENTS[toolType];
    if (component) {
        return {
            component,
            dimensions: DEFAULT_TOOL_DIMENSIONS,
        };
    }

    throw new Error(`No tool configuration found for type: ${toolType}`);
}

// Helper function to get just the dimensions for a tool type
export function getToolDimensions(toolType: string): ToolDimensions {
    try {
        const config = getToolConfig(toolType);
        return config.dimensions || DEFAULT_TOOL_DIMENSIONS;
    } catch {
        return DEFAULT_TOOL_DIMENSIONS;
    }
}
