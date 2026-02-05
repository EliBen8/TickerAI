import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { ticker } = await request.json();

        if (!ticker) {
            return NextResponse.json(
                { valid: false, error: 'Ticker is required' },
                { status: 400 }
            );
        }

        const MASSIVE_API_KEY = process.env.MASSIVE_API_KEY;
        if (!MASSIVE_API_KEY) {
            throw new Error('Massive API key not configured');
        }

        // Quick validation: try to fetch ticker details from Massive API
        const response = await fetch(
            `https://api.massive.com/v3/reference/tickers/${ticker.toUpperCase()}?apiKey=${MASSIVE_API_KEY}`
        );

        if (response.status === 404) {
            // Ticker doesn't exist
            return NextResponse.json({
                valid: false,
                ticker: ticker.toUpperCase(),
            });
        }

        if (!response.ok) {
            // API error
            console.error(`Massive API validation error: ${response.status}`);
            return NextResponse.json({
                valid: false,
                error: 'Unable to validate ticker',
            });
        }

        const data = await response.json();

        // Check if we got valid results
        if (data.results && data.results.ticker) {
            return NextResponse.json({
                valid: true,
                ticker: data.results.ticker,
                name: data.results.name,
            });
        }

        // No results found
        return NextResponse.json({
            valid: false,
            ticker: ticker.toUpperCase(),
        });

    } catch (error) {
        console.error('Ticker validation error:', error);
        return NextResponse.json(
            {
                valid: false,
                error: 'Failed to validate ticker',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}