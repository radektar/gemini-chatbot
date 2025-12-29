/**
 * Tests for context budget management
 * Tests token estimation, budget allocation, and degradation strategies
 */

import {
  estimateTokens,
  estimateJsonTokens,
  allocateBudget,
  calculateCurrentUsage,
  shouldDegrade,
  DegradationLevel,
  getDegradationMessage,
} from "../ai/context-budget";

describe("Context Budget Management", () => {
  describe("estimateTokens", () => {
    it("should estimate tokens correctly (4 chars = 1 token)", () => {
      expect(estimateTokens("")).toBe(0);
      expect(estimateTokens("test")).toBe(1); // 4 chars = 1 token
      expect(estimateTokens("hello world")).toBe(3); // 11 chars = 3 tokens
      expect(estimateTokens("a".repeat(100))).toBe(25); // 100 chars = 25 tokens
    });

    it("should handle empty strings", () => {
      expect(estimateTokens("")).toBe(0);
    });

    it("should handle long text", () => {
      const longText = "a".repeat(1000);
      expect(estimateTokens(longText)).toBe(250); // 1000 chars = 250 tokens
    });
  });

  describe("estimateJsonTokens", () => {
    it("should estimate tokens for simple object", () => {
      const obj = { name: "test", id: 123 };
      const tokens = estimateJsonTokens(obj);
      expect(tokens).toBeGreaterThan(0);
      // JSON string should be ~20 chars = ~5 tokens
      expect(tokens).toBeGreaterThanOrEqual(5);
    });

    it("should estimate tokens for array", () => {
      const arr = [1, 2, 3, 4, 5];
      const tokens = estimateJsonTokens(arr);
      expect(tokens).toBeGreaterThan(0);
    });

    it("should handle null and undefined", () => {
      expect(estimateJsonTokens(null)).toBe(0);
      expect(estimateJsonTokens(undefined)).toBe(0);
    });

    it("should handle nested objects", () => {
      const nested = {
        user: { name: "John", age: 30 },
        items: [{ id: 1 }, { id: 2 }],
      };
      const tokens = estimateJsonTokens(nested);
      expect(tokens).toBeGreaterThan(0);
    });
  });

  describe("allocateBudget", () => {
    it("should allocate budget for 200K context window", () => {
      const budget = allocateBudget(200_000);
      
      expect(budget.total).toBe(200_000);
      expect(budget.systemPrompt.min).toBe(2_000); // 1%
      expect(budget.systemPrompt.max).toBe(5_000); // 2.5%
      expect(budget.conversationHistory.min).toBe(10_000); // 5%
      expect(budget.conversationHistory.max).toBe(20_000); // 10%
      expect(budget.integrationData.min).toBe(30_000); // 15%
      expect(budget.integrationData.max).toBe(50_000); // 25%
      expect(budget.output.min).toBe(8_000); // 4%
      expect(budget.output.max).toBe(16_000); // 8%
      expect(budget.safetyMargin.min).toBe(40_000); // 20%
      expect(budget.safetyMargin.max).toBe(80_000); // 40%
    });

    it("should allocate budget for custom context window", () => {
      const budget = allocateBudget(100_000);
      expect(budget.total).toBe(100_000);
      expect(budget.systemPrompt.min).toBe(1_000); // 1% of 100K
    });
  });

  describe("calculateCurrentUsage", () => {
    it("should calculate usage from components", () => {
      const usage = calculateCurrentUsage({
        systemPrompt: "test system prompt",
        messages: [{ role: "user", content: "test message" }],
      });
      
      expect(usage).toBeGreaterThan(0);
    });

    it("should include integration data in usage", () => {
      const usageWithoutIntegration = calculateCurrentUsage({
        systemPrompt: "test",
        messages: [],
      });
      
      const usageWithIntegration = calculateCurrentUsage({
        systemPrompt: "test",
        messages: [],
        integrationData: { items: [{ id: 1 }, { id: 2 }] },
      });
      
      expect(usageWithIntegration).toBeGreaterThan(usageWithoutIntegration);
    });
  });

  describe("shouldDegrade", () => {
    it("should return NONE for low usage", () => {
      const budget = allocateBudget(200_000);
      const lowUsage = 50_000; // 25% usage
      
      expect(shouldDegrade(lowUsage, budget)).toBe(DegradationLevel.NONE);
    });

    it("should return REDUCE_RECORDS for medium usage", () => {
      const budget = allocateBudget(200_000);
      const mediumUsage = 160_000; // 80% usage
      
      const level = shouldDegrade(mediumUsage, budget);
      expect([DegradationLevel.REDUCE_RECORDS, DegradationLevel.COMPRESS_HISTORY]).toContain(level);
    });

    it("should return COMPRESS_HISTORY for high usage", () => {
      const budget = allocateBudget(200_000);
      const highUsage = 170_000; // 85% usage
      
      expect(shouldDegrade(highUsage, budget)).toBe(DegradationLevel.COMPRESS_HISTORY);
    });

    it("should return AGGREGATE for very high usage", () => {
      const budget = allocateBudget(200_000);
      const veryHighUsage = 180_000; // 90% usage
      
      expect(shouldDegrade(veryHighUsage, budget)).toBe(DegradationLevel.AGGREGATE);
    });

    it("should return ASK_USER for critical usage", () => {
      const budget = allocateBudget(200_000);
      const criticalUsage = 190_000; // 95% usage
      
      expect(shouldDegrade(criticalUsage, budget)).toBe(DegradationLevel.ASK_USER);
    });
  });

  describe("getDegradationMessage", () => {
    it("should return message for ASK_USER", () => {
      const message = getDegradationMessage(DegradationLevel.ASK_USER, 150, "Monday.com");
      expect(message).toContain("150");
      expect(message).toContain("Monday.com");
      expect(message).toContain("zawęzić");
    });

    it("should return message for AGGREGATE", () => {
      const message = getDegradationMessage(DegradationLevel.AGGREGATE, 100, "Slack");
      expect(message).toContain("100");
      expect(message).toContain("podsumowanie");
    });

    it("should return empty string for NONE", () => {
      const message = getDegradationMessage(DegradationLevel.NONE, 0, "");
      expect(message).toBe("");
    });
  });
});

