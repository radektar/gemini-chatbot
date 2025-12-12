// Monday.com MCP initialization using official MCP server
// Documentation: https://support.monday.com/hc/en-us/articles/28588158981266-Get-started-with-monday-MCP
// READ-ONLY MODE: Only read operations are allowed, no write/update/delete

import { mcpManager } from "./client";
import { mondayMCPConfig } from "./monday";
import { filterReadOnlyTools, isReadOnlyTool } from "@/lib/monday-readonly";

let mcpInitialized = false;

export async function initializeMCP() {
  if (mcpInitialized) {
    return;
  }

  try {
    // Initialize Monday.com MCP server using official package
    if (process.env.MONDAY_API_TOKEN) {
      await mcpManager.connect(mondayMCPConfig);
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
  const allowedBoardId = process.env.MONDAY_ALLOWED_BOARD_ID;
  if (allowedBoardId) {
    // Check if args contain board_id or boardIds parameter
    const boardId = args.board_id || args.boardId || args.boardIds?.[0];
    if (boardId && boardId !== allowedBoardId) {
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
        args.board_id = allowedBoardId;
      }
    }
  }

  // Log all MCP tool calls for security monitoring
  console.log(`[Monday.com MCP] Calling tool: ${toolName}`, {
    args: JSON.stringify(args),
    timestamp: new Date().toISOString(),
  });

  try {
    await initializeMCP();
    const result = await mcpManager.callTool("monday", toolName, args);
    console.log(`[Monday.com MCP] Tool ${toolName} executed successfully`);
    return result;
  } catch (error) {
    console.error(`[Monday.com MCP] Failed to call tool ${toolName}:`, error);
    throw error;
  }
}

