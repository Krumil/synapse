"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";

import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

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
    const validTokens = data.filter((token) => token.valueUSD && parseFloat(token.valueUSD) > 0);

    // Calculate total value
    const totalValue = React.useMemo(
        () => validTokens.reduce((sum, token) => sum + parseFloat(token.valueUSD!), 0),
        [validTokens]
    );

    // Prepare chart data and sort by value
    const chartData = React.useMemo(() => {
        return validTokens
            .map((token, index) => ({
                name: token.name,
                symbol: token.symbol,
                value: parseFloat(token.valueUSD!),
                fill: `hsl(var(--chart-${(index % 20) + 1}))`,
            }))
            .sort((a, b) => b.value - a.value); // Sort in descending order
    }, [validTokens]);

    // Create chart config (using sorted order)
    const chartConfig = React.useMemo(() => {
        return chartData.reduce((config, token, index) => {
            const symbol = token.symbol.toLowerCase();
            config[symbol] = {
                label: token.name,
                color: `hsl(var(--chart-${(index % 20) + 1}))`,
            };
            return config;
        }, {} as ChartConfig);
    }, [chartData]);

    return (
        <div className="flex flex-col gap-6">
            {/* Top: Legend in two columns */}
            <div className="grid grid-cols-1 gap-x-6 gap-y-2">
                {chartData.map((token) => (
                    <div key={token.symbol} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: token.fill }} />
                        <span className="text-sm font-medium">{token.name}</span>
                        <span className="text-sm text-muted-foreground ml-auto">
                            $
                            {parseFloat(token.value.toString()).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </span>
                    </div>
                ))}
            </div>

            {/* Bottom: Chart */}
            <div className="flex justify-center">
                <ChartContainer config={chartConfig} className="aspect-square w-full max-w-[350px]">
                    <PieChart>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
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
                                                    $
                                                    {totalValue.toLocaleString(undefined, {
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
    );
}
