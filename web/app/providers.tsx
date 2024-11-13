'use client';

import { Connector, StarknetConfig, publicProvider } from '@starknet-react/core';
import { mainnet, sepolia } from "@starknet-react/chains";
import { InjectedConnector } from "starknetkit/injected";
import { WebWalletConnector } from "starknetkit/webwallet";
import { type ReactNode } from 'react';

const chains = [mainnet, sepolia];
const connectors = [
	new InjectedConnector({ options: { id: "braavos", name: "Braavos" } }),
	new InjectedConnector({ options: { id: "argentX", name: "Argent X" } }),
	new WebWalletConnector({ url: "https://web.argent.xyz" })
];

export function Providers({ children }: { children: ReactNode }) {
	return (
		<StarknetConfig
			chains={chains}
			provider={publicProvider()}
			connectors={connectors as Connector[]}
		>
			{children}
		</StarknetConfig>
	);
}