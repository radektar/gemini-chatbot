import { MCPServerConfig } from "./client";

// Monday.com MCP Server Configuration
// Using official @mondaydotcomorg/monday-api-mcp package
// Documentation: https://support.monday.com/hc/en-us/articles/28588158981266-Get-started-with-monday-MCP

// Use getter function to ensure token is read dynamically at connection time
export function getMondayMCPConfig(): MCPServerConfig {
  const token = process.env.MONDAY_API_TOKEN || "";
  return {
    name: "monday",
    command: "npx",
    args: [
      "@mondaydotcomorg/monday-api-mcp@latest",
      "-t",
      token,
      "-ro", // Read-only mode - blocks all write operations at MCP server level
    ],
    env: {
      MONDAY_API_TOKEN: token,
    },
  };
}

// Export for backward compatibility
export const mondayMCPConfig = getMondayMCPConfig();

