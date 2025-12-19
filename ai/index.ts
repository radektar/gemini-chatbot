import { anthropic } from "@ai-sdk/anthropic";

// =============================================================================
// ANTHROPIC CLAUDE MODELS - Current Provider (Dec 2024)
// =============================================================================
// Note: Using @ai-sdk/anthropic@1.2.12 for compatibility with ai@3.4.9
//
// PROJECT STRATEGY: Single provider (Anthropic OR Google, not both)
// - Currently: Anthropic Claude (better reasoning, tool calling)
// - Future option: Google Gemini (97% cheaper, but less tested)
// - Switch via: AI_PROVIDER environment variable
//
// =============================================================================

// -----------------------------------------------------------------------------
// AVAILABLE MODELS (Verified Dec 2024):
// -----------------------------------------------------------------------------
// 
// Claude Haiku 3 ($0.25/$1.25 per MTok):
//   - CHEAPEST option (95% cheaper than Sonnet!)
//   - Best for: simple queries, classification, data extraction
//   - Context: 200K tokens
//   - Speed: Ultra-fast
//
// Claude Haiku 4.5 ($1/$5 per MTok): ⭐ RECOMMENDED DEFAULT
//   - Best value: quality vs cost
//   - Excellent tool calling (Monday, Slack)
//   - Strong coding (73.3% SWE-bench)
//   - Context: 200K tokens
//   - Speed: 4-5x faster than Sonnet
//   - 85% cheaper than Sonnet
//
// Claude Sonnet 4.5 ($3/$15 per MTok):
//   - Best reasoning and coding
//   - Use for: complex analysis, multi-step workflows
//   - Context: 200K-1M tokens (beta)
//   - Speed: Balanced
//
// Claude Opus 4.5 ($5/$25 per MTok):
//   - Premium reasoning (if Sonnet not enough)
//   - Context: 200K tokens
//
// Claude Opus 4.1 ($15/$75 per MTok):
//   - Highest intelligence (rarely needed)
//   - 5x MORE EXPENSIVE than Sonnet - use sparingly!
//
// -----------------------------------------------------------------------------

// COST OPTIMIZATION STRATEGY:
// - 80% requests: Haiku 4.5 (fast, cheap, great for tools)
// - 15% requests: Haiku 3 (ultra-cheap for simple queries)
// - 5% requests: Sonnet 4.5 (complex reasoning only)
// Expected savings: 85% vs using only Sonnet 4.5

// =============================================================================
// MODEL EXPORTS
// =============================================================================

// DEFAULT MODEL: Claude Haiku 4.5 (RECOMMENDED)
// Best balance of cost, speed, and quality
// Perfect for: Monday queries, Slack search, general chat, tool calling
export const geminiProModel = anthropic("claude-haiku-4-5-20251001");

// FALLBACK MODEL: Claude Haiku 3 (ULTRA-CHEAP)
// Use for: very simple queries, classification, when budget is critical
// 95% cheaper than Sonnet 4.5!
export const geminiFlashModel = anthropic("claude-3-haiku-20240307");

// PREMIUM MODEL: Claude Sonnet 4.5 (FOR COMPLEX TASKS)
// Use for: complex reasoning, code generation, multi-step workflows
// Only use when Haiku models are insufficient
export const geminiPremiumModel = anthropic("claude-sonnet-4-5-20250929");

// =============================================================================
// FUTURE: Google Gemini Alternative (97% cheaper!)
// =============================================================================
// 
// import { google } from "@ai-sdk/google";
// 
// Gemini 2.0 Flash: $0.075/$0.30 per MTok (vs Claude Sonnet $3/$15)
// - 40x cheaper than Claude Sonnet!
// - Ultra-long context: 1M tokens
// - Trade-off: slightly weaker reasoning
// 
// When to consider migration:
// - Monthly costs > $1000
// - Need for ultra-long context (>200K tokens)
// - Less reasoning-intensive use cases
//
// export const geminiFlashGoogle = google("gemini-2.0-flash-001");
//
// =============================================================================

// NOTES:
// 1. "geminiProModel" name is historical - we're using Claude, not Gemini
// 2. Provider can be switched via environment variable (see provider-abstraction.ts)
// 3. Always use prompt caching for system prompts (90% savings!)
// 4. Monitor costs: aim for <$500/month with smart routing
