// LangChain Tool: Stock Data Fetcher

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { MassiveService } from "../services/massive";

/*
Calculate technical indicators from price data
- RSI (Relative Strength Index): Measures overbought/oversold conditions
- SMA (Simple Moving Average): Shows price trends
*/

async function calculateStockMetrics(massiveService: MassiveService, ticker: string, aggregates: any[]) {
    const closes = aggregates.map((a) => a.c);
    const volumes = aggregates.map((a) => a.v);

    const latest = aggregates[aggregates.length - 1]!;
    const previous = aggregates[aggregates.length - 2];

    // Fetch technical indicators from Massive API in parallel
    const rsiData = await massiveService.getRSI(ticker, 14, 1);
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait 0.5s

    const sma10Data = await massiveService.getSMA(ticker, 10, 1);
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait 0.5s

    const sma20Data = await massiveService.getSMA(ticker, 20, 1);

    return {
        currentPrice: latest.c,
        previousClose: previous ? previous.c : latest.c,
        change: latest.c - (previous ? previous.c : latest.c),
        changePercent: previous ? ((latest.c - previous.c) / previous.c) * 100 : 0,
        dayHigh: latest.h,
        dayLow: latest.l,
        volume: latest.v,
        avgVolume: volumes.reduce((a, b) => a + b, 0) / volumes.length,
        rsi: rsiData[0]?.value || null,            // From Massive API
        sma10: sma10Data[0]?.value || null,        // From Massive API
        sma20: sma20Data[0]?.value || null,        // From Massive API
        priceRangeHigh: Math.max(...closes),
        priceRangeLow: Math.min(...closes),
    };
}


//Create the Stock Data Tool
export function createStockDataTool() {
    const massiveService = new MassiveService();

    return new DynamicStructuredTool({
        name: "get_stock_data",
        description: `
      Fetches comprehensive stock market data for a given ticker symbol.
      Use this when you need:
      - Current stock price
      - Price changes and trends
      - Trading volume
      - Technical indicators (RSI, moving averages)
      - Historical price ranges
      
      Input: A stock ticker symbol (e.g., "AAPL", "TSLA", "MSFT")
      Output: Detailed market data including price, volume, and technical analysis
    `,
        schema: z.object({
            ticker: z.string().describe("The stock ticker symbol (e.g., AAPL, TSLA)"),
        }),
        func: async ({ ticker }) => {
            console.log(`[Tool: get_stock_data] Fetching data for ${ticker}`);

            try {
                // Fetch 30 days of historical data
                const aggregates = await massiveService.getStockAggregates(ticker.toUpperCase(), 30);

                // Calculate metrics using Massive's technical indicator APIs
                const stockData = await calculateStockMetrics(massiveService, ticker.toUpperCase(), aggregates);

                // Return as formatted string that the LLM can read
                return JSON.stringify({
                    ticker: ticker.toUpperCase(),
                    ...stockData,
                    timestamp: new Date().toISOString(),
                }, null, 2);

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                console.error(`[Tool Error] get_stock_data:`, errorMessage);
                return `Error fetching stock data for ${ticker}: ${errorMessage}`;
            }
        },
    });
}