/**
 * Tests for Slack read-only mode
 * Tests explicit whitelist/blacklist, fail-safe behavior, and channel access validation
 */

import {
  validateSlackOperation,
  validateChannelAccess,
  SlackReadOnlyError,
  SlackAccessDeniedError,
  SLACK_READ_ONLY_OPERATIONS,
  SLACK_WRITE_OPERATIONS,
} from "@/lib/slack-readonly";

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

console.log("=== Tests: Slack Read-Only Security ===\n");

// Test 1: Explicit read operations allowed
test("Explicit read operations should be allowed", () => {
  const readOps = [
    "conversations.list",
    "conversations.history",
    "conversations.info",
    "conversations.members",
    "users.list",
    "users.info",
    "users.conversations",
    "channels.list",
    "channels.history",
    "channels.info",
    "search.messages",
    "files.info",
    "files.list",
    "reactions.get",
    "pins.list",
  ];

  readOps.forEach((op) => {
    try {
      validateSlackOperation(op);
    } catch (error) {
      throw new Error(`validateSlackOperation should not throw for ${op}: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
});

// Test 2: Explicit write operations blocked
test("Explicit write operations should be blocked", () => {
  const writeOps = [
    "chat.postMessage",
    "chat.update",
    "chat.delete",
    "files.upload",
    "files.delete",
    "channels.create",
    "channels.archive",
    "channels.join",
    "channels.leave",
    "conversations.create",
    "conversations.archive",
    "conversations.invite",
    "users.admin.invite",
    "pins.add",
    "pins.remove",
    "reactions.add",
    "reactions.remove",
  ];

  writeOps.forEach((op) => {
    try {
      validateSlackOperation(op);
      throw new Error(`Expected ${op} to be blocked`);
    } catch (error) {
      assert(
        error instanceof SlackReadOnlyError,
        `Expected SlackReadOnlyError for ${op}, got ${error instanceof Error ? error.constructor.name : typeof error}`
      );
    }
  });
});

// Test 3: Unknown operations blocked (fail-safe)
test("Unknown operations should be blocked (fail-safe)", () => {
  const unknownOps = [
    "unknown.operation",
    "suspicious.method",
    "random.api.call",
    "something.weird",
  ];

  unknownOps.forEach((op) => {
    try {
      validateSlackOperation(op);
      throw new Error(`Expected ${op} to be blocked by fail-safe`);
    } catch (error) {
      assert(
        error instanceof SlackReadOnlyError,
        `Expected SlackReadOnlyError for ${op}, got ${error instanceof Error ? error.constructor.name : typeof error}`
      );
    }
  });
});

// Test 4: Write keywords detected (fuzzy matching)
test("Operations with write keywords should be blocked", () => {
  const operationsWithWriteKeywords = [
    "something.post",
    "data.create",
    "item.update",
    "resource.delete",
    "channel.archive",
    "user.invite",
    "file.upload",
    "message.send",
  ];

  operationsWithWriteKeywords.forEach((op) => {
    try {
      validateSlackOperation(op);
      throw new Error(`Expected ${op} to be blocked (contains write keyword)`);
    } catch (error) {
      assert(
        error instanceof SlackReadOnlyError,
        `Expected SlackReadOnlyError for ${op}, got ${error instanceof Error ? error.constructor.name : typeof error}`
      );
    }
  });
});

// Test 5: Channel access validation
test("Public channels should be allowed", () => {
  // Test without whitelist (all public channels allowed)
  try {
    validateChannelAccess("C01234567", "public_channel");
  } catch (error) {
    throw new Error(`Public channel should be allowed: ${error instanceof Error ? error.message : String(error)}`);
  }
});

test("Private channels should be blocked", () => {
  try {
    validateChannelAccess("G01234567", "private_channel");
    throw new Error("Expected private channel to be blocked");
  } catch (error) {
    assert(
      error instanceof SlackAccessDeniedError,
      `Expected SlackAccessDeniedError, got ${error instanceof Error ? error.constructor.name : typeof error}`
    );
  }
});

test("Direct messages (im) should be blocked", () => {
  try {
    validateChannelAccess("D01234567", "im");
    throw new Error("Expected DM to be blocked");
  } catch (error) {
    assert(
      error instanceof SlackAccessDeniedError,
      `Expected SlackAccessDeniedError, got ${error instanceof Error ? error.constructor.name : typeof error}`
    );
  }
});

test("Group messages (mpim) should be blocked", () => {
  try {
    validateChannelAccess("G01234567", "mpim");
    throw new Error("Expected group message to be blocked");
  } catch (error) {
    assert(
      error instanceof SlackAccessDeniedError,
      `Expected SlackAccessDeniedError, got ${error instanceof Error ? error.constructor.name : typeof error}`
    );
  }
});

// Test 6: Case insensitivity
test("Case insensitivity should work correctly", () => {
  // Uppercase read operation should be allowed
  try {
    validateSlackOperation("CONVERSATIONS.LIST");
  } catch (error) {
    throw new Error(`Uppercase read operation should be allowed: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Uppercase write operation should be blocked
  try {
    validateSlackOperation("CHAT.POSTMESSAGE");
    throw new Error("Expected uppercase write operation to be blocked");
  } catch (error) {
    assert(
      error instanceof SlackReadOnlyError,
      `Expected SlackReadOnlyError for uppercase write operation`
    );
  }
});

// Test 7: Read patterns allowed
test("Operations with read patterns should be allowed", () => {
  const readPatternOps = [
    "get_something",
    "list_items",
    "read_data",
    "search_messages",
    "fetch_info",
    "query_channels",
    "info_about",
    "history_of",
  ];

  readPatternOps.forEach((op) => {
    try {
      validateSlackOperation(op);
    } catch (error) {
      throw new Error(`Operation with read pattern should be allowed: ${op} - ${error instanceof Error ? error.message : String(error)}`);
    }
  });
});

// Test 8: Whitelist/blacklist consistency
test("Whitelist and blacklist should not overlap", () => {
  const whitelistArray = Array.from(SLACK_READ_ONLY_OPERATIONS);
  const blacklistArray = Array.from(SLACK_WRITE_OPERATIONS);
  
  const overlap = whitelistArray.filter((op) => blacklistArray.includes(op));
  
  assert(
    overlap.length === 0,
    `Whitelist and blacklist overlap: ${overlap.join(", ")}`
  );
});

console.log("\n✅ All Slack read-only security tests completed!");


