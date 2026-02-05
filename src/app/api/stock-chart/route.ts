import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { ticker, timeframe = '30D' } = await request.json();

        if (!ticker) {
            return NextResponse.json(
                { success: false, error: 'Ticker symbol is required' },
                { status: 400 }
            );
        }

        const MASSIVE_API_KEY = process.env.MASSIVE_API_KEY;
        if (!MASSIVE_API_KEY) {
            throw new Error('Massive API key not configured');
        }

        // Calculate date ranges based on timeframe
        const today = new Date();
        let daysBack: number;

        switch (timeframe) {
            case '7D':
                daysBack = 7;
                break;
            case '90D':
                daysBack = 90;
                break;
            case '30D':
            default:
                daysBack = 30;
                break;
        }

        const startDate = new Date(today.getTime() - daysBack * 24 * 60 * 60 * 1000);
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = today.toISOString().split('T')[0];

        console.log(`Fetching chart data for ${ticker} from ${startDateStr} to ${endDateStr}`);

        // Fetch aggregated data from Massive
        const aggregatesUrl = `https://api.massive.com/v2/aggs/ticker/${ticker}/range/1/day/${startDateStr}/${endDateStr}?adjusted=true&sort=asc&apikey=${MASSIVE_API_KEY}`;

        const response = await fetch(aggregatesUrl);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Massive API Error:', errorText);
            throw new Error(`Failed to fetch chart data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Check if we have results
        if (!data.results || data.results.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'No chart data available for this ticker and timeframe'
            });
        }

        // Transform the data for the chart
        const chartData = data.results.map((item: any) => ({
            date: new Date(item.t).toISOString().split('T')[0], // Convert timestamp to date string
            price: parseFloat(item.c.toFixed(2)), // Close price
            volume: item.v, // Volume
            timestamp: item.t, // Original timestamp
            high: item.h,
            low: item.l,
            open: item.o
        }));

        console.log(`Successfully fetched ${chartData.length} data points for ${ticker}`);

        return NextResponse.json({
            success: true,
            data: chartData,
            meta: {
                ticker: ticker.toUpperCase(),
                timeframe,
                dataPoints: chartData.length,
                startDate: startDateStr,
                endDate: endDateStr
            }
        });

    } catch (error) {
        console.error('Stock Chart API Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch chart data',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}