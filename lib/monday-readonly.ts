// Monday.com MCP Read-Only Configuration
// Whitelist of read-only tools allowed from Monday.com MCP server
// This ensures no write/update/delete operations can be performed
//
// NOTE: This file is in lib/ to avoid Next.js treating exports as server actions

/**
 * Explicit whitelist of known read-only MCP operations
 * Based on @mondaydotcomorg/monday-api-mcp documentation
 * These are normalized names (without mcp_monday-mcp_ prefix)
 */
export const MONDAY_READ_ONLY_OPERATIONS = new Set([
  // Board operations
  "get_board_info",
  "get_board_items_page",
  "get_board_activity",
  "board_insights",
  "get_boards",
  "get_board",
  "get_boards_by_id",
  
  // Item operations (read-only)
  "get_items",
  "get_item",
  "get_items_by_id",
  "get_item_details",
  "get_board_items",
  
  // Columns & Groups (read-only)
  "get_columns",
  "get_column",
  "get_groups",
  "get_group",
  
  // Search & List
  "search",
  "list_workspaces",
  "workspace_info",
  "list_users_and_teams",
  "list_boards",
  "list_items",
  "list_users",
  
  // Users & Teams
  "get_users",
  "get_user",
  "get_teams",
  "get_team",
  "get_me",
  
  // Workspaces
  "get_workspaces",
  "get_workspace",
  
  // Tags & Webhooks
  "get_tags",
  "get_tag",
  "get_webhooks",
  "get_webhook",
  
  // Activity & Complexity
  "get_activity_logs",
  "get_complexity",
  
  // Documentation & Schema
  "read_docs",
  "get_form",
  "get_graphql_schema",
  "get_type_details",
  "get_column_type_info",
  
  // Sprints (Monday Dev)
  "get_monday_dev_sprints_boards",
  "get_sprints_metadata",
  "get_sprint_summary",
  
  // Generic read patterns (for compatibility)
  "query",
  "read",
  "fetch",
  "retrieve",
]);

/**
 * Explicit blacklist of known write operations
 * These are NEVER allowed, even if they pass fuzzy matching
 * Normalized names (without mcp_monday-mcp_ prefix)
 */
export const MONDAY_WRITE_OPERATIONS = new Set([
  // Item mutations
  "create_item",
  "change_item_column_values",
  "delete_item",
  "archive_item",
  "duplicate_item",
  
  // Board mutations
  "create_board",
  "create_column",
  "create_group",
  "duplicate_board",
  "delete_board",
  
  // Updates & Comments
  "create_update",
  "delete_update",
  
  // Forms
  "create_form",
  "update_form",
  "form_questions_editor",
  
  // Workspace & Docs mutations
  "create_workspace",
  "update_workspace",
  "create_doc",
  "create_dashboard",
  "create_widget",
  "create_folder",
  "update_folder",
  "move_object",
]);

/**
 * Custom exception for read-only mode violations
 */
export class ReadOnlyModeError extends Error {
  constructor(
    public readonly operationName: string,
    message?: string
  ) {
    super(
      message ||
        `❌ Write operation '${operationName}' is BLOCKED in read-only mode. ` +
        `This integration uses read-only access to prevent accidental data modifications.`
    );
    this.name = "ReadOnlyModeError";
  }
}

// Legacy arrays for backward compatibility (deprecated, use Sets above)
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

// Blacklist of write operations (for safety) - keyword matching
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
 * Normalize operation name by removing MCP prefix
 * Converts "mcp_monday-mcp_get_board_info" -> "get_board_info"
 */
function normalizeOperationName(operationName: string): string {
  const lowerName = operationName.toLowerCase();
  // Remove common MCP prefixes
  if (lowerName.startsWith("mcp_monday-mcp_")) {
    return lowerName.replace("mcp_monday-mcp_", "");
  }
  if (lowerName.startsWith("mcp_")) {
    return lowerName.replace("mcp_", "");
  }
  return lowerName;
}

/**
 * Validate if operation is read-only safe
 * Uses explicit whitelist + fuzzy matching + fail-safe default
 * 
 * 5-stage validation:
 * 1. Check explicit blacklist (highest priority)
 * 2. Check explicit whitelist
 * 3. Check blacklist keywords (fuzzy)
 * 4. Check read patterns (get_, list_, read_)
 * 5. Fail-safe: reject unknown operations
 */
