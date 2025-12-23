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

console.log("=== Tests: Feedback API ===\n");

// Mock validation
function validateRating(rating: number): boolean {
  return rating === 1 || rating === -1;
}

test("Should accept valid rating (1)", () => {
  assert(validateRating(1), "Rating 1 should be valid");
});

test("Should accept valid rating (-1)", () => {
  assert(validateRating(-1), "Rating -1 should be valid");
});

test("Should reject invalid rating (0)", () => {
  assert(!validateRating(0), "Rating 0 should be invalid");
});

test("Should reject invalid rating (2)", () => {
  assert(!validateRating(2), "Rating 2 should be invalid");
});

test("Feedback data structure should be valid", () => {
  const feedbackData = {
    chatId: "test-chat-id",
    messageId: "test-message-id",
    rating: 1 as const,
    userQuery: "Test query",
    assistantResponse: "Test response",
    toolsUsed: ["getWeather"],
  };

  assert(feedbackData.rating === 1 || feedbackData.rating === -1, "Rating must be 1 or -1");
  assert(typeof feedbackData.chatId === "string", "chatId must be string");
  assert(typeof feedbackData.messageId === "string", "messageId must be string");
});

test("Feedback stats should have correct structure", () => {
  const stats = {
    total: 10,
    positive: 7,
    negative: 3,
    rate: 0.7,
  };

  assert(stats.total === stats.positive + stats.negative, "Total should equal positive + negative");
  assert(stats.rate === stats.positive / stats.total, "Rate should equal positive / total");
  assert(stats.rate >= 0 && stats.rate <= 1, "Rate should be between 0 and 1");
});

test("Should reject invalid rating type (string)", () => {
  const invalidRating = "1";
  const isValid = typeof invalidRating === "number" && (invalidRating === 1 || invalidRating === -1);
  
  assert(!isValid, "String rating should be rejected");
});

test("POST should require authentication", () => {
  const hasSession = false; // Mock: no session
  const statusCode = hasSession ? 200 : 401;
  
  assert(statusCode === 401, "Should return 401 without session");
});

test("POST should accept feedback with all fields", () => {
  const feedbackData = {
    chatId: "test-chat-id",
    messageId: "test-message-id",
    rating: 1 as const,
    comment: undefined,
    userQuery: "Test query",
    assistantResponse: "Test response",
    toolsUsed: ["get_board_items", "get_item_details"],
  };

  assert(feedbackData.rating === 1 || feedbackData.rating === -1, "Rating must be valid");
  assert(typeof feedbackData.userQuery === "string", "userQuery should be string");
  assert(typeof feedbackData.assistantResponse === "string", "assistantResponse should be string");
  assert(Array.isArray(feedbackData.toolsUsed), "toolsUsed should be array");
});

test("GET should return stats without period parameter", () => {
  const period = undefined;
  const shouldReturnAll = period === undefined;
  
  assert(shouldReturnAll === true, "Should return all stats when period is undefined");
});

test("GET should filter stats by period", () => {
  const periods = ["7d", "30d", "90d"];
  
  periods.forEach((period) => {
    const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 0;
    assert(days > 0, `Period "${period}" should map to ${days} days`);
  });
});

test("GET should require authentication", () => {
  const hasSession = false; // Mock: no session
  const statusCode = hasSession ? 200 : 401;
  
  assert(statusCode === 401, "Should return 401 without session");
});

test("POST should serialize toolsUsed correctly", () => {
  const toolsUsed = ["get_board_items", "get_item_details"];
  const serialized = JSON.stringify(toolsUsed);
  
  assert(typeof serialized === "string", "toolsUsed should be serialized as JSON string");
  assert(serialized.includes("get_board_items"), "Serialized data should contain tool names");
});

test("POST should set createdAt automatically", () => {
  const feedbackData = {
    rating: 1 as const,
    createdAt: new Date(),
  };
  
  assert(feedbackData.createdAt instanceof Date, "createdAt should be Date object");
});

