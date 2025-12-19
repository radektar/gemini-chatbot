/**
 * Unit tests for Monday.com MCP read-only security functions
 * Tests isReadOnlyTool() and filterReadOnlyTools() functions
 */

import {
  isReadOnlyTool,
  filterReadOnlyTools,
  READ_ONLY_MONDAY_TOOLS,
  WRITE_OPERATIONS_BLACKLIST,
} from "@/lib/monday-readonly";

// Simple test assertion helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// Test suite
console.log("=== Unit Tests: Monday.com MCP Read-Only Security ===\n");

// Test 1: Read-only operations should be allowed
test("Read-only operations (GET/LIST) should be allowed", () => {
  const readOnlyOperations = [
    "get_boards",
    "get_board",
    "get_items",
    "get_item",
    "list_items",
    "list_boards",
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
    "read",
    "fetch",
    "retrieve",
    "get_board_items",
    "get_item_details",
    "list_users",
    "list_workspaces",
  ];

  for (const tool of readOnlyOperations) {
    assert(
      isReadOnlyTool(tool),
      `Expected ${tool} to be allowed (read-only), but it was blocked`
    );
  }
});

// Test 2: Write operations should be blocked
test("Write operations (CREATE/UPDATE/DELETE) should be blocked", () => {
  const writeOperations = [
    "create_board",
    "create_item",
    "create_column",
    "update_board",
    "update_item",
    "update_column",
    "delete_board",
    "delete_item",
    "delete_column",
    "remove_item",
    "add_column",
    "add_item",
    "modify_board",
    "modify_item",
    "change_status",
    "set_column_value",
    "post_update",
    "put_item",
    "patch_board",
    "mutate_item",
    "insert_item",
    "edit_item",
    "archive_board",
    "archive_item",
    "duplicate_board",
    "duplicate_item",
    "move_item",
    "copy_item",
  ];

  for (const tool of writeOperations) {
    assert(
      !isReadOnlyTool(tool),
      `Expected ${tool} to be blocked (write operation), but it was allowed`
    );
  }
});

// Test 3: Edge cases - case-insensitive matching should work
test("Case-insensitive matching should work", () => {
  assert(isReadOnlyTool("GET_BOARDS"), "Uppercase GET_BOARDS should be allowed");
  assert(isReadOnlyTool("Get_Boards"), "Mixed case Get_Boards should be allowed");
  assert(isReadOnlyTool("get_BOARDS"), "Mixed case get_BOARDS should be allowed");
  assert(!isReadOnlyTool("CREATE_ITEM"), "Uppercase CREATE_ITEM should be blocked");
  assert(!isReadOnlyTool("Create_Item"), "Mixed case Create_Item should be blocked");
  // Note: camelCase like "GetBoards" is correctly blocked as unknown (fail-safe security)
});

// Test 4: Edge cases - tools with prefixes
test("Tools with prefixes should match correctly", () => {
  assert(
    isReadOnlyTool("get_board_details"),
    "get_board_details should be allowed (starts with get_)"
  );
  assert(
    isReadOnlyTool("list_board_items"),
    "list_board_items should be allowed (starts with list_)"
  );
  assert(
    !isReadOnlyTool("create_board_item"),
    "create_board_item should be blocked (contains create)"
  );
});

// Test 5: Unknown tools should be blocked by default (fail-safe)
test("Unknown tools should be blocked by default (fail-safe)", () => {
  const unknownTools = [
    "unknown_tool",
    "mystery_function",
    "random_operation",
    "some_action",
  ];

  for (const tool of unknownTools) {
    assert(
      !isReadOnlyTool(tool),
      `Expected unknown tool ${tool} to be blocked (fail-safe), but it was allowed`
    );
  }
});

// Test 6: filterReadOnlyTools should filter correctly
test("filterReadOnlyTools should filter out write operations", () => {
  const mockTools = [
    { name: "get_boards", description: "Get boards" },
    { name: "get_items", description: "Get items" },
    { name: "create_item", description: "Create item" },
    { name: "update_item", description: "Update item" },
    { name: "delete_item", description: "Delete item" },
    { name: "list_boards", description: "List boards" },
  ];

  const filtered = filterReadOnlyTools(mockTools);

  assert(
    filtered.length === 3,
    `Expected 3 read-only tools, got ${filtered.length}`
  );
  assert(
    filtered.every((t) => ["get_boards", "get_items", "list_boards"].includes(t.name)),
    "Filtered tools should only contain read-only operations"
  );
  assert(
    !filtered.some((t) => ["create_item", "update_item", "delete_item"].includes(t.name)),
    "Filtered tools should not contain write operations"
  );
});

