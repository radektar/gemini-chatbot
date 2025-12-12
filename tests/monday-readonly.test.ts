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

console.log("\n=== All unit tests completed ===");

// Run tests if executed directly
if (require.main === module) {
  // Tests run automatically when file is executed
  console.log("\n✅ Unit test suite completed successfully");
  process.exit(0);
}
