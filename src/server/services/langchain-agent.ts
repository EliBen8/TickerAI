import { ChatOpenAI } from "@langchain/openai";
import { createStockDataTool } from "../tools/stock-data-tool";
import { createNewsDataTool } from "../tools/news-tool";
import { createCompanyDetailsTool } from "../tools/company-details-tool";
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";

const SYSTEM_PROMPT = `You are TickerAI, an AI-powered stock analysis assistant.

Your purpose is to help users understand stocks by:
1. Fetching real-time market data using your tools
2. Analyzing technical indicators and price trends
3. Reviewing recent news and sentiment
4. Providing clear, educational insights

TOOLS AVAILABLE:
- get_stock_data: Fetch current price, volume, and technical indicators
- get_stock_news: Get recent news articles and sentiment
- get_company_details: Get company information and fundamentals

BEHAVIOR GUIDELINES:
- Always use tools to get fresh data - never make up numbers
- Be conversational and helpful, not robotic
- Explain technical concepts in simple terms
- When analyzing, consider: price trends, volume, RSI, moving averages, and news sentiment
- If you see concerning patterns, mention them objectively
- For follow-up questions, use context from the conversation

CRITICAL RULE:
You provide educational analysis and market insights, NOT financial advice.
Never tell users to buy or sell. Instead, present data and let them decide.

RESPONSE FORMATTING:

**For INITIAL stock analysis (when user first asks about a ticker):**
Structure your response in clear sections with headers:

#### Summary
[2-3 sentence overview of the stock's current state]

#### Current Market Data
- Current Price: $XXX.XX
- Change: +$X.XX (+X.XX%)
- Day's Range: $XXX.XX - $XXX.XX
- Volume: X.X million (compared to avg of X.X million)
- RSI: XX.XX (interpretation)
- Moving Averages:
  - SMA10: $XXX.XX
  - SMA20: $XXX.XX

#### Recent News Sentiment
[Brief paragraph describing the news landscape with 2-3 key articles mentioned]

#### Key Insights
[2-3 paragraphs discussing what the data means - price trends, technical signals, sentiment]

#### Things to Monitor
[3-5 bullet points of specific things to watch]

**For FOLLOW-UP questions:**
Respond naturally in conversational paragraphs - DO NOT use excessive bullet points.
- Write 2-4 coherent paragraphs
- Only use bullets for lists of 3+ items where it truly aids clarity
- Be direct and concise
- Reference previous context when relevant

EXAMPLES:

User: "What's the latest news?"
Good: "The most recent article is from The Motley Fool titled 'Is Apple Still a Good Growth Stock to Own in 2026?' published today. The piece takes a cautious stance, noting that while Apple posted strong Q4 results with 16% revenue growth and 2.5 billion active devices, the stock trades at 33x earnings with only 6% typical annual growth. The analyst expresses concern about slower AI adoption compared to peers and suggests investors might find better opportunities elsewhere."

Bad: "• Title: Is Apple Still a Good Growth Stock to Own in 2026?\n• Publisher: The Motley Fool\n• Published: Feb 5, 2026\n• Sentiment: Negative"

User: "Should I be worried?"
Good: "The RSI at 68 suggests the stock is approaching overbought territory, which could mean a short-term pullback is possible. However, the price is still trending above both moving averages, indicating overall bullish momentum. I'd watch for a consolidation phase rather than worrying about a major reversal - this looks more like a healthy pause than a red flag."

Bad: "• RSI high - overbought\n• Price above moving averages - bullish\n• Watch for consolidation"

When a user mentions a stock, proactively fetch its data and recent news.`;


export async function runStockAnalysis(
    input: string,
    chatHistory: Array<{ role: string; content: string }> = []
) {
    console.log(`[Agent] Processing: "${input}"`);

    // Initialize GPT-5-Nano model
    const llm = new ChatOpenAI({
        modelName: "gpt-5-nano",
        temperature: 1, // only option for gpt-5-nano
        openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Create all the tools the agent can use
    const tools = [
        createStockDataTool(),      // Gets price, volume, RSI, SMA
        createNewsDataTool(),       // Gets recent news articles
        createCompanyDetailsTool(), // Gets company info
    ];

    // Attach tools to the model so it knows it can call them
    const modelWithTools = llm.bindTools(tools);

    // Build the conversation messages
    const messages: Array<SystemMessage | HumanMessage | AIMessage | ToolMessage> = [
        new SystemMessage(SYSTEM_PROMPT), // System instructions
    ];

    // Add previous conversation history
    for (const msg of chatHistory) {
        if (msg.role === "user") {
            messages.push(new HumanMessage(msg.content));
        } else {
            messages.push(new AIMessage(msg.content));
        }
    }

    // Add the current user question
    messages.push(new HumanMessage(input));

    try {
        let iterations = 0;
        const maxIterations = 5; // Prevent infinite loops

        // Agent loop: Model decides if it needs tools or can answer directly
        while (iterations < maxIterations) {
            iterations++;
            console.log(`[Agent] Iteration ${iterations}/${maxIterations}`);

            // Ask the model what to do next
            const response = await modelWithTools.invoke(messages);

            // Check if model wants to call any tools
            const toolCalls = response.tool_calls || [];

            // If no tool calls, model has the final answer
            if (toolCalls.length === 0) {
                console.log("[Agent] Response generated successfully");
                return response.content as string;
            }

            // Model wants to use tools, execute them
            console.log(`[Agent] Executing ${toolCalls.length} tool call(s)`);
            messages.push(response); // Add model's request to history

            // Execute each tool the model requested
            for (const toolCall of toolCalls) {
                // Find the tool by name
                const tool = tools.find((t) => t.name === toolCall.name);

                if (!tool) {
                    console.error(`[Agent] Tool not found: ${toolCall.name}`);
                    continue;
                }

                // Check if tool_call_id exists
                if (!toolCall.id) {
                    console.error(`[Agent] Tool call missing ID for ${toolCall.name}`);
                    continue;
                }

                try {
                    // Get the arguments
                    const args = toolCall.args as Record<string, any>;
                    console.log(`[Agent] Calling ${tool.name} with:`, args);

                    // run the tool
                    const result = await (tool.func as any)(args);

                    messages.push(
                        new ToolMessage({
                            content: result,
                            tool_call_id: toolCall.id,
                        })
                    );

                    console.log(`[Agent] Tool ${tool.name} executed successfully`);
                } catch (error) {
                    console.error(`[Agent] Error executing ${tool.name}:`, error);
                    // If tool fails, tell the model about the error
                    messages.push(
                        new ToolMessage({
                            content: `Error: ${error instanceof Error ? error.message : "Unknown"}`,
                            tool_call_id: toolCall.id,
                        })
                    );
                }
            }

            // Loop continues. Model will now analyze the tool results and respond
        }

        // If we hit max iterations without getting a final answer
        throw new Error("Max iterations reached");
    } catch (error) {
        console.error("[Agent Error]:", error);
        throw new Error(`Failed to analyze: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

/*
Notes:
SystemMessage → instructions / rules / identity
HumanMessage → user input
AIMessage → model responses
ToolMessage → tool outputs

UPDATES FOR NON-DEPRECATED SYNTAX:
- OLD: response.additional_kwargs.tool_calls
  NEW: response.tool_calls

- OLD: toolCall.function.name
  NEW: toolCall.name

- OLD: JSON.parse(toolCall.function.arguments)
  NEW: toolCall.args (already parsed)

- OLD: HumanMessage for tool errors
  NEW: ToolMessage for tool errors
*/