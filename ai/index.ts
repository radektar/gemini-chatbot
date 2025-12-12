import { anthropic } from "@ai-sdk/anthropic";

// Using Anthropic Claude models available for this API key
// Note: Using @ai-sdk/anthropic@1.2.12 for compatibility with ai@3.4.9
// Available models (verified via API):
// - claude-3-7-sonnet-20250219 - newest sonnet available
// - claude-3-5-haiku-20241022 - fast and economical
// - claude-3-haiku-20240307 - fastest, most compatible

// Main model for complex tasks (balanced performance)
export const geminiProModel = anthropic("claude-3-7-sonnet-20250219");

// Faster model for less complex tasks (fastest and most economical)
export const geminiFlashModel = anthropic("claude-3-haiku-20240307");
