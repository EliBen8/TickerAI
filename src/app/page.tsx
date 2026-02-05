"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, TrendingUp, TrendingDown, ChartCandlestick } from "lucide-react";
import { api } from "~/trpc/react";
import StockChart from "./_components/StockChart";
import Sidebar from "./_components/Sidebar";
import AnalysisFormatter from "./_components/AnalysisFormatter";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  ticker?: string;
  stockData?: StockData;
  sentiment?: "bullish" | "bearish" | "neutral";
}

interface StockData {
  ticker: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  rsi: number | null;
  sma10: number | null;
  sma20: number | null;
  timestamp: string;
}

interface ConversationHistory {
  id: string;
  ticker: string;
  timestamp: Date;
  preview: string;
  messages: ChatMessage[];
}

export default function StockAnalysisPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [analysisPerformed, setAnalysisPerformed] = useState(false);
  const [conversations, setConversations] = useState<ConversationHistory[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [activeTicker, setActiveTicker] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const analyzeMutation = api.stock.analyze.useMutation({
    onSuccess: (data) => {
      const stockData = parseStockDataFromAnalysis(data.analysis);
      const sentiment = detectSentiment(data.analysis);

      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "assistant",
        content: data.analysis,
        timestamp: new Date(),
        ticker: data.ticker,
        stockData,
        sentiment,
      };

      setMessages([assistantMessage]);
      setAnalysisPerformed(true);
      setActiveTicker(data.ticker);

      saveConversationToHistory(data.ticker, [assistantMessage]);
    },
    onError: (error) => {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "assistant",
        content: `Error: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  const chatMutation = api.stock.chat.useMutation({
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "assistant",
        content: data.answer,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (activeTicker) {
        saveConversationToHistory(activeTicker, [...messages, assistantMessage]);
      }
    },
    onError: (error) => {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "assistant",
        content: `Error: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  function detectSentiment(analysis: string): "bullish" | "bearish" | "neutral" {
    const lowerAnalysis = analysis.toLowerCase();
    const bullishKeywords = ["bullish", "positive", "upward", "growth", "strong buy", "buy"];
    const bearishKeywords = ["bearish", "negative", "downward", "decline", "sell", "weak"];

    const bullishScore = bullishKeywords.reduce((score, keyword) =>
      score + (lowerAnalysis.includes(keyword) ? 1 : 0), 0
    );
    const bearishScore = bearishKeywords.reduce((score, keyword) =>
      score + (lowerAnalysis.includes(keyword) ? 1 : 0), 0
    );

    if (bullishScore > bearishScore) return "bullish";
    if (bearishScore > bullishScore) return "bearish";
    return "neutral";
  }

  function parseStockDataFromAnalysis(analysis: string): StockData | undefined {
    try {
      const priceMatch = analysis.match(/Current Price[:\s]+\$?([\d,.]+)/i);
      const changeMatch = analysis.match(/Change[:\s]+[-+]?\$?([\d,.]+)\s*\(([-+]?[\d.]+)%\)/i);

      if (priceMatch && activeTicker) {
        return {
          ticker: activeTicker,
          currentPrice: parseFloat(priceMatch[1]!.replace(/,/g, "")),
          change: changeMatch ? parseFloat(changeMatch[1]!.replace(/,/g, "")) : 0,
          changePercent: changeMatch ? parseFloat(changeMatch[2]!) : 0,
          dayHigh: 0,
          dayLow: 0,
          volume: 0,
          rsi: null,
          sma10: null,
          sma20: null,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error("Failed to parse stock data:", error);
    }
    return undefined;
  }

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleNewChat = () => {
    setAnalysisPerformed(false);
    setMessages([]);
    setInput("");
    setCurrentConversationId(null);
    setActiveTicker(null);
  };

  const handleSelectConversation = (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      setMessages(conversation.messages);
      setAnalysisPerformed(true);
      setCurrentConversationId(conversationId);
      setActiveTicker(conversation.ticker);
    }
  };

  const saveConversationToHistory = (ticker: string, updatedMessages: ChatMessage[]) => {
    const existingConversationIndex = conversations.findIndex((c) => c.id === currentConversationId);

    if (existingConversationIndex !== -1) {
      const updatedConversations = [...conversations];
      updatedConversations[existingConversationIndex]!.messages = updatedMessages;
      setConversations(updatedConversations);
    } else {
      const conversationId = Date.now().toString();
      const newConversation: ConversationHistory = {
        id: conversationId,
        ticker,
        timestamp: new Date(),
        preview: `Analysis for ${ticker}`,
        messages: updatedMessages,
      };
      setConversations((prev) => [newConversation, ...prev.slice(0, 19)]);
      setCurrentConversationId(conversationId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!analysisPerformed) {
      const ticker = input.trim().toUpperCase();

      const tickerRegex = /^[A-Z]{1,6}([.-][A-Z])?$/;

      if (!tickerRegex.test(ticker)) {
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          type: "assistant",
          content: "⚠️ Invalid ticker format. Please enter a valid stock ticker symbol (1-6 letters, like AAPL, TSLA, or BRK.B). Ticker symbols cannot contain numbers or special characters.",
          timestamp: new Date(),
        };
        setMessages([errorMessage]);
        return;
      }

      const validatingMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "assistant",
        content: "🔍 Validating ticker symbol...",
        timestamp: new Date(),
      };
      setMessages([validatingMessage]);
      setInput("");

      try {
        const response = await fetch('/api/validate-ticker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticker }),
        });

        const result = await response.json();

        if (!result.valid) {
          const errorMessage: ChatMessage = {
            id: Date.now().toString(),
            type: "assistant",
            content: `❌ "${ticker}" is not a valid stock ticker. Please check the spelling and try again. If you're unsure of the ticker symbol, try searching for the company name online (e.g., "Apple stock ticker" → AAPL).`,
            timestamp: new Date(),
          };
          setMessages([errorMessage]);
          return;
        }

        setActiveTicker(ticker);
        analyzeMutation.mutate({ ticker });

      } catch (error) {
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          type: "assistant",
          content: "⚠️ Unable to validate ticker. Please check your internet connection and try again.",
          timestamp: new Date(),
        };
        setMessages([errorMessage]);
        setInput(ticker);
      }
    } else {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "user",
        content: input,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");

      if (activeTicker) {
        const chatHistory = messages.map((msg) => ({
          role: msg.type === "user" ? "user" as const : "assistant" as const,
          content: msg.content,
        }));

        chatMutation.mutate({
          ticker: activeTicker,
          question: input,
          chatHistory,
        });
      }
    }
  };

  const isLoading = analyzeMutation.isPending || chatMutation.isPending;

  return (
    <div className="flex h-screen bg-black">
      <Sidebar
        conversations={conversations}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        currentConversationId={currentConversationId}
      />

      <div className="flex-1 flex flex-col">
        {/* Header - DARK */}
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ChartCandlestick className="w-6 h-6 text-green-500" />
            TickerAI
          </h1>
          {activeTicker && (
            <p className="text-sm text-gray-400 mt-1">
              Analyzing {activeTicker}
            </p>
          )}
        </div>

        {/* Messages */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
        >
          {!analysisPerformed && messages.length === 0 && !isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Welcome to Stock Analysis AI
                </h2>
                <p className="text-gray-400 max-w-md mb-4">
                  Enter a stock ticker symbol (like AAPL, TSLA, or MSFT) to get a comprehensive analysis with
                  real-time data, technical indicators, and AI-powered insights.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-sm text-green-400">
                  <span className="font-semibold">Example tickers:</span>
                  <span>AAPL • TSLA • MSFT • GOOGL • AMZN</span>
                </div>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={message.id}>
              {message.type === "user" ? (
                <div className="flex justify-end">
                  <div className="bg-green-600 text-white rounded-lg px-4 py-3 max-w-md">
                    {message.content}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Sentiment Indicator - DARK */}
                  {message.sentiment && index === 0 && (
                    <div className="flex justify-start">
                      <div
                        className={`${message.sentiment === "bullish"
                            ? "bg-green-900/40 border-green-500/50 text-green-400"
                            : message.sentiment === "bearish"
                              ? "bg-red-900/40 border-red-500/50 text-red-400"
                              : "bg-gray-800 border-gray-700 text-gray-400"
                          } border rounded-lg px-4 py-3 flex items-center gap-3`}
                      >
                        {message.sentiment === "bullish" ? (
                          <TrendingUp className="w-5 h-5" />
                        ) : message.sentiment === "bearish" ? (
                          <TrendingDown className="w-5 h-5" />
                        ) : null}
                        <span className="font-semibold">
                          AI Sentiment: {message.sentiment.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Stock Chart */}
                  {message.ticker && index === 0 && (
                    <div className="bg-gray-900 rounded-lg shadow-sm border border-gray-800 p-6">
                      <StockChart ticker={message.ticker} />
                    </div>
                  )}

                  {/* Analysis Text - DARK */}
                  <div className="flex justify-start">
                    <div className="bg-gray-900 border border-gray-800 rounded-lg px-6 py-4 max-w-4xl w-full">
                      <AnalysisFormatter content={message.content} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-center items-center gap-3 p-4 bg-gray-900 border border-gray-800 rounded-lg">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
              <p className="text-md text-gray-300">Analyzing {activeTicker}...</p>
            </div>
          )}
        </div>

        {/* Input Form - DARK */}
        <div className="bg-gray-900 border-t border-gray-800 px-6 py-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  analysisPerformed
                    ? "Ask a follow-up question..."
                    : "Enter a stock ticker (e.g., AAPL, TSLA, MSFT)..."
                }
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-500"
                disabled={isLoading}
                maxLength={analysisPerformed ? 500 : 5}
              />
              {!analysisPerformed && (
                <p className="text-xs text-gray-500 mt-2 ml-1">
                  💡 Tip: Enter a valid ticker symbol (1-6 letters, no numbers)
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}