export function isReadOnlyTool(toolName: string): boolean {
  const lowerName = toolName.toLowerCase();
  const normalizedName = normalizeOperationName(toolName);
  
  // STEP 1: Check explicit blacklist first (highest priority)
  if (MONDAY_WRITE_OPERATIONS.has(normalizedName)) {
    console.warn(`[Monday.com MCP] ❌ Blocked explicit write operation: ${toolName}`);
    return false;
  }
  
  // STEP 2: Check explicit whitelist
  if (MONDAY_READ_ONLY_OPERATIONS.has(normalizedName)) {
    console.log(`[Monday.com MCP] ✅ Allowed explicit read operation: ${toolName}`);
    return true;
  }
  
  // STEP 3: Check blacklist keywords (fuzzy matching)
  for (const blacklisted of WRITE_OPERATIONS_BLACKLIST) {
    if (lowerName.includes(blacklisted)) {
      console.warn(`[Monday.com MCP] ❌ Blocked by keyword '${blacklisted}': ${toolName}`);
      return false;
    }
  }
  
  // STEP 4: Check legacy whitelist for backward compatibility
  // This handles single words like "list", "read", "query" from old READ_ONLY_MONDAY_TOOLS
  for (const allowed of READ_ONLY_MONDAY_TOOLS) {
    if (lowerName === allowed.toLowerCase() || lowerName.startsWith(allowed.toLowerCase() + "_")) {
      console.log(`[Monday.com MCP] ✅ Allowed by legacy whitelist: ${toolName}`);
      return true;
    }
  }
  
  // STEP 5: Fuzzy matching for common read patterns
  if (
    lowerName.startsWith("get_") ||
    lowerName.startsWith("list_") ||
    lowerName.startsWith("read_") ||
    lowerName.startsWith("search_") ||
    lowerName.startsWith("fetch_") ||
    lowerName.startsWith("query_") ||
    lowerName.startsWith("retrieve_")
  ) {
    console.log(`[Monday.com MCP] ✅ Allowed by pattern: ${toolName}`);
    return true;
  }
  
  // STEP 6: FAIL-SAFE DEFAULT - reject unknown operations
  console.warn(
    `[Monday.com MCP] ⚠️  Unknown operation '${toolName}' - BLOCKED by default (fail-safe). ` +
    `If this is a read-only operation, add it to MONDAY_READ_ONLY_OPERATIONS.`
  );
  return false;
}

/**
 * Validate operation and throw error if blocked
 * Similar to Python's validate_operation()
 */
export function validateReadOnlyOperation(operationName: string): void {
  if (!isReadOnlyTool(operationName)) {
    throw new ReadOnlyModeError(operationName);
  }
}

/**
 * Validate GraphQL query to ensure no mutations
 * Based on Python's validate_graphql_query()
 */
export function validateGraphQLQuery(query: string): void {
  const queryLower = query.toLowerCase().trim();
  
  // Remove comments and strings to avoid false positives
  const withoutComments = queryLower
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove /* */ comments
    .replace(/\/\/.*$/gm, "") // Remove // comments
    .replace(/"[^"]*"/g, "") // Remove string literals
    .replace(/'[^']*'/g, ""); // Remove single-quoted strings
  
  // Check if it's a mutation operation
  // GraphQL mutations start with "mutation" keyword followed by optional name and {
  const mutationPattern = /^\s*mutation\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\{/m;
  const mutationPatternNoName = /^\s*mutation\s*\{/m;
  
  if (mutationPattern.test(withoutComments) || mutationPatternNoName.test(withoutComments)) {
    // Extract mutation name if possible
    const mutationNameMatch = withoutComments.match(/mutation\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
    const mutationName = mutationNameMatch ? mutationNameMatch[1] : "anonymous";
    
    throw new ReadOnlyModeError(
      `GraphQL mutation: ${mutationName}`,
      `❌ GraphQL mutation '${mutationName}' is BLOCKED in read-only mode.`
    );
  }
  
  console.log("[Monday.com MCP] ✅ GraphQL query is read-only safe");
}

/**
 * Filter tools to only include read-only operations
 */
export function filterReadOnlyTools(tools: Array<{ name: string; [key: string]: any }>): Array<{ name: string; [key: string]: any }> {
  return tools.filter((tool) => {
    const isReadOnly = isReadOnlyTool(tool.name);
    if (!isReadOnly) {
      console.warn(`[Monday.com MCP] Blocked write operation: ${tool.name}`);
    }
    return isReadOnly;
  });
}



