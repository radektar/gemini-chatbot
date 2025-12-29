/**
 * Slack Payload Control
 * 
 * Controls payload size for Slack integration to prevent context overflow.
 * Based on research from PH06_CONTEXT_RESEARCH.md:
 * - Default: 15 messages
 * - Maximum: 25 messages
 * - Trigger "narrow" at: >50 results
 * - Average token per message: 100-300 tokens
 */

import { estimateJsonTokens } from "@/ai/context-budget";

export interface SlackPayloadConfig {
  maxMessages: number;        // Default: 15, Max: 25
  triggerNarrowAt: number;    // Default: 50
  selectFields?: string[];    // Optional: only these fields
  compactJson: boolean;       // Remove whitespace
}

const DEFAULT_CONFIG: SlackPayloadConfig = {
  maxMessages: 15,
  triggerNarrowAt: 50,
  compactJson: true,
};

/**
 * Limit number of Slack messages
 * Returns first N messages (most recent should be first)
 */
export function limitSlackMessages<T extends Record<string, any>>(
  messages: T[],
  config: Partial<SlackPayloadConfig> = {}
): T[] {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  if (!messages || messages.length === 0) {
    return [];
  }
  
  // If within limit, return all
  if (messages.length <= finalConfig.maxMessages) {
    return messages;
  }
  
  // Return first N messages (assumes they're sorted by timestamp, newest first)
  return messages.slice(0, finalConfig.maxMessages);
}

/**
 * Select only specified fields from Slack messages
 * Reduces token count by removing unnecessary metadata
 */
export function selectSlackFields<T extends Record<string, any>>(
  messages: T[],
  fields: string[]
): T[] {
  if (!messages || messages.length === 0 || !fields || fields.length === 0) {
    return messages;
  }
  
  return messages.map(message => {
    const filtered: Record<string, any> = {};
    
    // Always include ts and text (essential)
    if (message.ts !== undefined) filtered.ts = message.ts;
    if (message.text !== undefined) filtered.text = message.text;
    
    // Include requested fields
    for (const field of fields) {
      if (message[field] !== undefined) {
        filtered[field] = message[field];
      }
    }
    
    return filtered as T;
  });
}

/**
 * Compact JSON payload (remove whitespace)
 * Saves ~50% tokens vs pretty-printed JSON
 */
export function compactSlackPayload(data: any): string {
  return JSON.stringify(data);
}

/**
 * Estimate token count for Slack payload
 */
export function estimateSlackPayloadTokens(messages: any[]): number {
  return estimateJsonTokens(messages);
}

/**
 * Check if payload should trigger "narrow scope" warning
 */
export function shouldTriggerNarrowWarning(
  messageCount: number,
  config: Partial<SlackPayloadConfig> = {}
): boolean {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  return messageCount > finalConfig.triggerNarrowAt;
}

/**
 * Process Slack payload with all optimizations
 * Returns processed messages and metadata
 */
export function processSlackPayload<T extends Record<string, any>>(
  messages: T[],
  config: Partial<SlackPayloadConfig> = {}
): {
  messages: T[];
  originalCount: number;
  tokenEstimate: number;
  shouldNarrow: boolean;
} {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const originalCount = messages?.length || 0;
  
  // Step 1: Select fields if specified
  let processedMessages = finalConfig.selectFields && finalConfig.selectFields.length > 0
    ? selectSlackFields(messages, finalConfig.selectFields)
    : messages;
  
  // Step 2: Limit messages
  processedMessages = limitSlackMessages(processedMessages, finalConfig);
  
  // Step 3: Estimate tokens
  const tokenEstimate = estimateSlackPayloadTokens(processedMessages);
  
  // Step 4: Check if should trigger narrow warning
  const shouldNarrow = shouldTriggerNarrowWarning(originalCount, finalConfig);
  
  return {
    messages: processedMessages,
    originalCount,
    tokenEstimate,
    shouldNarrow,
  };
}

