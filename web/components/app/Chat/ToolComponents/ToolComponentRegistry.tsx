import { WalletBalancesTool } from "./WalletBalancesTool";
import { TopProtocolsTool } from "./TopProtocolsTool";
import { StarknetFeedsTool } from "./StarknetFeedsTool";
import { ComponentType, ReactNode } from "react";

export interface ToolComponent {
    data: any;
    contentString?: string;
    onAddToGrid?: (component: ReactNode, header?: ReactNode) => void;
}

export const TOOL_COMPONENTS: Record<string, ComponentType<ToolComponent>> = {
    wallet_balances: WalletBalancesTool,
    top_protocols: TopProtocolsTool,
    starknet_feeds: StarknetFeedsTool,
};
