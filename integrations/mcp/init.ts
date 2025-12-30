// Monday.com MCP initialization using official MCP server
// Documentation: https://support.monday.com/hc/en-us/articles/28588158981266-Get-started-with-monday-MCP
// READ-ONLY MODE: Only read operations are allowed, no write/update/delete

import { mcpManager } from "./client";
import { getMondayMCPConfig } from "./monday";
import { filterReadOnlyTools, isReadOnlyTool } from "@/lib/monday-readonly";
import { processMondayPayload, shouldTriggerNarrowWarning } from "@/lib/monday-payload-control";

let mcpInitialized = false;

export async function initializeMCP() {
  if (mcpInitialized) {
    return;
  }

  try {
    // Initialize Monday.com MCP server using official package
    if (process.env.MONDAY_API_TOKEN) {
      await mcpManager.connect(getMondayMCPConfig());
      const boardId = process.env.MONDAY_ALLOWED_BOARD_ID;
      console.log(
        `Monday.com MCP server connected (READ-ONLY MODE${boardId ? `, restricted to board ${boardId}` : ""})`
      );
    } else {
      console.warn("MONDAY_API_TOKEN not set, skipping Monday.com MCP initialization");
    }

    mcpInitialized = true;
  } catch (error) {
    console.error("Failed to initialize MCP servers:", error);
    throw error;
  }
}

export async function getMondayMCPTools() {
  try {
    await initializeMCP();
    const toolsResponse = await mcpManager.listTools("monday");
    // MCP listTools returns { tools: [...] }
    const allTools = toolsResponse.tools || [];
    
    // Filter to only read-only tools
    const readOnlyTools = filterReadOnlyTools(allTools);
    
    console.log(
      `[Monday.com MCP] Loaded ${readOnlyTools.length} read-only tools out of ${allTools.length} total tools`
    );
    
    return readOnlyTools;
  } catch (error) {
    console.error("Failed to get Monday.com MCP tools:", error);
    return [];
  }
}

/**
 * Filter Monday.com MCP results to only include allowed board
 * 
 * HOW TO DISABLE: Set MONDAY_ALLOWED_BOARD_ID to empty string or remove from .env.local
 * When disabled/empty, all boards are accessible
 */
function filterMondayResult(
  result: any,
  allowedBoardId: string,
  toolName: string
): any {
  if (!result) return result;

  // Handle different MCP response structures
  // MCP tools can return: { content: [...], isError: false } or direct data
  let data = result;
  let isWrapped = false;

  // Check if result is MCP-wrapped response
  if (result.content && Array.isArray(result.content)) {
    isWrapped = true;
    // Extract actual data from MCP content wrapper
    const textContent = result.content.find((c: any) => c.type === "text");
    if (textContent && textContent.text) {
      try {
        data = JSON.parse(textContent.text);
      } catch {
        data = textContent.text;
      }
    }
  }

  // Filter boards in response
  let filtered = false;
  let originalCount = 0;
  let filteredCount = 0;

  if (data && typeof data === "object") {
    // Case 1: Direct boards array
    if (Array.isArray(data.boards)) {
      originalCount = data.boards.length;
      data.boards = data.boards.filter((board: any) => board.id === allowedBoardId);
      filteredCount = data.boards.length;
      filtered = true;
    }
    // Case 2: Nested boards in data property
    else if (data.data && Array.isArray(data.data.boards)) {
      originalCount = data.data.boards.length;
      data.data.boards = data.data.boards.filter((board: any) => board.id === allowedBoardId);
      filteredCount = data.data.boards.length;
      filtered = true;
    }
    // Case 3: Single board object (verify it's the allowed one)
    else if (data.board && data.board.id) {
      if (data.board.id !== allowedBoardId) {
        console.warn(
          `[SECURITY] Board filtered out: ${data.board.id} (allowed: ${allowedBoardId})`
        );
        data.board = null;
        filtered = true;
        originalCount = 1;
        filteredCount = 0;
      }
    }
    // Case 4: Direct board in data.data
    else if (data.data && data.data.board && data.data.board.id) {
      if (data.data.board.id !== allowedBoardId) {
        console.warn(
          `[SECURITY] Board filtered out: ${data.data.board.id} (allowed: ${allowedBoardId})`
        );
        data.data.board = null;
        filtered = true;
        originalCount = 1;
        filteredCount = 0;
      }
    }
  }

  if (filtered) {
    console.log(
      `[SECURITY] Filtered boards for ${toolName}: ${originalCount} → ${filteredCount} (allowed: ${allowedBoardId})`
    );
  }

  // Wrap back if it was wrapped
  if (isWrapped && result.content) {
    return {
      ...result,
      content: [
        {
          type: "text",
          text: typeof data === "string" ? data : JSON.stringify(data),
        },
      ],
    };
  }

  return data;
}

