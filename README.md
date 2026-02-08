# TickerAI

AI-powered stock analysis platform that combines GPT-4, autonomous agents, and real-time market data to provide comprehensive equity research through a conversational interface.

## 🏗️ Architecture

```
┌──────────┐      ┌─────────┐      ┌──────────────┐
│ Frontend │─────▶│  tRPC   │─────▶│  LangChain   │
│ (Next.js)│      │  API    │      │    Agent     │
└──────────┘      └─────────┘      └──────────────┘
                                           │
                      ┌────────────────────┼────────────────────┐
                      ▼                    ▼                    ▼
              ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
              │ Stock Data   │    │ News Data    │    │ Company Info │
              │     Tool     │    │     Tool     │    │     Tool     │
              └──────────────┘    └──────────────┘    └──────────────┘
                      │                    │                    │
                      └────────────────────┼────────────────────┘
                                           ▼
                                  ┌─────────────────┐
                                  │  Massive API    │
                                  │  (Polygon.io)   │
                                  └─────────────────┘
                                           │
                                           ▼
                                  ┌─────────────────┐
                                  │   OpenAI GPT-4  │
                                  │   Synthesis     │
                                  └─────────────────┘
```

## Components

**Frontend**: Next.js 14 App Router with React for the user interface  
**tRPC Layer**: Type-safe API with automatic TypeScript inference  
**LangChain Agent**: Autonomous AI that decides which tools to call  
**Tools**: Specialized functions for fetching stock data, news, and fundamentals  
**Massive API**: Real-time financial market data provider  
**OpenAI GPT-4**: Language model for analysis and synthesis  

## 🚀 Features

✅ Autonomous AI agent that decides what data to fetch  
✅ Real-time stock prices, charts, and technical indicators  
✅ Conversational interface with context-aware follow-ups  
✅ Sentiment analysis (Bullish/Bearish/Neutral)  
✅ Input validation (prevents invalid tickers from wasting API credits)  
✅ Interactive charts with multiple timeframes (7D, 30D, 90D)  
✅ Clean markdown formatting for AI responses  
✅ Dark theme optimized for financial data  

## 📊 How It Works

1. **User enters a ticker** (e.g., "AAPL")
2. **Frontend validates** format and checks if ticker exists via API
3. **tRPC sends request** to LangChain agent with type safety
4. **AI agent autonomously decides** which tools to call:
   - `get_stock_data`: Fetches price, volume, RSI, SMA
   - `get_stock_news`: Retrieves recent articles with sentiment
   - `get_company_details`: Gets fundamentals and company info
5. **Tools fetch data** from Massive API
6. **AI synthesizes** all data into comprehensive analysis
7. **Frontend renders** chart, sentiment indicator, and formatted report

## 🛠️ Tech Stack

**Language**: TypeScript  
**Framework**: Next.js 14 (App Router)  
**UI**: React 18 + Tailwind CSS  
**API Layer**: tRPC (end-to-end type safety)  
**AI Framework**: LangChain  
**LLM**: OpenAI GPT-4  
**Market Data**: Massive (Polygon.io)  
**Icons**: Lucide React  

## 📁 Project Structure

```
TickerAI/
├── src/
│   ├── app/
│   │   ├── page.tsx                      # Main app UI
│   │   ├── _components/
│   │   │   ├── Sidebar.tsx              # Chat history
│   │   │   ├── StockChart.tsx           # Price chart
│   │   │   └── AnalysisFormatter.tsx    # Markdown parser
│   │   └── api/
│   │       ├── stock-chart/route.ts     # Chart data endpoint
│   │       └── validate-ticker/route.ts # Ticker validation
│   ├── server/
│   │   ├── api/
│   │   │   └── routers/
│   │   │       └── stock.ts             # tRPC routes
│   │   ├── services/
│   │   │   └── langchain-agent.ts       # AI agent logic
│   │   └── tools/
│   │       ├── stock-data-tool.ts       # Price/indicators tool
│   │       ├── news-tool.ts             # News sentiment tool
│   │       └── company-details-tool.ts  # Fundamentals tool
│   └── trpc/
│       ├── react.tsx                     # Client-side hooks
│       └── server.ts                     # Server setup
├── .env.local                            # API keys
└── README.md
```

## 🔧 Local Development

### Prerequisites

- Node.js 18+
- OpenAI API key
- Massive (Polygon.io) API key

### Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/tickerai.git
cd tickerai
```

2. Install dependencies
```bash
npm install
```

3. Set environment variables

Create `.env.local`:
```env
OPENAI_API_KEY=your_openai_api_key
MASSIVE_API_KEY=your_massive_api_key
```

4. Run development server
```bash
npm run dev
```

Visit `http://localhost:3000`

## 📡 API Endpoints

### `POST /api/trpc/stock.analyze`
Analyze a stock ticker

**Request**:
```json
{
  "ticker": "AAPL"
}
```

**Response**:
```json
{
  "success": true,
  "ticker": "AAPL",
  "analysis": "Comprehensive analysis text..."
}
```

### `POST /api/trpc/stock.chat`
Ask follow-up questions

**Request**:
```json
{
  "ticker": "AAPL",
  "question": "What's the latest news?",
  "chatHistory": [...]
}
```

**Response**:
```json
{
  "success": true,
  "answer": "Recent news about AAPL..."
}
```

### `POST /api/validate-ticker`
Validate ticker symbol

**Request**:
```json
{
  "ticker": "AAPL"
}
```

**Response**:
```json
{
  "valid": true,
  "ticker": "AAPL",
  "name": "Apple Inc."
}
```

### `POST /api/stock-chart`
Get chart data

**Request**:
```json
{
  "ticker": "AAPL",
  "timeframe": "30D"
}
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-01-08",
      "price": 185.64,
      "volume": 70638912,
      "high": 186.40,
      "low": 183.82
    },
    ...
  ]
}
```

## 🧠 AI Agent Implementation

The LangChain agent uses a **ReAct (Reasoning + Acting)** pattern:

1. **Reasoning**: AI analyzes user's question
2. **Action**: AI selects and executes tools
3. **Observation**: AI receives tool results
4. **Repeat**: Continues until enough information gathered
5. **Response**: AI synthesizes data into coherent analysis

**Example Flow**:
```
User: "Analyze AAPL"
  ↓
AI: "I need current price, indicators, and news"
  ↓
Tool 1: get_stock_data({ ticker: "AAPL" })
  Returns: { price: 276.49, rsi: 68.11, sma10: 260.03 }
  ↓
Tool 2: get_stock_news({ ticker: "AAPL", limit: 5 })
  Returns: [{ title: "...", sentiment: "negative" }, ...]
  ↓
AI: Combines data → Structured analysis with insights
```

## 🔐 Security

- **Input Validation**: Two-layer validation (regex + API check)
- **Environment Variables**: API keys never exposed to client
- **Server-Side Only**: All API calls happen on backend
- **Type Safety**: tRPC prevents type mismatches

## 📈 Performance

- **Ref-Based Memoization**: Prevents duplicate API calls
- **Conditional Rendering**: Components render only when ready
- **SVG Charts**: Lightweight graphics vs heavy libraries
- **Client-Side State**: No database calls for chat history

## 🚢 Deployment

Ready for deployment on Vercel, Railway, or any Node.js platform.

**Build Command**:
```bash
npm run build
```

**Start Command**:
```bash
npm start
```

**Environment Variables Required**:
- `OPENAI_API_KEY`
- `MASSIVE_API_KEY`

## 🎯 Key Implementation Challenges

### Challenge 1: Type Safety Across Full Stack
**Solution**: tRPC provides automatic type inference - backend types flow to frontend  
**Result**: Zero API type mismatches, caught at compile-time

### Challenge 2: AI Agent Tool Selection
**Solution**: LangChain's `DynamicStructuredTool` with clear descriptions  
**Result**: AI reliably selects correct tools based on user intent

### Challenge 3: Invalid Ticker Handling
**Solution**: Two-layer validation (format check + API existence check)  
**Result**: Saves API costs, improves UX, prevents wasted AI credits

### Challenge 4: Deprecated LangChain Syntax
**Solution**: Migrated from `.additional_kwargs.tool_calls` to `.tool_calls`  
**Result**: Future-proof implementation, no deprecation warnings

## 🤝 Contributing

This is a portfolio project, but feedback and suggestions are welcome!

## 👤 Author

**Eli Bendavid**  
GitHub: [@EliBen8](https://github.com/EliBen8)  
Portfolio: [eliben8.github.io](https://eliben8.github.io)  
Email: elirbendavid@gmail.com

## 🙏 Acknowledgments

- Built to demonstrate AI agent architecture and full-stack TypeScript development
- Uses OpenAI GPT-4 for natural language understanding
- Powered by Massive (Polygon.io) for real-time market data
- LangChain framework for AI orchestration