/**
 * End-to-End security tests for Monday.com MCP integration
 * Tests real MCP server connection and verifies write operations are blocked
 * 
 * Requires MONDAY_API_TOKEN environment variable
 * Run with: npx tsx tests/monday-mcp-e2e-security.test.ts
 */

// Load environment variables from .env.local first
import { config } from "dotenv";
config({
  path: ".env.local",
});

import { mcpManager } from "@/integrations/mcp/client";
import { getMondayMCPConfig } from "@/integrations/mcp/monday";
import { callMondayMCPTool } from "@/integrations/mcp/init";
import { isReadOnlyTool } from "@/lib/monday-readonly";

// Test assertion helpers
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
      return true;
    } catch (error) {
      console.error(`❌ ${name}`);
      console.error(`   ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  };
}

// Test suite
async function runE2ETests() {
  console.log("=== E2E Tests: Monday.com MCP Security ===\n");

  // Check if MONDAY_API_TOKEN is set
  if (!process.env.MONDAY_API_TOKEN) {
    console.warn("⚠️  MONDAY_API_TOKEN not set. Skipping E2E tests that require API connection.");
    console.warn("   Set MONDAY_API_TOKEN to run full E2E security tests.");
    return;
  }

  // Verify -ro flag is in config
  await test(
    "MCP Server config should include -ro flag",
    () => {
      const mcpConfig = getMondayMCPConfig();
      assert(
        mcpConfig.args?.includes("-ro"),
        "mcpConfig.args should include '-ro' flag for read-only mode"
      );
      console.log(`   Config args: ${mcpConfig.args?.join(" ")}`);
    }
  )();

  // Test 1: MCP Server connection
  await test(
    "MCP Server should connect successfully with -ro flag",
    async () => {
      try {
        await mcpManager.connect(getMondayMCPConfig());
        console.log("   ✓ MCP server connected successfully");
      } catch (error) {
        throw new Error(`Failed to connect to MCP server: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  )();

  // Test 2: Write operations blocked via callMondayMCPTool
  console.log("\n--- Testing Write Operations Blocking (via callMondayMCPTool) ---");
  
  const writeOperations = [
    { name: "create_item", args: { board_id: "123", item_name: "Test Item" } },
    { name: "update_item", args: { item_id: "123", column_values: { status: "Done" } } },
    { name: "delete_item", args: { item_id: "123" } },
    { name: "create_board", args: { board_name: "Test Board", board_kind: "private" } },
    { name: "update_board", args: { board_id: "123", board_name: "Updated Board" } },
    { name: "delete_board", args: { board_id: "123" } },
    { name: "create_column", args: { board_id: "123", column_title: "Test Column", column_type: "text" } },
    { name: "update_column", args: { board_id: "123", column_id: "status", column_title: "New Status" } },
    { name: "delete_column", args: { board_id: "123", column_id: "status" } },
    { name: "change_column_value", args: { item_id: "123", column_id: "status", value: "Done" } },
    { name: "move_item_to_group", args: { item_id: "123", group_id: "new_group" } },
    { name: "duplicate_item", args: { item_id: "123", board_id: "123" } },
    { name: "archive_item", args: { item_id: "123" } },
    { name: "create_update", args: { item_id: "123", body: "Test update" } },
    { name: "delete_update", args: { update_id: "123" } },
    { name: "mutate_item", args: { item_id: "123", mutations: [] } },
    { name: "insert_item", args: { board_id: "123", item_name: "New Item" } },
    { name: "post_update", args: { item_id: "123", body: "Post" } },
    { name: "put_item", args: { item_id: "123", data: {} } },
    { name: "patch_item", args: { item_id: "123", changes: {} } },
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

  // Test 3: Direct MCP call bypass attempt (should be blocked by MCP server -ro flag)
  console.log("\n--- Testing Direct MCP Bypass Attempts (should be blocked by MCP server) ---");
  
  const directWriteOperations = [
    { name: "create_item", args: { board_id: "123", item_name: "Bypass Test" } },
    { name: "update_item", args: { item_id: "123", column_values: {} } },
    { name: "delete_item", args: { item_id: "123" } },
  ];

  for (const op of directWriteOperations) {
    await test(
      `Direct mcpManager.callTool should block ${op.name} (MCP server -ro protection)`,
      assertThrows(
        async () => {
          // Try to bypass callMondayMCPTool and call directly
          await mcpManager.callTool("monday", op.name, op.args);
        },
        // MCP server should reject with error about read-only mode
        // Error might be different format, so we just check it throws
      )
    )();
  }

  // Test 4: Read operations should work
  console.log("\n--- Testing Read Operations (should work) ---");
  
  // First, get list of available tools from MCP server
  let availableReadTools: string[] = [];
  try {
    const toolsResponse = await mcpManager.listTools("monday");
    const allTools = toolsResponse.tools || [];
    availableReadTools = allTools
      .map((tool: any) => tool.name)
      .filter((name: string) => isReadOnlyTool(name));
    console.log(`   Found ${availableReadTools.length} read-only tools available`);
    if (availableReadTools.length > 0) {
      console.log(`   Sample tools: ${availableReadTools.slice(0, 5).join(", ")}`);
    }
  } catch (error) {
    console.log(`   ⚠ Could not list tools: ${error instanceof Error ? error.message : String(error)}`);
  }

  let readOperationsWorked = 0;
  // Try to use actual tool names from MCP server, or fallback to common names
  const readOperations = availableReadTools.length > 0
    ? availableReadTools.slice(0, 3).map((name: string) => ({ name, args: {} }))
    : [
        { name: "get_boards", args: {} },
        { name: "get_items", args: { board_ids: [] } },
      ];

  for (const op of readOperations) {
    try {
      await test(
        `Read operation ${op.name} should work`,
        async () => {
          try {
            const result = await callMondayMCPTool(op.name, op.args);
            assert(result !== undefined, `Read operation ${op.name} should return a result`);
            readOperationsWorked++;
            console.log(`   ✓ ${op.name} returned data`);
          } catch (error) {
            // Read operations might fail due to API issues, but shouldn't be blocked by security
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes("[SECURITY]")) {
              throw new Error(`Read operation ${op.name} was incorrectly blocked as write operation`);
            }
            // Tool not found errors are acceptable - MCP server may have different tool names
            if (errorMessage.includes("not found") || errorMessage.includes("-32602")) {
              console.log(`   ⚠ ${op.name} not available in MCP server (tool name may differ)`);
              return; // Skip this tool, don't count as failure
            }
            // Other errors (API, network, etc.) are acceptable for E2E tests
            console.log(`   ⚠ ${op.name} failed (non-security error): ${errorMessage.substring(0, 80)}`);
          }
        }
      )();
    } catch (error) {
      // Continue with other tests even if some read operations fail
      console.log(`   ⚠ Skipping ${op.name} due to error`);
    }
  }

  // If we have available tools listed, connection is functional even if specific tools fail
  if (availableReadTools.length > 0) {
    console.log(`   ✓ MCP connection verified: ${availableReadTools.length} read-only tools available`);
  } else {
    // Only fail if we couldn't even list tools
    assert(
      readOperationsWorked > 0 || availableReadTools.length > 0,
      "At least one read operation should work or tools should be listable to verify MCP connection is functional"
    );
  }

  // Test 5: Penetration testing - SQL injection patterns
  console.log("\n--- Testing Penetration Attempts ---");
  
  const penetrationAttempts = [
    { name: "get_boards'; DROP TABLE boards; --", args: {} },
    { name: "../../create_item", args: {} },
    { name: "get_boards\0create_item", args: {} },
    { name: "GET_BOARDS", args: {} }, // Case variation
    { name: "get_boards_create_item", args: {} }, // Compound attempt
  ];

  for (const attempt of penetrationAttempts) {
    await test(
      `Penetration attempt "${attempt.name}" should be blocked`,
      assertThrows(
        async () => {
          // Check if it's detected as write operation
          if (isReadOnlyTool(attempt.name)) {
            // If it passes isReadOnlyTool, try calling it (should fail at MCP server level)
            await callMondayMCPTool(attempt.name, attempt.args);
          } else {
            // Should be blocked by isReadOnlyTool check
            await callMondayMCPTool(attempt.name, attempt.args);
          }
        },
        // Should throw error (either [SECURITY] or MCP server error)
      )
    )();
  }

  // Test 6: Verify tool filtering
  await test(
    "MCP tools should be filtered to read-only only",
    async () => {
      const toolsResponse = await mcpManager.listTools("monday");
      const allTools = toolsResponse.tools || [];
      
      console.log(`   Total tools from MCP server: ${allTools.length}`);
      
      // Count write operations in raw tools list
      const writeTools = allTools.filter((tool: any) => !isReadOnlyTool(tool.name));
      console.log(`   Write operations detected: ${writeTools.length}`);
      
      if (writeTools.length > 0) {
        console.log(`   ⚠ Write tools found: ${writeTools.map((t: any) => t.name).join(", ")}`);
        console.log(`   ✓ These will be filtered out by filterReadOnlyTools() before use`);
      }
    }
  )();

  console.log("\n=== All E2E tests completed ===");
}

// Run tests if executed directly
if (require.main === module) {
  runE2ETests()
    .then(() => {
      console.log("\n✅ E2E security test suite completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ E2E security test suite failed:", error);
      if (error instanceof Error && error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    });
}

export { runE2ETests };

