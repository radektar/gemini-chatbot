#!/usr/bin/env tsx
/**
 * Manual test script for Monday.com MCP security
 * Run with: npx tsx scripts/test-monday-security.ts
 * 
 * This script provides a quick way to test security blocks without
 * requiring a full test framework setup.
 */

import {
  isReadOnlyTool,
  filterReadOnlyTools,
  READ_ONLY_MONDAY_TOOLS,
  WRITE_OPERATIONS_BLACKLIST,
} from "@/integrations/mcp/monday-readonly";
import { callMondayMCPTool } from "@/integrations/mcp/init";

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log("\n" + "=".repeat(60));
  log(title, "cyan");
  console.log("=".repeat(60));
}

function logTest(name: string, passed: boolean, details?: string) {
  const status = passed ? "✅ PASS" : "❌ FAIL";
  const color = passed ? "green" : "red";
  log(`${status}: ${name}`, color);
  if (details) {
    console.log(`   ${details}`);
  }
}

// Test 1: Unit tests for isReadOnlyTool
function testIsReadOnlyTool() {
  logSection("Test 1: isReadOnlyTool() - Read Operations");

  const readOnlyTests = [
    "get_boards",
    "get_board",
    "get_items",
    "get_item",
    "list_items",
    "list_boards",
    "get_users",
    "get_workspaces",
    "get_teams",
    "get_tags",
    "get_webhooks",
    "get_activity_logs",
    "get_me",
    "search",
    "query",
    "read",
    "fetch",
    "retrieve",
  ];

  let passed = 0;
  let failed = 0;

  for (const tool of readOnlyTests) {
    const result = isReadOnlyTool(tool);
    if (result) {
      passed++;
      logTest(`isReadOnlyTool("${tool}")`, true);
    } else {
      failed++;
      logTest(`isReadOnlyTool("${tool}")`, false, "Expected true, got false");
    }
  }

  log(`\nResults: ${passed} passed, ${failed} failed`, failed > 0 ? "red" : "green");
  return failed === 0;
}

