"use client";

import React, { useEffect, useState, useRef } from "react";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";

interface ChartDataPoint {
    date: string;
    price: number;
    volume: number;
    high: number;
    low: number;
}

interface StockChartProps {
    ticker: string;
}

export default function StockChart({ ticker }: StockChartProps) {
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeframe, setTimeframe] = useState<"7D" | "30D" | "90D">("30D");

    const lastFetchedTicker = useRef<string>("");
    const lastFetchedTimeframe = useRef<"7D" | "30D" | "90D">("30D");

    useEffect(() => {
        if (
            ticker !== lastFetchedTicker.current ||
            timeframe !== lastFetchedTimeframe.current
        ) {
            fetchChartData();
            lastFetchedTicker.current = ticker;
            lastFetchedTimeframe.current = timeframe;
        }
    }, [ticker, timeframe]);

    const fetchChartData = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/stock-chart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticker, timeframe }),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch chart data");
            }

            const result = await response.json();

            if (result.success) {
                setChartData(result.data);
            } else {
                setError(result.error || "Failed to load chart data");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error occurred");
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (value: number) => `$${value.toFixed(2)}`;
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    if (loading) {
        return (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-center h-80">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    <span className="ml-3 text-gray-400">Loading chart...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gray-900 border border-red-900 rounded-lg p-6">
                <div className="text-center">
                    <p className="text-red-400 mb-2">Failed to load chart</p>
                    <p className="text-gray-500 text-sm">{error}</p>
                    <button
                        onClick={fetchChartData}
                        className="mt-3 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (chartData.length === 0) {
        return (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <div className="text-center text-gray-500">
                    No chart data available for this ticker and timeframe
                </div>
            </div>
        );
    }

    const latestData = chartData[chartData.length - 1];
    const firstData = chartData[0];
    const change = latestData!.price - firstData!.price;
    const changePercent = (change / firstData!.price) * 100;
    const isPositive = change >= 0;

    const maxPrice = Math.max(...chartData.map((d) => d.high));
    const minPrice = Math.min(...chartData.map((d) => d.low));
    const priceRange = maxPrice - minPrice;

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            {/* Header - DARK */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        {isPositive ? (
                            <TrendingUp className="w-6 h-6 text-green-400" />
                        ) : (
                            <TrendingDown className="w-6 h-6 text-red-400" />
                        )}
                        <h3 className="text-xl font-semibold text-white">
                            {ticker} Price Chart
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-2xl font-bold text-white">
                            {formatPrice(latestData!.price)}
                        </span>
                        <span
                            className={`font-semibold ${isPositive ? "text-green-400" : "text-red-400"
                                }`}
                        >
                            {isPositive ? "+" : ""}
                            {change.toFixed(2)} ({changePercent.toFixed(2)}%)
                        </span>
                    </div>
                </div>

                {/* Timeframe Selector - DARK */}
                <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
                    {(["7D", "30D", "90D"] as const).map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${timeframe === tf
                                    ? "bg-green-600 text-white"
                                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                                }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart - DARK */}
            <div className="relative h-64 bg-gray-800 rounded-lg border border-gray-700 p-4">
                <svg className="w-full h-full" viewBox="0 0 800 200">
                    {/* Grid lines */}
                    {[0, 1, 2, 3, 4].map((i) => (
                        <line
                            key={i}
                            x1="0"
                            y1={i * 50}
                            x2="800"
                            y2={i * 50}
                            stroke="#374151"
                            strokeWidth="1"
                        />
                    ))}

                    {/* Price line */}
                    <polyline
                        fill="none"
                        stroke={isPositive ? "#10b981" : "#ef4444"}
                        strokeWidth="2"
                        points={chartData
                            .map((d, i) => {
                                const x = (i / (chartData.length - 1)) * 800;
                                const y = 200 - ((d.price - minPrice) / priceRange) * 200;
                                return `${x},${y}`;
                            })
                            .join(" ")}
                    />

                    {/* Area fill */}
                    <polygon
                        fill="url(#gradient)"
                        points={
                            chartData
                                .map((d, i) => {
                                    const x = (i / (chartData.length - 1)) * 800;
                                    const y = 200 - ((d.price - minPrice) / priceRange) * 200;
                                    return `${x},${y}`;
                                })
                                .join(" ") + " 800,200 0,200"
                        }
                    />

                    {/* Gradient definition */}
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop
                                offset="0%"
                                stopColor={isPositive ? "#10b981" : "#ef4444"}
                                stopOpacity="0.3"
                            />
                            <stop
                                offset="100%"
                                stopColor={isPositive ? "#10b981" : "#ef4444"}
                                stopOpacity="0"
                            />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Y-axis labels - DARK */}
                <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-xs text-gray-400 py-4">
                    <span>${maxPrice.toFixed(0)}</span>
                    <span>${((maxPrice + minPrice) / 2).toFixed(0)}</span>
                    <span>${minPrice.toFixed(0)}</span>
                </div>

                {/* X-axis labels - DARK */}
                <div className="absolute bottom-0 left-16 right-0 flex justify-between text-xs text-gray-400 pb-2">
                    <span>{formatDate(chartData[0]?.date || "")}</span>
                    <span>{timeframe}</span>
                    <span>
                        {formatDate(chartData[chartData.length - 1]?.date || "")}
                    </span>
                </div>
            </div>

            {/* Chart Stats - DARK */}
            <div className="grid grid-cols-4 gap-4 mt-6">
                <div>
                    <div className="text-xs text-gray-500">Day High</div>
                    <div className="text-lg font-semibold text-white">
                        ${latestData!.high.toFixed(2)}
                    </div>
                </div>
                <div>
                    <div className="text-xs text-gray-500">Day Low</div>
                    <div className="text-lg font-semibold text-white">
                        ${latestData!.low.toFixed(2)}
                    </div>
                </div>
                <div>
                    <div className="text-xs text-gray-500">Volume</div>
                    <div className="text-lg font-semibold text-white">
                        {latestData!.volume.toLocaleString()}
                    </div>
                </div>
                <div>
                    <div className="text-xs text-gray-500">Range</div>
                    <div className="text-lg font-semibold text-white">
                        ${priceRange.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Chart Info - DARK */}
            <div className="mt-4 text-xs text-gray-500 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                    Showing {timeframe} price movement • Data from Massive
                </span>
            </div>
        </div>
    );
}