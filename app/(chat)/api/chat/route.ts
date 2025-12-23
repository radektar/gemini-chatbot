import { convertToCoreMessages, Message, streamText } from "ai";
import { z } from "zod";

import { geminiProModel } from "@/ai";
import { extractIntent } from "@/ai/intent-extraction";
import { generatePlan } from "@/ai/plan-generator";
import { auth } from "@/app/(auth)/auth";
import {
  deleteChatById,
  getChatById,
  saveChat,
} from "@/db/queries";
import { slackTools } from "@/integrations";
import { getMondayMCPTools, callMondayMCPTool } from "@/integrations/mcp/init";

export async function POST(request: Request) {
  const { id, messages }: { id: string; messages: Array<Message> } =
    await request.json();

  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const coreMessages = convertToCoreMessages(messages).filter(
    (message) => message.content.length > 0,
  );

  // Get last user message
  const lastUserMessage = coreMessages
    .filter((m) => m.role === "user")
    .pop();
  
  const confidenceThreshold = parseFloat(
    process.env.CONFIDENCE_THRESHOLD || "0.7"
  );
  
  let shouldAskForClarification = false;
  let clarificationQuestion = "";
  let queryContext: any = null;
  let plan = "";
  let isPlanConfirmation = false;

  // Check if this is a plan confirmation FIRST (before extracting intent)
  const confirmationKeywords = ["ok", "tak", "wykonaj", "zrób", "plan jest ok", "wykonaj plan"];
  if (lastUserMessage && typeof lastUserMessage.content === "string") {
    const userContent = lastUserMessage.content.toLowerCase().trim();
    isPlanConfirmation = confirmationKeywords.some(keyword => 
      userContent.includes(keyword) || userContent === keyword
    );
  }

  // If this is a plan confirmation, extract plan from previous assistant message
  if (isPlanConfirmation) {
    const assistantMessages = coreMessages.filter((m) => m.role === "assistant");
    const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
    
    if (lastAssistantMessage && typeof lastAssistantMessage.content === "string") {
      // Extract the plan from the assistant's previous response
      const content = lastAssistantMessage.content;
      
      // Check if the message contains a plan
      if (content.includes("Mój plan:") || content.includes("plan:") || 
          content.match(/\d+\.\s+/) || content.includes("Przeszukam")) {
        plan = content; // Use the entire assistant message as context
        console.log("Plan confirmation detected, using previous plan");
      }
    }
  }

  // Only extract intent and generate new plan if NOT a plan confirmation
  if (!isPlanConfirmation && lastUserMessage && typeof lastUserMessage.content === "string") {
    try {
      queryContext = await extractIntent(lastUserMessage.content);
      
      // Check if we need to ask for clarification
      if (queryContext.averageConfidence < confidenceThreshold) {
        shouldAskForClarification = true;
        
        // Build clarification question based on low confidence slots
        const lowConfidenceSlots: string[] = [];
        
        if (queryContext.intent.confidence < 0.5) {
          lowConfidenceSlots.push("intencję");
        }
        if (queryContext.dataSources.confidence < 0.5) {
          lowConfidenceSlots.push("źródło danych");
        }
        if (queryContext.audience.confidence < 0.5) {
          lowConfidenceSlots.push("odbiorcę");
        }
        if (queryContext.output.confidence < 0.5) {
          lowConfidenceSlots.push("format odpowiedzi");
        }
        
        if (lowConfidenceSlots.length > 0) {
          clarificationQuestion = `Nie jestem pewien co do: ${lowConfidenceSlots.join(", ")}. Czy możesz doprecyzować?`;
        } else {
          clarificationQuestion = "Czy możesz doprecyzować swoje zapytanie?";
        }
      } else {
        // Generate plan if confidence is high enough
        try {
          plan = await generatePlan(queryContext);
        } catch (error) {
          console.error("Failed to generate plan:", error);
          // Continue without plan if generation fails
        }
      }
    } catch (error) {
      console.error("Failed to extract intent:", error);
      // Continue with normal flow if intent extraction fails
    }
  }

  // If we need clarification, return a clarification response instead of tool calls
  if (shouldAskForClarification && clarificationQuestion) {
    const clarificationResponse = await streamText({
      model: geminiProModel,
      system: `
        You are an organizational assistant. You help employees with:
        - Reviewing tasks from Monday.com (using MCP - READ ONLY)
        - Searching conversation history from Slack
        
        IMPORTANT: Monday.com integration is READ ONLY. 
        You cannot create, modify, or delete data in Monday.com.
        If the user asks for changes, explain that access is read-only.
        
        Today's date: ${new Date().toLocaleDateString('pl-PL')}.
        
        When asking for clarification, provide concrete examples in Polish using this format:
        (np. "example1", "example2", "example3")
        
        Examples:
        - For projects: (np. "projekty w trakcie", "projekty opóźnione", "projekty zakończone")
        - For locations: (np. "Kenia", "Uganda", "Tanzania")
        - For project types: (np. "edukacyjne", "zdrowotne", "infrastrukturalne")
      `,
      messages: [
        ...coreMessages,
        {
          role: "assistant" as const,
          content: clarificationQuestion,
        },
      ],
    });

    return clarificationResponse.toDataStreamResponse({});
  }

  // Get Monday.com MCP tools
  let mondayToolsForAI: Record<string, any> = {};
  
  try {
    const mcpTools = await getMondayMCPTools();
    
    // Convert MCP tools to AI SDK format
    for (const tool of mcpTools) {
      // MCP tools have structure: { name, description, inputSchema }
      const inputSchema = tool.inputSchema || {};
      const properties = inputSchema.properties || {};
      
      // Build Zod schema from MCP input schema
      const zodProperties: Record<string, z.ZodTypeAny> = {};
      const required = inputSchema.required || [];
      
      for (const [key, value] of Object.entries(properties)) {
        const prop = value as any;
        let zodType: z.ZodTypeAny;
        
        if (prop.type === "string") {
          zodType = z.string();
        } else if (prop.type === "number" || prop.type === "integer") {
          zodType = z.number();
        } else if (prop.type === "boolean") {
          zodType = z.boolean();
        } else if (prop.type === "array") {
          zodType = z.array(z.any());
        } else {
          zodType = z.any();
        }
        
        if (prop.description) {
          zodType = zodType.describe(prop.description);
        }
        
        if (!required.includes(key)) {
          zodType = zodType.optional();
        }
        
        zodProperties[key] = zodType;
      }
      
      mondayToolsForAI[tool.name] = {
        description: tool.description || tool.name,
        parameters: z.object(zodProperties),
        execute: async (args: Record<string, any>) => {
          try {
            const result = await callMondayMCPTool(tool.name, args);
            
            // Stop & ask trigger: if result has >100 records, ask for narrowing
            if (result && typeof result === "object") {
              let recordCount = 0;
              let totalCount: number | null = null;
              let hasMoreRecords = false;
              
              // Helper function to recursively search for items arrays and pagination info
              const findItemsAndPagination = (obj: any, path = ""): { count: number; total: number | null; hasMore: boolean } => {
                if (!obj || typeof obj !== "object") {
                  return { count: 0, total: null, hasMore: false };
                }
                
                // Check for items array
                if (Array.isArray(obj.items)) {
                  const count = obj.items.length;
                  const hasMore = !!(obj.cursor || obj.has_next_page || obj.next_cursor);
                  const total = typeof obj.total_count === 'number' ? obj.total_count : 
                               typeof obj.total === 'number' ? obj.total : null;
                  return { count, total, hasMore };
                }
                
                // Check for items_page structure (Monday.com specific)
                if (obj.items_page && typeof obj.items_page === "object") {
                  if (Array.isArray(obj.items_page.items)) {
                    const count = obj.items_page.items.length;
                    const hasMore = !!(obj.items_page.cursor || obj.items_page.has_next_page);
                    const total = typeof obj.items_page.total_count === 'number' ? obj.items_page.total_count :
                                 typeof obj.items_page.total === 'number' ? obj.items_page.total : null;
                    return { count, total, hasMore };
                  }
                }
                
                // Check for boards array
                if (Array.isArray(obj.boards)) {
                  // Check if boards contain items_page
                  let totalItems = 0;
                  let hasMore = false;
                  let total = null;
                  
                  for (const board of obj.boards) {
                    // Check for items_count on board level (Monday.com may return this)
                    if (typeof board.items_count === 'number') {
                      total = (total || 0) + board.items_count;
                    }
                    
                    if (board.items_page && Array.isArray(board.items_page.items)) {
                      totalItems += board.items_page.items.length;
                      if (board.items_page.cursor || board.items_page.has_next_page) {
                        hasMore = true;
                      }
                      if (typeof board.items_page.total_count === 'number') {
                        total = (total || 0) + board.items_page.total_count;
                      }
                    }
                  }
                  
                  if (totalItems > 0) {
                    return { count: totalItems, total, hasMore };
                  }
                  
                  return { count: obj.boards.length, total: null, hasMore: false };
                }
                
                // Check for board-level items_count (Monday.com may return total count here)
                if (typeof obj.items_count === 'number') {
                  const count = Array.isArray(obj.items) ? obj.items.length : 0;
                  return { count, total: obj.items_count, hasMore: count < obj.items_count };
                }
                
                // Recursively search in nested objects
                for (const key in obj) {
                  if (key !== 'content' && typeof obj[key] === "object") {
                    const found = findItemsAndPagination(obj[key], `${path}.${key}`);
                    if (found.count > 0) {
                      return found;
                    }
                  }
                }
                
                return { count: 0, total: null, hasMore: false };
              };
              
              // Check for different result structures
              if (Array.isArray(result)) {
                recordCount = result.length;
              } else {
                const found = findItemsAndPagination(result);
                recordCount = found.count;
                totalCount = found.total;
                hasMoreRecords = found.hasMore;
                
                // Special handling for get_board_items_page: check board.items_count
                if (tool.name === "get_board_items_page" && result.board && typeof result.board === "object") {
                  // Check if board has items_count field
                  if (typeof result.board.items_count === 'number') {
                    totalCount = result.board.items_count;
                    hasMoreRecords = recordCount < (totalCount || 0);
                  }
                  // If we got exactly 25 items (default page size), likely there are more
                  // Try to get total count from board info
                  else if (recordCount === 25 && totalCount === null && !hasMoreRecords) {
                    // Assume there might be more - we'll check with get_board_info if needed
                    // For now, mark as having more records if we got a full page
                    hasMoreRecords = true;
                  }
                }
              }
              
              // Log for debugging
              if (tool.name.includes("board") || tool.name.includes("item")) {
                console.log(`[Stop & Ask] Tool: ${tool.name}, Record count: ${recordCount}, Total: ${totalCount}, Has more: ${hasMoreRecords}`);
                // Log full structure for debugging (first 500 chars)
                const resultStr = JSON.stringify(result).substring(0, 500);
                console.log(`[Stop & Ask] Result structure (first 500 chars): ${resultStr}...`);
              }
              
              // For get_board_items_page: if we got exactly 25 items (default page size), 
              // fetch the total count using get_board_info
              if (tool.name === "get_board_items_page") {
                if (result.board && typeof result.board === "object") {
                  // Check if board has items_count field directly
                  if (typeof result.board.items_count === 'number') {
                    totalCount = result.board.items_count;
                    hasMoreRecords = recordCount < (totalCount || 0);
                    console.log(`[Stop & Ask] Found items_count in board object: ${totalCount}`);
                  }
                  // If we got exactly 25 items and no total count, fetch it from get_board_info
                  else if (recordCount === 25 && totalCount === null && result.board.id) {
                    try {
                      // Convert boardId to number - Monday.com MCP expects number, not string
                      const boardIdNum = parseInt(result.board.id, 10);
                      console.log(`[Stop & Ask] Fetching total count from get_board_info for board ${boardIdNum} (original: ${result.board.id})`);
                      const boardInfo = await callMondayMCPTool("get_board_info", { boardId: boardIdNum });
                      
                      // Log the full response structure to understand where items_count is
                      console.log(`[Stop & Ask] get_board_info response: ${JSON.stringify(boardInfo).substring(0, 1000)}`);
                      
                      // Check various possible locations for items_count in the response
                      let itemsCount: number | null = null;
                      if (boardInfo && typeof boardInfo === "object") {
                        // Try different possible structures
                        if (typeof boardInfo.items_count === 'number') {
                          itemsCount = boardInfo.items_count;
                          console.log(`[Stop & Ask] Found items_count at root level: ${itemsCount}`);
                        } else if (boardInfo.board && typeof boardInfo.board.items_count === 'number') {
                          itemsCount = boardInfo.board.items_count;
                          console.log(`[Stop & Ask] Found items_count at board.items_count: ${itemsCount}`);
                        } else if (boardInfo.data && boardInfo.data.board && typeof boardInfo.data.board.items_count === 'number') {
                          itemsCount = boardInfo.data.board.items_count;
                          console.log(`[Stop & Ask] Found items_count at data.board.items_count: ${itemsCount}`);
                        } else if (boardInfo.data && typeof boardInfo.data.items_count === 'number') {
                          itemsCount = boardInfo.data.items_count;
                          console.log(`[Stop & Ask] Found items_count at data.items_count: ${itemsCount}`);
                        } else {
                          // Log all keys to help debug
                          console.log(`[Stop & Ask] Could not find items_count. Available keys: ${Object.keys(boardInfo).join(', ')}`);
                          if (boardInfo.board) {
                            console.log(`[Stop & Ask] board keys: ${Object.keys(boardInfo.board).join(', ')}`);
                          }
                        }
                      }
                      
                      if (itemsCount !== null) {
                        totalCount = itemsCount;
                        hasMoreRecords = recordCount < totalCount;
                        console.log(`[Stop & Ask] Fetched total count from get_board_info: ${totalCount}`);
                      } else {
                        // If we couldn't get the count, assume there are more
                        hasMoreRecords = true;
                        console.log(`[Stop & Ask] Could not fetch total count, assuming there are more than ${recordCount}`);
                      }
                    } catch (error) {
                      console.log(`[Stop & Ask] Failed to fetch board info: ${error}`);
                      // If fetch fails, assume there are more
                      hasMoreRecords = true;
                    }
                  }
                }
              }
              
              // Use total count if available, otherwise use record count
              // If we have pagination info (hasMoreRecords) and displayed count >= 25, assume there are more records
              // For get_board_items_page with exactly 25 items, always assume there might be >100
              const finalCount = totalCount !== null ? totalCount : (hasMoreRecords && recordCount >= 25 ? recordCount + 1 : recordCount);
              
              // Trigger warning if:
              // 1. finalCount > 100 (we know there are more than 100)
              // 2. hasMoreRecords && recordCount >= 25 (we got a full page, likely more records)
              // 3. For get_board_items_page with exactly 25 items, always show warning (safe assumption)
              const shouldTrigger = finalCount > 100 || 
                                   (hasMoreRecords && recordCount >= 25) ||
                                   (tool.name === "get_board_items_page" && recordCount === 25);
              
              if (shouldTrigger) {
                const warningMessage = hasMoreRecords && totalCount === null
                  ? `Znaleziono więcej niż ${recordCount} rekordów (dokładna liczba nie jest dostępna, ale jest więcej niż wyświetlono). Proszę zawęzić zakres zapytania (np. przez dodanie filtrów geografii, statusu lub okresu czasowego).`
                  : totalCount !== null
                    ? `Znaleziono ${totalCount} rekordów. Proszę zawęzić zakres zapytania (np. przez dodanie filtrów geografii, statusu lub okresu czasowego).`
                    : `Znaleziono więcej niż ${recordCount} rekordów. Proszę zawęzić zakres zapytania (np. przez dodanie filtrów geografii, statusu lub okresu czasowego).`;
                
                console.log(`[Stop & Ask] Adding warning: ${warningMessage}, finalCount: ${finalCount}, totalCount: ${totalCount}, hasMoreRecords: ${hasMoreRecords}`);
                
                return {
                  ...result,
                  _warning: warningMessage,
                  _total_count: totalCount !== null ? totalCount : finalCount,
                  _displayed_count: recordCount,
                };
              }
            }
            
            // Result is already processed by MCP client
            return result;
          } catch (error) {
            return {
              error: error instanceof Error ? error.message : "Failed to execute tool",
            };
          }
        },
      };
    }
  } catch (error) {
    console.error("Failed to load Monday.com MCP tools:", error);
    // Fallback: use empty tools object, will log error but won't crash
  }

  // isPlanConfirmation is already set at the top of the function

  // Build system prompt with plan if available
  let systemPrompt = `
    You are an organizational assistant. You help employees with:
    - Reviewing tasks from Monday.com (using MCP - READ ONLY)
    - Searching conversation history from Slack
    
    IMPORTANT: Monday.com integration is READ ONLY. 
    You cannot create, modify, or delete data in Monday.com.
    If the user asks for changes, explain that access is read-only.
    
    Today's date: ${new Date().toLocaleDateString('pl-PL')}.
    
    CRITICAL RESPONSE FORMAT:
    - NEVER show raw JSON data or tool results to the user
    - ALWAYS synthesize tool results into natural, conversational Polish language
    - Present information in a clear, organized manner (use bullet points, headings when appropriate)
    - If you find multiple items, summarize the key insights and list only the most relevant ones
    - Act like Perplexity AI - process the data and present conclusions, not raw data
    
    STOP & ASK TRIGGER - CRITICAL RULES (MANDATORY - DO NOT IGNORE):
    - BEFORE displaying ANY records, you MUST check if the tool result contains a "_warning" field
    - If "_warning" is present, you MUST FOLLOW THESE RULES EXACTLY:
      1. Display the warning FIRST at the very beginning of your response in a prominent way
      2. DO NOT list ANY records - DO NOT show item names, details, or summaries
      3. DO NOT create bullet points or lists of items
      4. Inform the user about the total count ONLY (use "_total_count" if available)
      5. Ask the user to narrow the search with specific filters (geography, status, time period, etc.)
      6. DO NOT show any sample records, summaries, or examples
    - If "_total_count" is available, use it to inform the user: "Znaleziono [total_count] rekordów w sumie. Proszę zawęzić zakres zapytania."
    - If "_displayed_count" is available, you can mention: "Wyświetlono tylko [displayed_count] z [total_count] rekordów"
    - CRITICAL: If "_warning" is present, your response should ONLY contain:
      - The warning message
      - Information about total count
      - Request to narrow the search
      - NO item lists, NO summaries, NO examples
    - NEVER display records if "_warning" is present - this is a MANDATORY rule
    
    Respond concisely and specifically. Use tools when the user asks for access to data from Monday or Slack.
  `;

  if (plan) {
    if (isPlanConfirmation) {
      // User confirmed the plan - execute it immediately
      systemPrompt += `\n\nPLAN TO EXECUTE (USER CONFIRMED):\n${plan}\n\nCRITICAL INSTRUCTIONS:
1. The user has CONFIRMED this plan - EXECUTE IT NOW
2. DO NOT ask any questions - you already have all the information you need
3. Use the Monday.com MCP tools (list_boards, get_board_items, search_items_by_column_value) to search for data
4. If the plan mentions "education projects in Kenya" or similar, use search tools with those keywords
5. Start by listing boards or searching directly - DO NOT ask where to search
6. Format the results according to the plan (e.g., for donor = professional summary with impact metrics)`;
    } else {
      // Plan is being presented for the first time - MUST present it and NOT use tools yet
      systemPrompt += `\n\nPLAN TO PRESENT:\n${plan}\n\nIMPORTANT: 
1. PRESENT THIS PLAN TO THE USER in your response - ALWAYS start with "Mam plan! 🎯" followed by the plan steps
2. DO NOT USE TOOLS - wait until the user confirms the plan (e.g., "ok", "tak", "wykonaj")
3. After presenting the plan, ask: "Czy chcesz coś zmienić w tym planie?" or "Czy mogę wykonać ten plan?"
4. ONLY AFTER USER CONFIRMATION use tools according to the plan`;
    }
  }

  // Only provide tools if plan is confirmed or there's no plan
  const toolsToUse = isPlanConfirmation || !plan ? {
    getWeather: {
      description: "Get the current weather at a location",
      parameters: z.object({
        latitude: z.number().describe("Latitude coordinate"),
        longitude: z.number().describe("Longitude coordinate"),
      }),
      execute: async ({ latitude, longitude }: { latitude: number; longitude: number }) => {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
        );

        const weatherData = await response.json();
        return weatherData;
      },
    },
    ...mondayToolsForAI,
    ...slackTools,
  } : {};

  const result = await streamText({
    model: geminiProModel,
    system: systemPrompt,
    messages: coreMessages,
    tools: toolsToUse,
    onFinish: async ({ responseMessages }) => {
      if (session.user && session.user.id) {
        try {
          await saveChat({
            id,
            messages: [...coreMessages, ...responseMessages],
            userId: session.user.id,
          });
        } catch (error) {
          console.error("Failed to save chat");
        }
      }
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: "stream-text",
    },
  });

  return result.toDataStreamResponse({});
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (!chat) {
      return new Response("Not Found", { status: 404 });
    }

    if (chat.userId !== session.user.id) {
      return new Response("Forbidden", { status: 403 });
    }

    await deleteChatById({ id });

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}
