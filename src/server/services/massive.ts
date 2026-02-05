//Massive API Service (formerly Polygon.io)

export interface StockAggregate {
    v: number;  // volume
    vw: number; // volume weighted average price
    o: number;  // open
    c: number;  // close
    h: number;  // high
    l: number;  // low
    t: number;  // timestamp (ms)
    n: number;  // num of transactions
}

export interface TickerDetails {
    ticker: string;
    name: string;
    market: string;
    locale: string;
    primary_exchange: string;
    type: string;
    active: boolean;
    currency_name: string;
    description?: string;
    market_cap?: number;
    total_employees?: number;
    list_date?: string;
    branding?: {
        logo_url?: string;
        icon_url?: string;
    };
}

export interface NewsArticle {
    id: string;
    publisher: {
        name: string;
        homepage_url?: string;
        logo_url?: string;
        favicon_url?: string;
    };
    title: string;
    author?: string;
    published_utc: string;
    article_url: string;
    tickers: string[];
    amp_url?: string;
    image_url?: string;
    description?: string;
    keywords?: string[];
    insights?: Array<{
        ticker: string;
        sentiment: string;
        sentiment_reasoning: string;
    }>;
}

export class MassiveService {
    private apiKey: string;
    private baseUrl = "https://api.massive.com"; // Updated to new Massive API base URL

    constructor() {
        this.apiKey = process.env.MASSIVE_API_KEY!;
        if (!this.apiKey) {
            throw new Error("MASSIVE_API_KEY is not configured in environment variables");
        }
    }

    // Fetch wrapper
    private async fetchAPI<T>(endpoint: string): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        console.log(`[Massive API] Fetching: ${endpoint}`);

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Massive API Error] ${response.status}:`, errorText);
            throw new Error(`Massive API failed: ${response.status} ${response.statusText}`);
        }

        return response.json() as Promise<T>;
    }


    // Get stock aggregates (candlestick data)

    async getStockAggregates(ticker: string, days = 30): Promise<StockAggregate[]> {
        const today = new Date();
        const startDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);

        const todayStr = today.toISOString().split("T")[0];
        const startStr = startDate.toISOString().split("T")[0];

        const endpoint = `/v2/aggs/ticker/${ticker}/range/1/day/${startStr}/${todayStr}?adjusted=true&sort=asc`;

        const data = await this.fetchAPI<{ results?: StockAggregate[] }>(endpoint);

        if (!data.results || data.results.length === 0) {
            throw new Error(`No stock data available for ${ticker}`);
        }

        return data.results;
    }

    // Get company details
    async getTickerDetails(ticker: string): Promise<TickerDetails | null> {
        try {
            const endpoint = `/v3/reference/tickers/${ticker}`;
            const data = await this.fetchAPI<{ results?: TickerDetails }>(endpoint);
            return data.results || null;
        } catch (error) {
            console.error(`[Massive API] Failed to fetch ticker details:`, error);
            return null;
        }
    }

    // Get recent news for a company / ticker
    async getNews(ticker: string, limit = 5, order: 'asc' | 'desc' = 'desc'): Promise<NewsArticle[]> {
        try {
            const endpoint = `/v2/reference/news?ticker=${ticker}&limit=${limit}&sort=published_utc&order=${order}`;
            const data = await this.fetchAPI<{ results?: NewsArticle[] }>(endpoint);
            return data.results || [];
        } catch (error) {
            console.error(`[Massive API] Failed to fetch news:`, error);
            return [];
        }
    }

    // Get previous day's close
    async getPreviousClose(ticker: string): Promise<StockAggregate | null> {
        try {
            const endpoint = `/v2/aggs/ticker/${ticker}/prev`;
            const data = await this.fetchAPI<{ results?: StockAggregate[] }>(endpoint);
            return data.results?.[0] || null;
        } catch (error) {
            console.error(`[Massive API] Failed to fetch previous close:`, error);
            return null;
        }
    }

    // Get RSI
    async getRSI(ticker: string, window = 14, limit = 1): Promise<Array<{ timestamp: number; value: number }>> {
        try {
            const endpoint = `/v1/indicators/rsi/${ticker}?timespan=day&adjusted=true&window=${window}&order=desc&limit=${limit}`;
            const data = await this.fetchAPI<{ results?: { values?: Array<{ timestamp: number; value: number }> } }>(endpoint);
            return data.results?.values || [];
        } catch (error) {
            console.error(`[Massive API] Failed to fetch RSI:`, error);
            return [];
        }
    }

    // Get SMA
    async getSMA(ticker: string, window: number, limit = 1): Promise<Array<{ timestamp: number; value: number }>> {
        try {
            const endpoint = `/v1/indicators/sma/${ticker}?timespan=day&adjusted=true&window=${window}&order=desc&limit=${limit}`;
            const data = await this.fetchAPI<{ results?: { values?: Array<{ timestamp: number; value: number }> } }>(endpoint);
            return data.results?.values || [];
        } catch (error) {
            console.error(`[Massive API] Failed to fetch SMA:`, error);
            return [];
        }
    }
}