// tRPC Router: Stock Analysis

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { runStockAnalysis } from "~/server/services/langchain-agent";

/**
 * Stock Analysis Router
 * 
 * This defines all the API endpoints related to stock analysis.
 */
export const stockRouter = createTRPCRouter({
  analyze: publicProcedure
    .input(
      z.object({
        ticker: z.string().min(1).max(10).toUpperCase(),
      })
    )
    .mutation(async ({ input }) => {
      const { ticker } = input;
      
      console.log(`[tRPC] Analyzing ticker: ${ticker}`);
      
      try {
        // Call the LangChain agent with a simple prompt
        const analysis = await runStockAnalysis(
          `Provide a comprehensive analysis of ${ticker}. Include current price, technical indicators, recent news sentiment, and key insights.`
        );
        
        return {
          success: true,
          ticker,
          analysis,
          timestamp: new Date().toISOString(),
        };
        
      } catch (error) {
        console.error(`[tRPC] Error analyzing ${ticker}:`, error);
        throw new Error(
          `Failed to analyze ${ticker}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Chat with the AI about a stock
   * 
   * This enables conversational follow-up questions.
   * The agent maintains context from previous messages.
   */
  chat: publicProcedure
    .input(
      z.object({
        ticker: z.string().min(1).max(10).toUpperCase(),
        question: z.string().min(1).max(500),
        chatHistory: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          })
        ).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { ticker, question, chatHistory = [] } = input;
      
      console.log(`[tRPC] Chat question for ${ticker}: ${question}`);
      
      try {
        // The agent uses chat history for context
        const response = await runStockAnalysis(
          `Regarding ${ticker}: ${question}`,
          chatHistory
        );
        
        return {
          success: true,
          ticker,
          answer: response,
          timestamp: new Date().toISOString(),
        };
        
      } catch (error) {
        console.error(`[tRPC] Error in chat for ${ticker}:`, error);
        throw new Error(
          `Failed to process question: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),
});
