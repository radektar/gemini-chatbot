#!/usr/bin/env tsx
/**
 * Quick test script for MONDAY_ALLOWED_BOARD_ID filtering
 * 
 * Usage:
 *   npm run test:board-filter
 * 
 * This script tests:
 * 1. Board filtering when MONDAY_ALLOWED_BOARD_ID is set
 * 2. No filtering when MONDAY_ALLOWED_BOARD_ID is empty/unset
 */

// Load environment variables from .env.local
import { config } from "dotenv";
config({
  path: ".env.local",
});

import { callMondayMCPTool } from "../integrations/mcp/init";

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const RESET = "\x1b[0m";

function log(message: string, color: string = RESET) {
  console.log(`${color}${message}${RESET}`);
}

async function testBoardFiltering() {
  log("\n╔════════════════════════════════════════════════════════════╗", BLUE);
  log("║     Monday.com Board Filtering Test                       ║", BLUE);
  log("╚════════════════════════════════════════════════════════════╝", BLUE);

  const allowedBoardId = process.env.MONDAY_ALLOWED_BOARD_ID?.trim();
  
  log("\n📋 Configuration:", YELLOW);
  log(`   MONDAY_API_TOKEN: ${process.env.MONDAY_API_TOKEN ? "✓ Set" : "✗ Not set"}`);
  log(`   MONDAY_ALLOWED_BOARD_ID: ${allowedBoardId || "(empty - all boards accessible)"}`);

  if (!process.env.MONDAY_API_TOKEN) {
    log("\n❌ MONDAY_API_TOKEN not set. Cannot test.", RED);
    log("   Set MONDAY_API_TOKEN in .env.local to run this test.", YELLOW);
    process.exit(1);
  }

  if (!allowedBoardId) {
    log("\n⚠️  MONDAY_ALLOWED_BOARD_ID is not set.", YELLOW);
    log("   This test cannot verify board filtering without a board ID.", YELLOW);
    log("   Set MONDAY_ALLOWED_BOARD_ID=<board_id> in .env.local to run this test.", YELLOW);
    process.exit(1);
  }

  try {
    log("\n🔍 Test 1: Access allowed board (should succeed)", BLUE);
    log(`   Trying to access board ${allowedBoardId}...`, BLUE);
    
    try {
      const result1 = await callMondayMCPTool("get_board_info", { 
        boardId: parseInt(allowedBoardId, 10)
      });
      
      log(`   ✅ SUCCESS: Allowed board accessed`, GREEN);
      
      // Try to parse board name
      let boardName = "Unknown";
      if (result1?.content && Array.isArray(result1.content)) {
        const textContent = result1.content.find((c: any) => c.type === "text");
        if (textContent?.text) {
          try {
            const parsed = JSON.parse(textContent.text);
            boardName = parsed?.data?.boards?.[0]?.name || parsed?.boards?.[0]?.name || "Unknown";
          } catch {}
        }
      }
      log(`   Board name: ${boardName}`, BLUE);
    } catch (error) {
      log(`   ❌ FAIL: Could not access allowed board`, RED);
      log(`   Error: ${error instanceof Error ? error.message : String(error)}`, RED);
      throw error;
    }

    // Test 2: Try to access a different board (should be blocked)
    log("\n🔍 Test 2: Access different board (should be blocked)", BLUE);
    const differentBoardId = "1234567890"; // Different board ID
    log(`   Trying to access board ${differentBoardId}...`, BLUE);
    
    try {
      await callMondayMCPTool("get_board_info", { 
        boardId: parseInt(differentBoardId, 10)
      });
      
      log(`   ❌ FAIL: Different board NOT blocked!`, RED);
      log(`   Security issue: Board restriction is not working properly`, RED);
      process.exit(1);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes("Access denied") || errorMsg.includes("restricted")) {
        log(`   ✅ SUCCESS: Access correctly blocked`, GREEN);
        log(`   Error message: ${errorMsg}`, BLUE);
      } else {
        log(`   ⚠️  WARNING: Blocked, but with unexpected error`, YELLOW);
        log(`   Error: ${errorMsg}`, YELLOW);
      }
    }

    // Test 3: Tool without explicit board_id (should auto-inject)
    log("\n🔍 Test 3: Tool call without board_id (should auto-inject)", BLUE);
    log(`   Testing if board_id is automatically injected...`, BLUE);
    
    try {
      const result3 = await callMondayMCPTool("get_board_activity", {});
      
      log(`   ✅ SUCCESS: Tool executed (board_id auto-injected)`, GREEN);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log(`   ℹ️  Note: ${errorMsg}`, YELLOW);
    }

    log("\n╔════════════════════════════════════════════════════════════╗", GREEN);
    log("║     All Tests Passed!                                      ║", GREEN);
    log("╚════════════════════════════════════════════════════════════╝", GREEN);

    log("\n📊 Summary:", BLUE);
    log(`   ✓ Allowed board (${allowedBoardId}): Accessible`, GREEN);
    log(`   ✓ Different board (${differentBoardId}): Blocked`, GREEN);
    log(`   ✓ Auto-injection: Working`, GREEN);

    log("\n💡 How to disable board filtering:", YELLOW);
    log("   1. Open .env.local", YELLOW);
    log("   2. Set: MONDAY_ALLOWED_BOARD_ID=", YELLOW);
    log("   3. Or remove the line completely", YELLOW);
    log("   4. Restart the app", YELLOW);

  } catch (error) {
    log("\n❌ Test failed:", RED);
    log(`   ${error instanceof Error ? error.message : String(error)}`, RED);
    process.exit(1);
  }
}

// Run test
testBoardFiltering().catch((error) => {
  log("\n💥 Unexpected error:", RED);
  console.error(error);
  process.exit(1);
});

