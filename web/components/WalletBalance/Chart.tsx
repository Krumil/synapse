"use client";

import * as React from 'react';
import { Label, Pie, PieChart } from 'recharts';

import {
	Card,
	CardDescription,
	CardTitle,
} from "@/components/ui/card";
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

interface TokenBalance {
	name: string;
	symbol: string;
	valueUSD: string | null;
}

interface ChartProps {
	data: TokenBalance[];
}

export function Chart({ data }: ChartProps) {
	// Filter out tokens with no USD value or null value
	const validTokens = data.filter(
		(token) => token.valueUSD && parseFloat(token.valueUSD) > 0
	);

	// Calculate total value
	const totalValue = React.useMemo(() =>
		validTokens.reduce((sum, token) => sum + parseFloat(token.valueUSD!), 0)
		, [validTokens]);

	// Prepare chart data and sort by value
	const chartData = React.useMemo(() => {
		return validTokens
			.map((token, index) => ({
				name: token.name,
				symbol: token.symbol,
				value: parseFloat(token.valueUSD!),
				fill: `hsl(var(--chart-${(index % 5) + 1}))`,
			}))
			.sort((a, b) => b.value - a.value); // Sort in descending order
	}, [validTokens]);

	// Create chart config (using sorted order)
	const chartConfig = React.useMemo(() => {
		return chartData.reduce((config, token, index) => {
			const symbol = token.symbol.toLowerCase();
			config[symbol] = {
				label: token.name,
				color: `hsl(var(--chart-${(index % 5) + 1}))`, // Use index after sorting
			};
			return config;
		}, {} as ChartConfig);
	}, [chartData]);

	return (
		<Card className="flex flex-col">
			<div className="flex flex-row p-6 gap-6">
				{/* Left side: Title and Legend */}
				<div className="flex flex-col gap-6">
					<div>
						<CardTitle className="text-2xl">Portfolio Balance</CardTitle>
						<CardDescription>Current Holdings</CardDescription>
					</div>

					{/* Legend */}
					<div className="flex flex-col gap-2">
						{chartData.map((token) => (
							<div key={token.symbol} className="flex items-center gap-2">
								<div
									className="w-3 h-3 rounded-full"
									style={{ backgroundColor: token.fill }}
								/>
								<span className="text-sm font-medium">{token.name}</span>
								<span className="text-sm text-muted-foreground ml-auto">
									${parseFloat(token.value.toString()).toLocaleString(undefined, {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
								</span>
							</div>
						))}
					</div>
				</div>

				{/* Right side: Chart */}
				<div className="flex-1">
					<ChartContainer
						config={chartConfig}
						className="aspect-square w-full max-w-[350px] ml-auto"
					>
						<PieChart>
							<ChartTooltip
								cursor={false}
								content={<ChartTooltipContent hideLabel />}
							/>
							<Pie
								data={chartData}
								dataKey="value"
								nameKey="symbol"
								innerRadius={80}
								outerRadius="100%"
								strokeWidth={5}
							>
								<Label
									content={({ viewBox }) => {
										if (viewBox && "cx" in viewBox && "cy" in viewBox) {
											return (
												<text
													x={viewBox.cx}
													y={viewBox.cy}
													textAnchor="middle"
													dominantBaseline="middle"
												>
													<tspan
														x={viewBox.cx}
														y={viewBox.cy}
														className="fill-foreground text-3xl font-bold"
													>
														${totalValue.toLocaleString(undefined, {
															minimumFractionDigits: 2,
															maximumFractionDigits: 2,
														})}
													</tspan>
													<tspan
														x={viewBox.cx}
														y={(viewBox.cy || 0) + 24}
														className="fill-muted-foreground"
													>
														Total Value
													</tspan>
												</text>
											);
										}
									}}
								/>
							</Pie>
						</PieChart>
					</ChartContainer>
				</div>
			</div>
		</Card>
	);
}