// Test 2: Unit tests for write operations blocking
function testWriteOperationsBlocking() {
  logSection("Test 2: isReadOnlyTool() - Write Operations (Should Block)");

  const writeTests = [
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

  let passed = 0;
  let failed = 0;

  for (const tool of writeTests) {
    const result = isReadOnlyTool(tool);
    if (!result) {
      passed++;
      logTest(`isReadOnlyTool("${tool}")`, true, "Correctly blocked");
    } else {
      failed++;
      logTest(`isReadOnlyTool("${tool}")`, false, "SECURITY RISK: Write operation was allowed!");
    }
  }

  log(`\nResults: ${passed} passed, ${failed} failed`, failed > 0 ? "red" : "green");
  return failed === 0;
}

// Test 3: Test filterReadOnlyTools
function testFilterReadOnlyTools() {
  logSection("Test 3: filterReadOnlyTools()");

  const mockTools = [
    { name: "get_boards", description: "Get boards", inputSchema: {} },
    { name: "get_items", description: "Get items", inputSchema: {} },
    { name: "create_item", description: "Create item", inputSchema: {} },
    { name: "update_item", description: "Update item", inputSchema: {} },
    { name: "delete_item", description: "Delete item", inputSchema: {} },
    { name: "list_boards", description: "List boards", inputSchema: {} },
  ];

  const filtered = filterReadOnlyTools(mockTools);

  const expectedReadOnly = ["get_boards", "get_items", "list_boards"];
  const expectedBlocked = ["create_item", "update_item", "delete_item"];

  let passed = true;

  if (filtered.length !== expectedReadOnly.length) {
    logTest(
      "filterReadOnlyTools length",
      false,
      `Expected ${expectedReadOnly.length} tools, got ${filtered.length}`
    );
    passed = false;
  } else {
    logTest("filterReadOnlyTools length", true, `Filtered to ${filtered.length} read-only tools`);
  }

  for (const tool of expectedReadOnly) {
    if (!filtered.some((t) => t.name === tool)) {
      logTest(`Tool "${tool}" should be included`, false);
      passed = false;
    } else {
      logTest(`Tool "${tool}" included`, true);
    }
  }

  for (const tool of expectedBlocked) {
    if (filtered.some((t) => t.name === tool)) {
      logTest(`Tool "${tool}" should be blocked`, false, "SECURITY RISK: Write operation passed filter!");
      passed = false;
    } else {
      logTest(`Tool "${tool}" blocked`, true);
    }
  }

  return passed;
}

// Test 4: Integration test - callMondayMCPTool security
async function testCallMondayMCPToolSecurity() {
  logSection("Test 4: callMondayMCPTool() - Security Blocking");

  const writeOperations = [
    { name: "create_item", args: { board_id: 123, item_name: "Test" } },
    { name: "update_item", args: { item_id: 456, column_values: {} } },
    { name: "delete_item", args: { item_id: 789 } },
    { name: "create_board", args: { board_name: "Test Board" } },
    { name: "archive_board", args: { board_id: 123 } },
  ];

  let passed = 0;
  let failed = 0;

  for (const op of writeOperations) {
    try {
      await callMondayMCPTool(op.name, op.args);
      failed++;
      logTest(
        `callMondayMCPTool("${op.name}")`,
        false,
        "SECURITY RISK: Write operation was not blocked!"
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("[SECURITY]")) {
        passed++;
        logTest(`callMondayMCPTool("${op.name}")`, true, "Correctly blocked with [SECURITY] error");
      } else {
        failed++;
        logTest(
          `callMondayMCPTool("${op.name}")`,
          false,
          `Blocked but error doesn't contain [SECURITY]: ${errorMessage}`
        );
      }
    }
  }

  log(`\nResults: ${passed} passed, ${failed} failed`, failed > 0 ? "red" : "green");
  return failed === 0;
}

// Test 5: Summary statistics
function testSummary() {
  logSection("Test 5: Configuration Summary");

  log(`Whitelist (READ_ONLY_MONDAY_TOOLS): ${READ_ONLY_MONDAY_TOOLS.length} tools`, "blue");
  log(`Blacklist (WRITE_OPERATIONS_BLACKLIST): ${WRITE_OPERATIONS_BLACKLIST.length} keywords`, "blue");

  log("\nWhitelisted tools:", "yellow");
  READ_ONLY_MONDAY_TOOLS.forEach((tool, idx) => {
    console.log(`  ${idx + 1}. ${tool}`);
  });

  log("\nBlacklisted keywords:", "yellow");
  WRITE_OPERATIONS_BLACKLIST.forEach((keyword, idx) => {
    console.log(`  ${idx + 1}. ${keyword}`);
  });

  return true;
}

// Main test runner
async function runAllTests() {
  log("\n" + "=".repeat(60), "cyan");
  log("Monday.com MCP Security Test Suite", "cyan");
  log("=".repeat(60) + "\n", "cyan");

  const results: Array<{ name: string; passed: boolean }> = [];

  // Run tests
  results.push({ name: "Read Operations", passed: testIsReadOnlyTool() });
  results.push({ name: "Write Operations Blocking", passed: testWriteOperationsBlocking() });
  results.push({ name: "Filter Read-Only Tools", passed: testFilterReadOnlyTools() });
  results.push({
    name: "callMondayMCPTool Security",
    passed: await testCallMondayMCPToolSecurity(),
  });
  results.push({ name: "Configuration Summary", passed: testSummary() });

  // Final summary
  logSection("Final Summary");

  const totalPassed = results.filter((r) => r.passed).length;
  const totalFailed = results.filter((r) => !r.passed).length;

  results.forEach((result) => {
    logTest(result.name, result.passed);
  });

  console.log("\n");
  log(`Total: ${results.length} test suites`, "blue");
  log(`Passed: ${totalPassed}`, "green");
  log(`Failed: ${totalFailed}`, totalFailed > 0 ? "red" : "green");

  if (totalFailed === 0) {
    log("\n🎉 All security tests passed! Monday.com MCP is properly configured for read-only access.", "green");
    process.exit(0);
  } else {
    log("\n⚠️  Some security tests failed! Review the results above.", "red");
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllTests().catch((error) => {
    log(`\n❌ Test suite crashed: ${error}`, "red");
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

export { runAllTests };






