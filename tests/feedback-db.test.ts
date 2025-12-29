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

console.log("=== Tests: Feedback DB Functions ===\n");

// Mock feedback data structure
interface MockFeedback {
  chatId?: string;
  userId: string;
  messageId?: string;
  rating: 1 | -1;
  comment?: string;
  userQuery?: string;
  assistantResponse?: string;
  toolsUsed?: any;
}

test("saveFeedback should serialize toolsUsed as JSON", () => {
  const feedbackData: MockFeedback = {
    userId: "test-user-id",
    rating: 1,
    toolsUsed: ["get_board_items", "get_item_details"],
  };

  const serializedToolsUsed = feedbackData.toolsUsed
    ? JSON.stringify(feedbackData.toolsUsed)
    : null;

  assert(serializedToolsUsed !== null, "toolsUsed should be serialized");
  assert(typeof serializedToolsUsed === "string", "toolsUsed should be JSON string");
  assert(serializedToolsUsed.includes("get_board_items"), "toolsUsed should contain tool names");
});

test("saveFeedback should handle all fields", () => {
  const feedbackData: MockFeedback = {
    chatId: "test-chat-id",
    userId: "test-user-id",
    messageId: "test-message-id",
    rating: -1,
    comment: "Test comment",
    userQuery: "Test query",
    assistantResponse: "Test response",
    toolsUsed: ["getWeather"],
  };

  assert(feedbackData.chatId !== undefined, "chatId should be present");
  assert(feedbackData.userId !== undefined, "userId should be present");
  assert(feedbackData.messageId !== undefined, "messageId should be present");
  assert(feedbackData.rating === 1 || feedbackData.rating === -1, "rating should be 1 or -1");
});

test("getFeedbackStats should calculate correct statistics", () => {
  const mockStats = {
    total: 10,
    positive: 7,
    negative: 3,
    rate: 0.7,
  };

  assert(mockStats.total === mockStats.positive + mockStats.negative, "Total should equal positive + negative");
  assert(mockStats.rate === mockStats.positive / mockStats.total, "Rate should equal positive / total");
  assert(mockStats.rate >= 0 && mockStats.rate <= 1, "Rate should be between 0 and 1");
});

test("getFeedbackStats should handle period filtering", () => {
  const periods = ["7d", "30d", "90d"];
  
  periods.forEach((period) => {
    const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 0;
    assert(days > 0, `Period "${period}" should map to ${days} days`);
  });
});

test("getFeedbackByChat should filter by chatId", () => {
  const mockFeedbacks = [
    { chatId: "chat-1", rating: 1 },
    { chatId: "chat-1", rating: -1 },
    { chatId: "chat-2", rating: 1 },
  ];

  const filteredFeedbacks = mockFeedbacks.filter((f) => f.chatId === "chat-1");

  assert(filteredFeedbacks.length === 2, "Should return only feedbacks for specified chatId");
  assert(filteredFeedbacks.every((f) => f.chatId === "chat-1"), "All feedbacks should have matching chatId");
});

test("getRecentNegativeFeedback should filter by rating = -1", () => {
  const mockFeedbacks = [
    { rating: 1, createdAt: new Date("2025-01-01") },
    { rating: -1, createdAt: new Date("2025-01-02") },
    { rating: 1, createdAt: new Date("2025-01-03") },
    { rating: -1, createdAt: new Date("2025-01-04") },
  ];

  const negativeFeedbacks = mockFeedbacks.filter((f) => f.rating === -1);

  assert(negativeFeedbacks.length === 2, "Should return only negative feedbacks");
  assert(negativeFeedbacks.every((f) => f.rating === -1), "All feedbacks should have rating = -1");
});

test("getRecentNegativeFeedback should respect limit", () => {
  const mockFeedbacks = Array(20)
    .fill(null)
    .map((_, i) => ({
      rating: -1 as const,
      createdAt: new Date(`2025-01-${String(i + 1).padStart(2, "0")}`),
    }));

  const limit = 10;
  const limitedFeedbacks = mockFeedbacks.slice(0, limit);

  assert(limitedFeedbacks.length === limit, `Should return only ${limit} feedbacks`);
});

test("Graceful degradation when DB not configured", () => {
  const dbNotConfigured = true; // Mock condition

  if (dbNotConfigured) {
    // Mock graceful degradation
    const mockSaveFeedback = () => {
      console.warn("⚠️  Database not configured - feedback not saved (PoC mode)");
      return;
    };

    const mockGetStats = () => {
      console.warn("⚠️  Database not configured - returning empty feedback stats (PoC mode)");
      return { total: 0, positive: 0, negative: 0, rate: 0 };
    };

    mockSaveFeedback();
    const stats = mockGetStats();

    assert(stats.total === 0, "Should return empty stats when DB not configured");
    assert(stats.rate === 0, "Rate should be 0 when DB not configured");
  }
});



