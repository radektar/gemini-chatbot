/**
 * Context Budget Management
 * 
 * Manages token budget allocation and degradation strategies for LLM context windows.
 * Based on research from PH06_CONTEXT_RESEARCH.md:
 * - Optimal context usage: 70-75% (not 100%)
 * - Integration data budget: 30-50K tokens (15-25% of 200K)
 * - "Lost in the Middle" problem: information in middle of context is ignored
 */

export interface ContextBudget {
  total: number;
  systemPrompt: { min: number; max: number };
  conversationHistory: { min: number; max: number };
  integrationData: { min: number; max: number };
  output: { min: number; max: number };
  safetyMargin: { min: number; max: number };
}

export enum DegradationLevel {
  NONE = "none",
  SELECT_FIELDS = "select_fields",
  REDUCE_RECORDS = "reduce_records",
  COMPRESS_HISTORY = "compress_history",
  AGGREGATE = "aggregate",
  ASK_USER = "ask_user",
}

/**
 * Estimate token count for text (approximate)
 * Rule: ~4 characters = 1 token (EN), ~2-3 characters (PL)
 * Using conservative estimate: 4 chars = 1 token
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Conservative estimate: 4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Estimate token count for JSON object
 * Accounts for JSON structure overhead (quotes, brackets, commas)
 */
export function estimateJsonTokens(obj: any): number {
  if (!obj) return 0;
  
  try {
    // Compact JSON (no whitespace) for accurate estimation
    const jsonString = JSON.stringify(obj);
    return estimateTokens(jsonString);
  } catch (error) {
    // Fallback: estimate based on string representation
    return estimateTokens(String(obj));
  }
}

/**
 * Allocate budget for 200K context window
 * Based on research recommendations from PH06_CONTEXT_RESEARCH.md
 */
export function allocateBudget(totalContextWindow: number = 200_000): ContextBudget {
  return {
    total: totalContextWindow,
    systemPrompt: {
      min: Math.floor(totalContextWindow * 0.01),      // 1% = 2K
      max: Math.floor(totalContextWindow * 0.025),    // 2.5% = 5K
    },
    conversationHistory: {
      min: Math.floor(totalContextWindow * 0.05),    // 5% = 10K
      max: Math.floor(totalContextWindow * 0.10),    // 10% = 20K
    },
    integrationData: {
      min: Math.floor(totalContextWindow * 0.15),    // 15% = 30K
      max: Math.floor(totalContextWindow * 0.25),    // 25% = 50K
    },
    output: {
      min: Math.floor(totalContextWindow * 0.04),     // 4% = 8K
      max: Math.floor(totalContextWindow * 0.08),    // 8% = 16K
    },
    safetyMargin: {
      min: Math.floor(totalContextWindow * 0.20),     // 20% = 40K
      max: Math.floor(totalContextWindow * 0.40),     // 40% = 80K
    },
  };
}

/**
 * Calculate current usage from components
 */
export function calculateCurrentUsage(params: {
  systemPrompt: string;
  messages: any[];
  integrationData?: any;
}): number {
  const systemTokens = estimateTokens(params.systemPrompt);
  const messagesTokens = estimateJsonTokens(params.messages);
  const integrationTokens = params.integrationData 
    ? estimateJsonTokens(params.integrationData)
    : 0;
  
  return systemTokens + messagesTokens + integrationTokens;
}

/**
 * Determine degradation level based on current usage vs budget
 * Returns degradation strategy in order of severity
 */
export function shouldDegrade(
  currentUsage: number,
  budget: ContextBudget
): DegradationLevel {
  const totalUsed = currentUsage;
  const totalBudget = budget.total;
  const usagePercent = (totalUsed / totalBudget) * 100;
  
  // Optimal usage: 70-75% (research-based)
  const optimalThreshold = 75; // Already in percentage
  const criticalThreshold = 90; // Already in percentage
  
  if (usagePercent < optimalThreshold) {
    return DegradationLevel.NONE;
  }
  
  // Check which component is over budget
  const integrationBudget = budget.integrationData.max;
  const historyBudget = budget.conversationHistory.max;
  
  // Estimate component usage (simplified - would need actual breakdown in production)
  // For now, use heuristics:
  // - If total usage > 90%, likely integration data is too large
  // - If total usage > 75% but < 90%, likely history is too long
  
  if (usagePercent >= criticalThreshold) {
    // Critical: ask user to narrow scope
    return DegradationLevel.ASK_USER;
  }
  
  if (usagePercent >= 85) {
    // High: aggregate data
    return DegradationLevel.AGGREGATE;
  }
  
  if (usagePercent >= 80) {
    // Medium-high: compress history
    return DegradationLevel.COMPRESS_HISTORY;
  }
  
  // Medium: reduce records or select fields
  // Default to reducing records first (more impactful)
  return DegradationLevel.REDUCE_RECORDS;
}

/**
 * Get degradation message for user
 */
export function getDegradationMessage(level: DegradationLevel, count: number, source: string): string {
  switch (level) {
    case DegradationLevel.ASK_USER:
      return `Znaleziono ${count} rekordów w ${source}. Proszę zawęzić zakres zapytania (np. przez dodanie filtrów geografii, statusu lub okresu czasowego).`;
    case DegradationLevel.AGGREGATE:
      return `Znaleziono ${count} rekordów. Wyświetlam podsumowanie zamiast pełnej listy.`;
    case DegradationLevel.COMPRESS_HISTORY:
      return `Długa historia rozmowy. Kompresuję starsze wiadomości.`;
    case DegradationLevel.REDUCE_RECORDS:
      return `Znaleziono ${count} rekordów. Wyświetlam najważniejsze.`;
    default:
      return "";
  }
}