/**
 * Extract items array from Monday.com MCP response
 * Handles different response structures: items, items_page.items, boards[].items_page.items
 */
function extractItemsFromResult(result: any): { items: any[]; totalCount: number | null } {
  if (!result || typeof result !== "object") {
    return { items: [], totalCount: null };
  }

  // Case 1: Direct items array
  if (Array.isArray(result.items)) {
    return { items: result.items, totalCount: result.total_count || result.total || null };
  }

  // Case 2: items_page structure
  if (result.items_page && typeof result.items_page === "object") {
    if (Array.isArray(result.items_page.items)) {
      return {
        items: result.items_page.items,
        totalCount: result.items_page.total_count || result.items_page.total || null,
      };
    }
  }

  // Case 3: Single board with items_page
  if (result.board && result.board.items_page && Array.isArray(result.board.items_page.items)) {
    return {
      items: result.board.items_page.items,
      totalCount: result.board.items_count || result.board.items_page.total_count || null,
    };
  }

  // Case 4: Boards array with items_page
  if (Array.isArray(result.boards)) {
    const allItems: any[] = [];
    let totalCount: number | null = null;

    for (const board of result.boards) {
      if (board.items_page && Array.isArray(board.items_page.items)) {
        allItems.push(...board.items_page.items);
        if (typeof board.items_count === "number") {
          totalCount = (totalCount || 0) + board.items_count;
        } else if (typeof board.items_page.total_count === "number") {
          totalCount = (totalCount || 0) + board.items_page.total_count;
        }
      }
    }

    if (allItems.length > 0) {
      return { items: allItems, totalCount };
    }
  }

  // Case 5: Direct array (result is array of items)
  if (Array.isArray(result)) {
    return { items: result, totalCount: result.length };
  }

  return { items: [], totalCount: null };
}

/**
 * Apply payload control to Monday.com result
 * Limits records, estimates tokens, and adds warnings if needed
 */
function applyPayloadControl(result: any, toolName: string): any {
  const { items, totalCount } = extractItemsFromResult(result);

  // Only apply payload control if we have items
  if (items.length === 0) {
    return result;
  }

  // Process payload
  const processed = processMondayPayload(items, {
    maxRecords: parseInt(process.env.MONDAY_MAX_RECORDS || "30", 10),
    triggerNarrowAt: parseInt(process.env.MONDAY_TRIGGER_NARROW_AT || "100", 10),
    compactJson: true,
  });

  // Log payload info
  console.log(
    `[Monday.com Payload] Tool: ${toolName}, Original: ${processed.originalCount} items, ` +
    `Processed: ${processed.items.length} items, ~${processed.tokenEstimate} tokens`
  );

  // If should narrow, add warning metadata
  const finalTotalCount = totalCount !== null ? totalCount : processed.originalCount;
  if (processed.shouldNarrow || finalTotalCount > 100) {
    const warningMessage = finalTotalCount !== null
      ? `Znaleziono ${finalTotalCount} rekordów. Proszę zawęzić zakres zapytania (np. przez dodanie filtrów geografii, statusu lub okresu czasowego).`
      : `Znaleziono więcej niż ${processed.originalCount} rekordów. Proszę zawęzić zakres zapytania (np. przez dodanie filtrów geografii, statusu lub okresu czasowego).`;

    // Reconstruct result with limited items
    const limitedResult = reconstructResultWithItems(result, processed.items);

    return {
      ...limitedResult,
      _warning: warningMessage,
      _total_count: finalTotalCount,
      _displayed_count: processed.items.length,
    };
  }

  // Reconstruct result with limited items (if reduced)
  if (processed.items.length < processed.originalCount) {
    return reconstructResultWithItems(result, processed.items);
  }

  return result;
}

/**
 * Reconstruct Monday.com result structure with new items array
 * Preserves original structure (items_page, board, etc.)
 */
