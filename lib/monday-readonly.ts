// Monday.com MCP Read-Only Configuration
// Whitelist of read-only tools allowed from Monday.com MCP server
// This ensures no write/update/delete operations can be performed
//
// NOTE: This file is in lib/ to avoid Next.js treating exports as server actions

export const READ_ONLY_MONDAY_TOOLS = [
  // Query/Read operations
  "get_boards",
  "get_board",
  "get_boards_by_id",
  "get_items",
  "get_item",
  "get_items_by_id",
  "get_columns",
  "get_column",
  "get_groups",
  "get_group",
  "get_users",
  "get_user",
  "get_workspaces",
  "get_workspace",
  "get_teams",
  "get_team",
  "get_tags",
  "get_tag",
  "get_webhooks",
  "get_webhook",
  "get_activity_logs",
  "get_complexity",
  "get_me",
  "search",
  "query",
  "list",
  "read",
  "fetch",
  "retrieve",
  // Common read-only patterns
  "get_board_items",
  "get_item_details",
  "list_boards",
  "list_items",
  "list_users",
  "list_workspaces",
];

// Blacklist of write operations (for safety)
export const WRITE_OPERATIONS_BLACKLIST = [
  "create",
  "update",
  "delete",
  "remove",
  "add",
  "modify",
  "change",
  "set",
  "post",
  "put",
  "patch",
  "mutate",
  "insert",
  "edit",
  "archive",
  "duplicate",
  "move",
  "copy",
];

/**
 * Check if a tool name is read-only safe
 */
export function isReadOnlyTool(toolName: string): boolean {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b9201153-ef63-4a88-a772-61ccb5dc8c4f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/monday-readonly.ts:isReadOnlyTool',message:'isReadOnlyTool called',data:{toolName},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  const lowerName = toolName.toLowerCase();
  
  // Check blacklist first
  for (const blacklisted of WRITE_OPERATIONS_BLACKLIST) {
    if (lowerName.includes(blacklisted)) {
      return false;
    }
  }
  
  // Check whitelist
  for (const allowed of READ_ONLY_MONDAY_TOOLS) {
    if (lowerName === allowed.toLowerCase() || lowerName.startsWith(allowed.toLowerCase() + "_")) {
      return true;
    }
  }
  
  // If tool starts with "get_" or "list_", it's likely read-only
  if (lowerName.startsWith("get_") || lowerName.startsWith("list_") || lowerName.startsWith("read_")) {
    return true;
  }
  
  // Default: reject unknown tools for safety
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b9201153-ef63-4a88-a772-61ccb5dc8c4f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/monday-readonly.ts:isReadOnlyTool:reject',message:'isReadOnlyTool rejecting unknown tool',data:{toolName,lowerName},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  return false;
}

/**
 * Filter tools to only include read-only operations
 */
export function filterReadOnlyTools(tools: Array<{ name: string; [key: string]: any }>): Array<{ name: string; [key: string]: any }> {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/b9201153-ef63-4a88-a772-61ccb5dc8c4f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/monday-readonly.ts:filterReadOnlyTools',message:'filterReadOnlyTools called',data:{toolCount:tools.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  return tools.filter((tool) => {
    const isReadOnly = isReadOnlyTool(tool.name);
    if (!isReadOnly) {
      console.warn(`[Monday.com MCP] Blocked write operation: ${tool.name}`);
    }
    return isReadOnly;
  });
}


