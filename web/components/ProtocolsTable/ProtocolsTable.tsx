import { useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
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

type SortField = keyof Pick<Protocol, 'project' | 'symbol' | 'tvlUsd' | 'apy' | 'apyBase' | 'apyReward'>;
type SortDirection = 'asc' | 'desc';

export function ProtocolsTable({ chain, totalProtocols, filteredProtocols, protocols }: ProtocolsTableProps) {
	const [sortField, setSortField] = useState<SortField>('tvlUsd');
	const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

	const formatNumber = (num: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(num);
	};

	const formatPercentage = (num: number | null) => {
		if (num === null || isNaN(num)) return '-';
		return `${num.toFixed(2)}%`;
	};

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
		} else {
			setSortField(field);
			setSortDirection('desc');
		}
	};

	const getSortedProtocols = () => {
		return [...protocols].sort((a, b) => {
			const aValue = a[sortField];
			const bValue = b[sortField];

			if (aValue === null) return 1;
			if (bValue === null) return -1;

			const comparison = typeof aValue === 'string'
				? aValue.localeCompare(bValue as string)
				: (aValue as number) - (bValue as number);

			return sortDirection === 'asc' ? comparison : -comparison;
		});
	};

	const getSortIcon = (field: SortField) => {
		if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4" />;
		return sortDirection === 'asc'
			? <ArrowUp className="ml-2 h-4 w-4" />
			: <ArrowDown className="ml-2 h-4 w-4" />;
	};

	const sortableHeaderClass = "cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between";

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
						<TableHead className={sortableHeaderClass} onClick={() => handleSort('project')}>
							<span className="flex items-center">
								Project {getSortIcon('project')}
							</span>
						</TableHead>
						<TableHead className={sortableHeaderClass} onClick={() => handleSort('symbol')}>
							<span className="flex items-center">
								Symbol {getSortIcon('symbol')}
							</span>
						</TableHead>
						<TableHead className={sortableHeaderClass} onClick={() => handleSort('tvlUsd')}>
							<span className="flex items-center justify-end">
								TVL {getSortIcon('tvlUsd')}
							</span>
						</TableHead>
						<TableHead className={sortableHeaderClass} onClick={() => handleSort('apy')}>
							<span className="flex items-center justify-end">
								APY {getSortIcon('apy')}
							</span>
						</TableHead>
						<TableHead className={sortableHeaderClass} onClick={() => handleSort('apyBase')}>
							<span className="flex items-center justify-end">
								Base APY {getSortIcon('apyBase')}
							</span>
						</TableHead>
						<TableHead className={sortableHeaderClass} onClick={() => handleSort('apyReward')}>
							<span className="flex items-center justify-end">
								Reward APY {getSortIcon('apyReward')}
							</span>
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