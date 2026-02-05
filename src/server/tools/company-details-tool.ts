// LangChain Tool: Company Details Fetcher

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { MassiveService } from "../services/massive";

export function createCompanyDetailsTool() {
    const massiveService = new MassiveService();

    return new DynamicStructuredTool({
        name: "get_company_details",
        description: `
      Fetches fundamental information about a company.
      Use this when you need:
      - Company name and description
      - Industry and market classification
      - Market capitalization
      - Number of employees
      - Exchange listing information
      - Company background and overview
      
      Input: A stock ticker symbol
      Output: Detailed company profile and fundamental data
    `,
        schema: z.object({
            ticker: z.string().describe("The stock ticker symbol"),
        }),
        func: async ({ ticker }) => {
            console.log(`[Tool: get_company_details] Fetching details for ${ticker}`);

            try {
                const details = await massiveService.getTickerDetails(ticker.toUpperCase());

                if (!details) {
                    return `No company details found for ${ticker}`;
                }

                return JSON.stringify({
                    ticker: details.ticker,
                    name: details.name,
                    description: details.description || "No description available",
                    market: details.market,
                    primaryExchange: details.primary_exchange,
                    type: details.type,
                    active: details.active,
                    marketCap: details.market_cap,
                    totalEmployees: details.total_employees,
                    listDate: details.list_date,
                    currency: details.currency_name,
                }, null, 2);

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                console.error(`[Tool Error] get_company_details:`, errorMessage);
                return `Error fetching company details for ${ticker}: ${errorMessage}`;
            }
        },
    });
}