// Test 7: filterReadOnlyTools should preserve tool structure
test("filterReadOnlyTools should preserve tool structure", () => {
  const mockTools = [
    { name: "get_boards", description: "Get boards", inputSchema: {} },
    { name: "create_item", description: "Create item", inputSchema: {} },
  ];

  const filtered = filterReadOnlyTools(mockTools);

  assert(filtered.length === 1, "Should filter to 1 tool");
  assert(
    filtered[0].name === "get_boards",
    "Filtered tool should be get_boards"
  );
  assert(
    filtered[0].description === "Get boards",
    "Tool description should be preserved"
  );
  assert(
    filtered[0].inputSchema !== undefined,
    "Tool inputSchema should be preserved"
  );
});

// Test 8: Empty array should return empty array
test("filterReadOnlyTools with empty array should return empty array", () => {
  const filtered = filterReadOnlyTools([]);
  assert(filtered.length === 0, "Empty input should return empty array");
});

// Test 9: All whitelist tools should be allowed
test("All tools in READ_ONLY_MONDAY_TOOLS whitelist should be allowed", () => {
  for (const tool of READ_ONLY_MONDAY_TOOLS) {
    assert(
      isReadOnlyTool(tool),
      `Whitelisted tool ${tool} should be allowed`
    );
  }
});

// Test 10: Tools containing blacklisted keywords should be blocked
test("Tools containing blacklisted keywords should be blocked", () => {
  for (const keyword of WRITE_OPERATIONS_BLACKLIST) {
    const testTool = `${keyword}_something`;
    assert(
      !isReadOnlyTool(testTool),
      `Tool containing blacklisted keyword '${keyword}' should be blocked`
    );
  }
});

// Test 11: Mutation operations should be blocked
test("Mutation operations (mutate, insert, post, put, patch) should be blocked", () => {
  const mutationOperations = [
    "mutate_item",
    "mutate_board",
    "mutate_column",
    "mutate_group",
    "insert_item",
    "insert_board",
    "insert_column",
    "post_update",
    "post_comment",
    "post_file",
    "put_item",
    "put_board",
    "put_column_value",
    "patch_item",
    "patch_board",
    "patch_column",
  ];

  for (const tool of mutationOperations) {
    assert(
      !isReadOnlyTool(tool),
      `Expected mutation operation ${tool} to be blocked, but it was allowed`
    );
  }
});

// Test 12: Compound operations should be blocked
test("Compound operations (move_to, change_multiple, etc.) should be blocked", () => {
  const compoundOperations = [
    "move_item_to_group",
    "move_item_to_board",
    "change_multiple_column_values",
    "change_item_status",
    "change_board_settings",
    "change_column_settings",
    "update_multiple_items",
    "bulk_update_items",
    "bulk_create_items",
    "bulk_delete_items",
    "copy_item_to_board",
    "copy_board",
    "duplicate_item_with_updates",
    "merge_items",
    "split_item",
  ];

  for (const tool of compoundOperations) {
    assert(
      !isReadOnlyTool(tool),
      `Expected compound operation ${tool} to be blocked, but it was allowed`
    );
  }
});

// Test 13: Admin operations should be blocked
test("Admin operations (invite, remove, permissions) should be blocked", () => {
  const adminOperations = [
    "invite_user",
    "invite_user_to_board",
    "invite_user_to_workspace",
    "remove_user",
    "remove_user_from_board",
    "remove_user_from_workspace",
    "change_permissions",
    "change_user_permissions",
    "change_board_permissions",
    "change_workspace_permissions",
    "set_user_role",
    "set_board_role",
    "grant_access",
    "revoke_access",
    "create_workspace",
    "delete_workspace",
    "update_workspace",
    "create_team",
    "delete_team",
    "update_team",
    "add_user_to_team",
    "remove_user_from_team",
  ];

  for (const tool of adminOperations) {
    assert(
      !isReadOnlyTool(tool),
      `Expected admin operation ${tool} to be blocked, but it was allowed`
    );
  }
});

console.log("\n=== All unit tests completed ===");

// Export function to run tests programmatically
export async function runTests() {
  // Tests run automatically when this module is imported/executed
  // The test() calls above execute immediately
  return Promise.resolve();
}

// Run tests if executed directly
if (require.main === module) {
  // Tests run automatically when file is executed
  console.log("\n✅ Unit test suite completed successfully");
  process.exit(0);
}
