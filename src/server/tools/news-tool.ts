// LangChain Tool: News Fetcher

import { DynamicStructuredTool } from "@langchain/core/tools";
import z from "zod";
import { MassiveService } from "../services/massive";

export function createNewsDataTool() {
    const massiveService = new MassiveService();

    return new DynamicStructuredTool({
        name: "get_stock_news",
        description: `
            Fetches recent news articles about a specific stock.
            Use this when you need:
            - Latest company news and announcements
            - Market sentiment from news sources
            - Recent developments affecting the stock
            - Industry or company-specific events
            
            Input: A stock ticker symbol
            Output: Recent news articles with titles, descriptions, and sentiment analysis
        `,
        schema: z.object({
            ticker: z.string().describe("The stock ticker symbol"),
            limit: z.number().optional().describe("Number of articles to fetch (default: 5)"),
        }),
        func: async ({ ticker, limit = 5 }) => {
            console.log(`[Tool: get_stock_news] Fetching news for ${ticker}`);

            try {
                const news = await massiveService.getNews(ticker.toUpperCase(), limit);
                if (news.length === 0) {
                    return `No recent news for ${ticker}`;
                }

                // Format news for LLM
                const formattedNews = news.map((article, index) => ({
                    number: index + 1,
                    title: article.title,
                    publisher: article.publisher.name,
                    published: new Date(article.published_utc).toLocaleDateString(),
                    description: article.description || "No description avaliable.",
                    sentiment: article.insights?.[0]?.sentiment || "neutral",
                    url: article.article_url,
                }));

                return JSON.stringify({
                    ticker: ticker.toUpperCase(),
                    newsCount: formattedNews.length,
                    articles: formattedNews,
                }, null, 2);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                console.error(`[Tool Error] get_stock_news:`, errorMessage);
                return `Error fetching news for ${ticker}: ${errorMessage}`;
            }
        },
    });
}