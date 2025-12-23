/**
 * Enhanced tests for Monday.com read-only mode
 * Based on Python monday_readonly_client test structure
 * Tests explicit whitelist/blacklist, fail-safe behavior, and GraphQL validation
 */

import {
  isReadOnlyTool,
  validateReadOnlyOperation,
  validateGraphQLQuery,
  ReadOnlyModeError,
  MONDAY_READ_ONLY_OPERATIONS,
  MONDAY_WRITE_OPERATIONS,
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

console.log("=== Enhanced Tests: Monday.com MCP Read-Only Security ===\n");

// Test Class 1: Read-Only Operations
test("Explicit read operations should be allowed", () => {
  const readOps = [
    "mcp_monday-mcp_get_board_info",
    "mcp_monday-mcp_get_board_items_page",
    "mcp_monday-mcp_search",
    "mcp_monday-mcp_list_workspaces",
    "get_board_info",
    "get_board_items_page",
    "search",
    "list_workspaces",
  ];

  readOps.forEach((op) => {
    assert(isReadOnlyTool(op) === true, `Expected ${op} to be allowed`);
    try {
      validateReadOnlyOperation(op);
    } catch (error) {
      throw new Error(`validateReadOnlyOperation should not throw for ${op}`);
    }
  });
});

test("Fuzzy-matched read operations should be allowed", () => {
  const fuzzyOps = [
    "get_something_new",
    "list_all_items",
    "read_documentation",
    "fetch_data",
    "search_items",
    "query_boards",
  ];

  fuzzyOps.forEach((op) => {
    assert(isReadOnlyTool(op) === true, `Expected ${op} to be allowed by pattern`);
  });
});

// Test Class 2: Write Operations
test("Explicit write operations should be blocked", () => {
  const writeOps = [
    "mcp_monday-mcp_create_item",
    "mcp_monday-mcp_create_board",
    "mcp_monday-mcp_delete_item",
    "mcp_monday-mcp_change_item_column_values",
    "create_item",
    "create_board",
    "delete_item",
    "change_item_column_values",
  ];

  writeOps.forEach((op) => {
    assert(isReadOnlyTool(op) === false, `Expected ${op} to be blocked`);
    try {
      validateReadOnlyOperation(op);
      throw new Error(`validateReadOnlyOperation should throw for ${op}`);
    } catch (error) {
      assert(
        error instanceof ReadOnlyModeError,
        `Expected ReadOnlyModeError, got ${error instanceof Error ? error.constructor.name : typeof error}`
      );
      assert(
        (error as ReadOnlyModeError).operationName === op,
        `Expected operationName to be ${op}, got ${(error as ReadOnlyModeError).operationName}`
      );
    }
  });
});

test("Keyword-matched write operations should be blocked", () => {
  const keywordOps = [
    "update_something",
    "modify_item",
    "delete_board",
    "mutate_data",
    "create_new_item",
    "archive_old_items",
  ];

  keywordOps.forEach((op) => {
    assert(isReadOnlyTool(op) === false, `Expected ${op} to be blocked by keyword`);
  });
});

// Test Class 3: Unknown Operations (Fail-Safe)
test("Unknown operations should be blocked by default (fail-safe)", () => {
  const unknownOps = [
    "mcp_monday-mcp_totally_unknown_operation",
    "weird_operation_name",
    "something_random",
    "unknown_function",
  ];

  unknownOps.forEach((op) => {
    assert(isReadOnlyTool(op) === false, `Expected unknown ${op} to be blocked`);
    try {
      validateReadOnlyOperation(op);
      throw new Error(`validateReadOnlyOperation should throw for unknown ${op}`);
    } catch (error) {
      assert(
        error instanceof ReadOnlyModeError,
        `Expected ReadOnlyModeError for unknown operation`
      );
    }
  });
});

// Test Class 4: GraphQL Validation
test("Read-only GraphQL queries should be allowed", () => {
  const query = `
    query {
      boards(ids: [123456]) {
        name
        items {
          name
        }
      }
    }
  `;

  try {
    validateGraphQLQuery(query);
  } catch (error) {
    throw new Error(`Read-only query should not be blocked: ${error}`);
  }
});

test("GraphQL mutations should be blocked", () => {
  const mutation = `
    mutation {
      create_item(board_id: 123456, item_name: "Test") {
        id
      }
    }
  `;

  try {
    validateGraphQLQuery(mutation);
    throw new Error("Mutation should be blocked");
  } catch (error) {
    assert(
      error instanceof ReadOnlyModeError,
      `Expected ReadOnlyModeError for mutation`
    );
    assert(
      error.message.includes("mutation") || error.message.includes("create"),
      `Error message should mention mutation: ${error.message}`
    );
  }
});

test("GraphQL queries with mutation keywords but no mutation block should be allowed", () => {
  // Query that mentions "create" but is not a mutation
  const query = `
    query {
      boards(ids: [123456]) {
        name
        items {
          name
          # This is a comment about creating items, not a mutation
        }
      }
    }
  `;

  try {
    validateGraphQLQuery(query);
  } catch (error) {
    throw new Error(`Query with mutation keyword in comment should be allowed: ${error}`);
  }
});

// Test Class 5: Whitelist/Blacklist Consistency
test("Whitelist and blacklist should have no overlap", () => {
  const overlap = [...MONDAY_READ_ONLY_OPERATIONS].filter((op) =>
    MONDAY_WRITE_OPERATIONS.has(op)
  );

  assert(
    overlap.length === 0,
    `Found overlap between whitelist and blacklist: ${overlap.join(", ")}`
  );
});

test("Whitelist and blacklist should not be empty", () => {
  assert(
    MONDAY_READ_ONLY_OPERATIONS.size > 0,
    "Whitelist should not be empty"
  );
  assert(
    MONDAY_WRITE_OPERATIONS.size > 0,
    "Blacklist should not be empty"
  );
});

// Test Class 6: ReadOnlyModeError Details
test("ReadOnlyModeError should contain operation name in message", () => {
  const operationName = "mcp_monday-mcp_create_item";

  try {
    validateReadOnlyOperation(operationName);
    throw new Error("Should throw ReadOnlyModeError");
  } catch (error) {
    assert(
      error instanceof ReadOnlyModeError,
      `Expected ReadOnlyModeError, got ${error instanceof Error ? error.constructor.name : typeof error}`
    );
    assert(
      (error as ReadOnlyModeError).operationName === operationName,
      `Expected operationName to be ${operationName}`
    );
    assert(
      error.message.includes(operationName) || error.message.includes("create_item"),
      `Error message should contain operation name: ${error.message}`
    );
    assert(
      error.message.includes("BLOCKED") || error.message.includes("blocked"),
      `Error message should indicate blocking: ${error.message}`
    );
  }
});

test("ReadOnlyModeError should have correct error name", () => {
  try {
    validateReadOnlyOperation("create_item");
  } catch (error) {
    assert(
      error instanceof ReadOnlyModeError,
      "Should be ReadOnlyModeError instance"
    );
    assert(
      (error as Error).name === "ReadOnlyModeError",
      `Expected name to be ReadOnlyModeError, got ${(error as Error).name}`
    );
  }
});

// Test Class 7: Normalization
test("Operation name normalization should work correctly", () => {
  // Test with MCP prefix
  assert(
    isReadOnlyTool("mcp_monday-mcp_get_board_info") === true,
    "Normalized MCP prefixed operation should be allowed"
  );
  assert(
    isReadOnlyTool("mcp_monday-mcp_create_item") === false,
    "Normalized MCP prefixed write operation should be blocked"
  );

  // Test without prefix
  assert(
    isReadOnlyTool("get_board_info") === true,
    "Operation without prefix should be allowed"
  );
  assert(
    isReadOnlyTool("create_item") === false,
    "Write operation without prefix should be blocked"
  );
});

console.log("\n=== All enhanced tests completed ===");

// Export function to run tests programmatically
export async function runEnhancedTests() {
  // Tests run automatically when this module is imported/executed
  return Promise.resolve();
}

// Run tests if executed directly
if (require.main === module) {
  console.log("\n✅ Enhanced test suite completed successfully");
  process.exit(0);
}


