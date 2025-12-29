import { MCPServerConfig } from "./client";

// Perplexity MCP Server Configuration
// Using official MCP Perplexity server package
// Documentation: https://github.com/modelcontextprotocol/servers/tree/main/src/perplexity

// Use getter function to ensure API key is read dynamically at connection time
export function getPerplexityMCPConfig(): MCPServerConfig {
  const apiKey = process.env.PERPLEXITY_API_KEY || "";
  
  if (!apiKey) {
    throw new Error("PERPLEXITY_API_KEY is required for Perplexity MCP server");
  }
  
  // Try different possible package names for Perplexity MCP
  // Common patterns: @modelcontextprotocol/server-perplexity, mcp-server-perplexity, etc.
  return {
    name: "perplexity",
    command: "npx",
    args: [
      "--yes", // Suppress npm warnings
      "-y", // Auto-accept
      "mcp-server-perplexity", // Try this package name first
      "--api-key",
      apiKey,
    ],
    env: {
      PERPLEXITY_API_KEY: apiKey,
      // Suppress npm update check warnings
      NO_UPDATE_NOTIFIER: "1",
      npm_config_update_notifier: "false",
    },
  };
}

// Export for backward compatibility
export const perplexityMCPConfig = getPerplexityMCPConfig();