function reconstructResultWithItems(originalResult: any, newItems: any[]): any {
  if (!originalResult || typeof originalResult !== "object") {
    return originalResult;
  }

  // Case 1: Direct items array
  if (Array.isArray(originalResult.items)) {
    return { ...originalResult, items: newItems };
  }

  // Case 2: items_page structure
  if (originalResult.items_page && typeof originalResult.items_page === "object") {
    return {
      ...originalResult,
      items_page: {
        ...originalResult.items_page,
        items: newItems,
      },
    };
  }

  // Case 3: Single board with items_page
  if (originalResult.board && originalResult.board.items_page) {
    return {
      ...originalResult,
      board: {
        ...originalResult.board,
        items_page: {
          ...originalResult.board.items_page,
          items: newItems,
        },
      },
    };
  }

  // Case 4: Boards array with items_page
  if (Array.isArray(originalResult.boards)) {
    // Distribute items across boards (simplified - assumes first board gets all)
    // In production, might need smarter distribution
    const boards = originalResult.boards.map((board: any, index: number) => {
      if (index === 0 && board.items_page) {
        return {
          ...board,
          items_page: {
            ...board.items_page,
            items: newItems,
          },
        };
      }
      return board;
    });

    return { ...originalResult, boards };
  }

  // Case 5: Direct array
  if (Array.isArray(originalResult)) {
    return newItems;
  }

  // Fallback: return original if structure not recognized
  return originalResult;
}

export async function callMondayMCPTool(
  toolName: string,
  args: Record<string, any>
): Promise<any> {
  // Safety check: verify tool is read-only before execution
  if (!isReadOnlyTool(toolName)) {
    throw new Error(
      `[SECURITY] Write operation blocked: ${toolName}. Only read-only operations are allowed.`
    );
  }

  // Board ID validation - restrict access to allowed board only
  // TO DISABLE BOARD RESTRICTION: Set MONDAY_ALLOWED_BOARD_ID to empty string in .env.local
  const allowedBoardId = process.env.MONDAY_ALLOWED_BOARD_ID?.trim();
  if (allowedBoardId) {
    // Check if args contain board_id or boardIds parameter
    // Convert to string for comparison (MCP might use numbers)
    const boardId = args.board_id || args.boardId || args.boardIds?.[0];
    const boardIdStr = boardId ? String(boardId) : null;
    if (boardIdStr && boardIdStr !== allowedBoardId) {
      console.warn(
        `[SECURITY] Board access blocked: Attempted access to board ${boardId}, only board ${allowedBoardId} is allowed`
      );
      throw new Error(
        `Access denied: This PoC is restricted to board ID ${allowedBoardId}`
      );
    }
    
    // For tools that don't specify board_id, inject the allowed board_id if applicable
    // This ensures tools like get_board_items work with the restricted board
    if (!boardId && (toolName.includes("board") || toolName.includes("item"))) {
      // Only inject if the tool accepts board_id parameter
      if (args.board_id === undefined && args.boardId === undefined) {
        // Try as number first (MCP tools often expect numbers), fallback to string
        const boardIdNum = parseInt(allowedBoardId, 10);
        args.boardId = isNaN(boardIdNum) ? allowedBoardId : boardIdNum;
      }
    }
  }

  // Log all MCP tool calls for security monitoring
  console.log(`[Monday.com MCP] Calling tool: ${toolName}`, {
    args: JSON.stringify(args),
    timestamp: new Date().toISOString(),
    boardRestriction: allowedBoardId || "DISABLED (all boards accessible)",
  });

  try {
    await initializeMCP();
    let result = await mcpManager.callTool("monday", toolName, args);
    
    // Apply board filtering to results if board restriction is enabled
    if (allowedBoardId) {
      result = filterMondayResult(result, allowedBoardId, toolName);
    }
    
    // Apply payload control (limit records, estimate tokens, add warnings)
    // Only for tools that return items/boards
    if (toolName.includes("item") || toolName.includes("board")) {
      result = applyPayloadControl(result, toolName);
    }
    
    console.log(`[Monday.com MCP] Tool ${toolName} executed successfully`);
    return result;
  } catch (error) {
    console.error(`[Monday.com MCP] Failed to call tool ${toolName}:`, error);
    throw error;
  }
}

