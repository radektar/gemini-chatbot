/**
 * Monday.com Payload Control
 * 
 * Controls payload size for Monday.com integration to prevent context overflow.
 * Based on research from PH06_CONTEXT_RESEARCH.md:
 * - Default: 30 records
 * - Maximum: 50 records
 * - Trigger "narrow" at: >100 potential records
 * - Average token per record: 150-300 tokens
 */

import { estimateJsonTokens } from "@/ai/context-budget";

export interface MondayPayloadConfig {
  maxRecords: number;         // Default: 30, Max: 50
  triggerNarrowAt: number;    // Default: 100
  selectFields?: string[];   // Optional: only these fields
  compactJson: boolean;       // Remove whitespace
}

const DEFAULT_CONFIG: MondayPayloadConfig = {
  maxRecords: 30,
  triggerNarrowAt: 100,
  compactJson: true,
};

/**
 * Limit number of Monday.com records
 * Returns first N records (most relevant should be first)
 */
export function limitMondayRecords<T extends Record<string, any>>(
  items: T[],
  config: Partial<MondayPayloadConfig> = {}
): T[] {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  if (!items || items.length === 0) {
    return [];
  }
  
  // If within limit, return all
  if (items.length <= finalConfig.maxRecords) {
    return items;
  }
  
  // Return first N records (assumes they're sorted by relevance)
  return items.slice(0, finalConfig.maxRecords);
}

/**
 * Select only specified fields from Monday.com items
 * Reduces token count by removing unnecessary columns
 */
export function selectMondayFields<T extends Record<string, any>>(
  items: T[],
  fields: string[]
): T[] {
  if (!items || items.length === 0 || !fields || fields.length === 0) {
    return items;
  }
  
  return items.map(item => {
    const filtered: Record<string, any> = {};
    
    // Always include id and name (essential)
    if (item.id !== undefined) filtered.id = item.id;
    if (item.name !== undefined) filtered.name = item.name;
    
    // Include requested fields
    for (const field of fields) {
      if (item[field] !== undefined) {
        filtered[field] = item[field];
      }
    }
    
    return filtered as T;
  });
}

/**
 * Compact JSON payload (remove whitespace)
 * Saves ~50% tokens vs pretty-printed JSON
 */
export function compactMondayPayload(data: any): string {
  return JSON.stringify(data);
}

/**
 * Estimate token count for Monday.com payload
 */
export function estimateMondayPayloadTokens(items: any[]): number {
  return estimateJsonTokens(items);
}

/**
 * Check if payload should trigger "narrow scope" warning
 */
export function shouldTriggerNarrowWarning(
  recordCount: number,
  config: Partial<MondayPayloadConfig> = {}
): boolean {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  return recordCount > finalConfig.triggerNarrowAt;
}

/**
 * Process Monday.com payload with all optimizations
 * Returns processed items and metadata
 */
export function processMondayPayload<T extends Record<string, any>>(
  items: T[],
  config: Partial<MondayPayloadConfig> = {}
): {
  items: T[];
  originalCount: number;
  tokenEstimate: number;
  shouldNarrow: boolean;
} {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const originalCount = items?.length || 0;
  
  // Step 1: Select fields if specified
  let processedItems = finalConfig.selectFields && finalConfig.selectFields.length > 0
    ? selectMondayFields(items, finalConfig.selectFields)
    : items;
  
  // Step 2: Limit records
  processedItems = limitMondayRecords(processedItems, finalConfig);
  
  // Step 3: Estimate tokens
  const tokenEstimate = estimateMondayPayloadTokens(processedItems);
  
  // Step 4: Check if should trigger narrow warning
  const shouldNarrow = shouldTriggerNarrowWarning(originalCount, finalConfig);
  
  return {
    items: processedItems,
    originalCount,
    tokenEstimate,
    shouldNarrow,
  };
}

