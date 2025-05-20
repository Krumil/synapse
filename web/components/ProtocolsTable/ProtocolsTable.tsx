import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface Protocol {
    project: string;
    symbol: string;
    tvlUsd: number;
    apy: number | null;
    apyBase: number | null;
    apyReward: number | null;
    stablecoin: boolean;
    ilRisk: string;
    exposure: string;
}

interface ProtocolsTableProps {
    chain: string;
    totalProtocols: number;
    filteredProtocols: number;
    protocols: Protocol[];
}

type SortField = keyof Pick<Protocol, "project" | "symbol" | "tvlUsd" | "apy" | "apyBase" | "apyReward">;
type SortDirection = "asc" | "desc";

export function ProtocolsTable({ chain, totalProtocols, filteredProtocols, protocols }: ProtocolsTableProps) {
    const [sortField, setSortField] = useState<SortField>("tvlUsd");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    const formatPercentage = (num: number | null) => {
        if (num === null || isNaN(num)) return "-";
        return `${num.toFixed(2)}%`;
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("desc");
        }
    };

    const getSortedProtocols = () => {
        return [...protocols].sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];

            if (aValue === null && bValue === null) return 0;
            if (aValue === null) return sortDirection === "asc" ? 1 : -1;
            if (bValue === null) return sortDirection === "asc" ? -1 : 1;

            if (typeof aValue === "string") {
                return sortDirection === "asc"
                    ? aValue.localeCompare(bValue as string)
                    : (bValue as string).localeCompare(aValue);
            }

            return sortDirection === "asc"
                ? (aValue as number) - (bValue as number)
                : (bValue as number) - (aValue as number);
        });
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4" />;
        return sortDirection === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
    };

    const sortableHeaderClass = "cursor-pointer hover:bg-muted/50 transition-colors";

    return (
        <div className="w-full space-y-4">
            <div className="flex flex-col space-y-1.5">
                <h3 className="font-semibold">Top Protocols on {chain}</h3>
                <p className="text-sm text-muted-foreground">
                    Showing {filteredProtocols} out of {totalProtocols} protocols
                </p>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className={sortableHeaderClass} onClick={() => handleSort("project")}>
                            <div className="flex items-center">Project {getSortIcon("project")}</div>
                        </TableHead>
                        <TableHead className={sortableHeaderClass} onClick={() => handleSort("symbol")}>
                            <div className="flex items-center">Symbol {getSortIcon("symbol")}</div>
                        </TableHead>
                        <TableHead className={`${sortableHeaderClass} text-right`} onClick={() => handleSort("tvlUsd")}>
                            <div className="flex items-center justify-end">TVL {getSortIcon("tvlUsd")}</div>
                        </TableHead>
                        <TableHead className={`${sortableHeaderClass} text-right`} onClick={() => handleSort("apy")}>
                            <div className="flex items-center justify-end">APY {getSortIcon("apy")}</div>
                        </TableHead>
                        <TableHead
                            className={`${sortableHeaderClass} text-right`}
                            onClick={() => handleSort("apyBase")}
                        >
                            <div className="flex items-center justify-end">Base APY {getSortIcon("apyBase")}</div>
                        </TableHead>
                        <TableHead
                            className={`${sortableHeaderClass} text-right`}
                            onClick={() => handleSort("apyReward")}
                        >
                            <div className="flex items-center justify-end">Reward APY {getSortIcon("apyReward")}</div>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {getSortedProtocols().map((protocol) => (
                        <TableRow key={`${protocol.project}-${protocol.symbol}`}>
                            <TableCell className="font-medium">{protocol.project}</TableCell>
                            <TableCell>{protocol.symbol}</TableCell>
                            <TableCell className="text-right">{formatNumber(protocol.tvlUsd)}</TableCell>
                            <TableCell className="text-right">{formatPercentage(protocol.apy)}</TableCell>
                            <TableCell className="text-right">{formatPercentage(protocol.apyBase)}</TableCell>
                            <TableCell className="text-right">{formatPercentage(protocol.apyReward)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
