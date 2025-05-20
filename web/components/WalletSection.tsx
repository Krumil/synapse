import { StarknetkitConnector, useStarknetkitConnectModal } from "starknetkit";
import { useConnect, useDisconnect, useAccount, Connector } from "@starknet-react/core";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, Wallet, LogOut, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function WalletSection() {
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();
    const { address, isConnected } = useAccount();
    const { toast } = useToast();
    const [isConnecting, setIsConnecting] = useState(false);
    const { starknetkitConnectModal } = useStarknetkitConnectModal({
        connectors: connectors as StarknetkitConnector[],
    });

    // Format address for display
    const formatAddress = (addr: string) => {
        if (!addr) return "";
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    // Copy address to clipboard
    const copyAddress = async () => {
        if (address) {
            await navigator.clipboard.writeText(address);
            toast({
                title: "Address copied",
                description: "Wallet address copied to clipboard",
                duration: 2000,
            });
        }
    };

    // Handle wallet connection
    async function handleConnect() {
        try {
            setIsConnecting(true);
            const { connector } = await starknetkitConnectModal();
            if (!connector) {
                return;
            }
            await connect({ connector: connector as Connector });

            toast({
                title: "Connected",
                description: "Wallet connected successfully. Starting your DeFi assessment...",
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Connection failed",
                description: "Failed to connect wallet. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsConnecting(false);
        }
    }

    // Handle wallet disconnection
    const handleDisconnect = async () => {
        try {
            await disconnect();
            toast({
                title: "Disconnected",
                description: "Wallet disconnected successfully",
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to disconnect wallet",
                variant: "destructive",
            });
        }
    };

    // View transaction history
    const viewTransactions = () => {
        if (address) {
            window.open(`https://starkscan.co/contract/${address}`, "_blank");
        }
    };

    return (
        <div className="relative">
            {isConnected ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2">
                            <Wallet className="h-4 w-4" />
                            {formatAddress(address || "")}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Address
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={viewTransactions} className="cursor-pointer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Transactions
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer text-red-600">
                            <LogOut className="mr-2 h-4 w-4" />
                            Disconnect
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <Button onClick={handleConnect} disabled={isConnecting} className="flex items-center gap-2">
                    {isConnecting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Connecting...
                        </>
                    ) : (
                        <>
                            <Wallet className="h-4 w-4" />
                            Connect Wallet
                        </>
                    )}
                </Button>
            )}
        </div>
    );
}
