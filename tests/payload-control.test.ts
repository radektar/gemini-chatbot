/**
 * Tests for payload control (Monday.com and Slack)
 * Tests record/message limiting, field selection, and token estimation
 */

import {
  limitMondayRecords,
  selectMondayFields,
  processMondayPayload,
  shouldTriggerNarrowWarning,
  estimateMondayPayloadTokens,
} from "../lib/monday-payload-control";

import {
  limitSlackMessages,
  selectSlackFields,
  processSlackPayload,
  shouldTriggerNarrowWarning as shouldTriggerSlackNarrowWarning,
  estimateSlackPayloadTokens,
} from "../lib/slack-payload-control";

describe("Monday.com Payload Control", () => {
  describe("limitMondayRecords", () => {
    it("should return all items if within limit", () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = limitMondayRecords(items, { maxRecords: 30 });
      expect(result).toHaveLength(3);
      expect(result).toEqual(items);
    });

    it("should limit to maxRecords", () => {
      const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));
      const result = limitMondayRecords(items, { maxRecords: 30 });
      expect(result).toHaveLength(30);
      expect(result[0].id).toBe(0); // First item preserved
    });

    it("should use default maxRecords (30)", () => {
      const items = Array.from({ length: 50 }, (_, i) => ({ id: i }));
      const result = limitMondayRecords(items);
      expect(result).toHaveLength(30);
    });

    it("should handle empty array", () => {
      const result = limitMondayRecords([]);
      expect(result).toHaveLength(0);
    });
  });

  describe("selectMondayFields", () => {
    it("should select only specified fields", () => {
      const items = [
        { id: 1, name: "Item 1", status: "active", extra: "data" },
        { id: 2, name: "Item 2", status: "inactive", extra: "data" },
      ];
      const result = selectMondayFields(items, ["status"]);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        name: "Item 1",
        status: "active",
      });
      expect(result[0]).not.toHaveProperty("extra");
    });

    it("should always include id and name", () => {
      const items = [{ id: 1, name: "Item", other: "data" }];
      const result = selectMondayFields(items, []);
      
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name");
    });

    it("should handle empty fields array", () => {
      const items = [{ id: 1, name: "Item" }];
      const result = selectMondayFields(items, []);
      expect(result[0]).toEqual({ id: 1, name: "Item" });
    });
  });

  describe("processMondayPayload", () => {
    it("should process payload with all optimizations", () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        status: "active",
      }));
      
      const result = processMondayPayload(items, { maxRecords: 30 });
      
      expect(result.items).toHaveLength(30);
      expect(result.originalCount).toBe(100);
      expect(result.tokenEstimate).toBeGreaterThan(0);
      expect(result.shouldNarrow).toBe(true); // 100 > triggerNarrowAt (100)
    });

    it("should not trigger narrow warning for small payloads", () => {
      const items = Array.from({ length: 50 }, (_, i) => ({ id: i }));
      const result = processMondayPayload(items);
      
      expect(result.shouldNarrow).toBe(false);
    });
  });

  describe("shouldTriggerNarrowWarning", () => {
    it("should trigger at default threshold (100)", () => {
      expect(shouldTriggerNarrowWarning(101)).toBe(true);
      expect(shouldTriggerNarrowWarning(100)).toBe(false);
      expect(shouldTriggerNarrowWarning(99)).toBe(false);
    });

    it("should respect custom threshold", () => {
      expect(shouldTriggerNarrowWarning(50, { triggerNarrowAt: 40 })).toBe(true);
      expect(shouldTriggerNarrowWarning(30, { triggerNarrowAt: 40 })).toBe(false);
    });
  });

  describe("estimateMondayPayloadTokens", () => {
    it("should estimate tokens for payload", () => {
      const items = [{ id: 1, name: "test" }];
      const tokens = estimateMondayPayloadTokens(items);
      expect(tokens).toBeGreaterThan(0);
    });
  });
});

describe("Slack Payload Control", () => {
  describe("limitSlackMessages", () => {
    it("should return all messages if within limit", () => {
      const messages = [
        { ts: "1", text: "msg1" },
        { ts: "2", text: "msg2" },
      ];
      const result = limitSlackMessages(messages, { maxMessages: 15 });
      expect(result).toHaveLength(2);
    });

    it("should limit to maxMessages", () => {
      const messages = Array.from({ length: 50 }, (_, i) => ({
        ts: String(i),
        text: `msg${i}`,
      }));
      const result = limitSlackMessages(messages, { maxMessages: 15 });
      expect(result).toHaveLength(15);
    });

    it("should use default maxMessages (15)", () => {
      const messages = Array.from({ length: 30 }, (_, i) => ({
        ts: String(i),
        text: `msg${i}`,
      }));
      const result = limitSlackMessages(messages);
      expect(result).toHaveLength(15);
    });
  });

  describe("selectSlackFields", () => {
    it("should select only specified fields", () => {
      const messages = [
        { ts: "1", text: "msg1", user: "U1", extra: "data" },
        { ts: "2", text: "msg2", user: "U2", extra: "data" },
      ];
      const result = selectSlackFields(messages, ["user"]);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        ts: "1",
        text: "msg1",
        user: "U1",
      });
      expect(result[0]).not.toHaveProperty("extra");
    });

    it("should always include ts and text", () => {
      const messages = [{ ts: "1", text: "msg", other: "data" }];
      const result = selectSlackFields(messages, []);
      
      expect(result[0]).toHaveProperty("ts");
      expect(result[0]).toHaveProperty("text");
    });
  });

  describe("processSlackPayload", () => {
    it("should process payload with all optimizations", () => {
      const messages = Array.from({ length: 100 }, (_, i) => ({
        ts: String(i),
        text: `Message ${i}`,
      }));
      
      const result = processSlackPayload(messages, { maxMessages: 15 });
      
      expect(result.messages).toHaveLength(15);
      expect(result.originalCount).toBe(100);
      expect(result.tokenEstimate).toBeGreaterThan(0);
      expect(result.shouldNarrow).toBe(true); // 100 > triggerNarrowAt (50)
    });

    it("should not trigger narrow warning for small payloads", () => {
      const messages = Array.from({ length: 30 }, (_, i) => ({
        ts: String(i),
        text: `msg${i}`,
      }));
      const result = processSlackPayload(messages);
      
      expect(result.shouldNarrow).toBe(false);
    });
  });

  describe("shouldTriggerSlackNarrowWarning", () => {
    it("should trigger at default threshold (50)", () => {
      expect(shouldTriggerSlackNarrowWarning(51)).toBe(true);
      expect(shouldTriggerSlackNarrowWarning(50)).toBe(false);
      expect(shouldTriggerSlackNarrowWarning(49)).toBe(false);
    });
  });

  describe("estimateSlackPayloadTokens", () => {
    it("should estimate tokens for messages", () => {
      const messages = [{ ts: "1", text: "test message" }];
      const tokens = estimateSlackPayloadTokens(messages);
      expect(tokens).toBeGreaterThan(0);
    });
  });
});

