/**
 * Integration tests for Monday.com MCP security
 * Tests callMondayMCPTool() function to ensure write operations are blocked
 */

import { callMondayMCPTool } from "@/integrations/mcp/init";

// Simple test assertion helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

function assertThrows(fn: () => Promise<any>, expectedErrorPattern?: string) {
  return async () => {
    let threw = false;
    let errorMessage = "";
    try {
      await fn();
    } catch (error) {
      threw = true;
      errorMessage = error instanceof Error ? error.message : String(error);
    }
    assert(threw, "Expected function to throw an error, but it didn't");
    if (expectedErrorPattern) {
      assert(
        errorMessage.includes(expectedErrorPattern),
        `Expected error to contain "${expectedErrorPattern}", but got: ${errorMessage}`
      );
    }
  };
}

function test(name: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn();
      console.log(`✅ ${name}`);
    } catch (error) {
      console.error(`❌ ${name}`);
      console.error(`   ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  };
}

// Test suite
async function runTests() {
  console.log("=== Integration Tests: Monday.com MCP Security ===\n");

  // Test 1: Write operations should throw security error
  await test(
    "callMondayMCPTool should throw [SECURITY] error for write operations",
    assertThrows(
      async () => {
        await callMondayMCPTool("create_item", { board_id: 123, item_name: "Test" });
      },
      "[SECURITY]"
    )
  )();

  // Test 2: Multiple write operations should all be blocked
  const writeOperations = [
    { name: "create_board", args: { board_name: "Test Board" } },
    { name: "update_item", args: { item_id: 123, column_values: {} } },
    { name: "delete_item", args: { item_id: 123 } },
    { name: "add_column", args: { board_id: 123, column_title: "Test" } },
    { name: "modify_item", args: { item_id: 123 } },
    { name: "archive_board", args: { board_id: 123 } },
    { name: "duplicate_item", args: { item_id: 123 } },
  ];

  for (const op of writeOperations) {
    await test(
      `callMondayMCPTool should block ${op.name}`,
      assertThrows(
        async () => {
          await callMondayMCPTool(op.name, op.args);
        },
        "[SECURITY]"
      )
    )();
  }

  // Test 3: Error message should contain tool name
  await test(
    "Security error should contain blocked tool name",
    assertThrows(async () => {
      try {
        await callMondayMCPTool("create_item", {});
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        assert(
          errorMessage.includes("create_item"),
          `Error message should contain tool name 'create_item', got: ${errorMessage}`
        );
        assert(
          errorMessage.includes("Write operation blocked"),
          `Error message should contain 'Write operation blocked', got: ${errorMessage}`
        );
        throw error; // Re-throw to satisfy assertThrows
      }
    })
  )();

  // Test 4: Error message should indicate read-only mode
  await test(
    "Security error should mention read-only mode",
    assertThrows(async () => {
      try {
        await callMondayMCPTool("update_board", {});
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        assert(
          errorMessage.includes("read-only") || errorMessage.includes("Only read-only"),
          `Error message should mention read-only mode, got: ${errorMessage}`
        );
        throw error; // Re-throw to satisfy assertThrows
      }
    })
  )();

  // Note: We don't test actual read operations here because:
  // 1. They require a valid MONDAY_API_TOKEN
  // 2. They require actual Monday.com API connection
  // 3. They would make real API calls
  // These tests focus on security blocking, not API functionality

  console.log("\n=== All integration tests completed ===");
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch((error) => {
    console.error("Test suite failed:", error);
    process.exit(1);
  });
}

export { runTests };






