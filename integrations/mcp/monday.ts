import { MCPServerConfig } from "./client";

// Monday.com MCP Server Configuration
// Using official @mondaydotcomorg/monday-api-mcp package
// Documentation: https://support.monday.com/hc/en-us/articles/28588158981266-Get-started-with-monday-MCP
//
// IMPORTANT: Requires Node.js 20-23.x (Node.js 24+ has native module compilation issues)
// See CHANGELOG.md [0.2.4] for details

// Use getter function to ensure token is read dynamically at connection time
export function getMondayMCPConfig(): MCPServerConfig {
  const token = process.env.MONDAY_API_TOKEN || "";
  
  return {
    name: "monday",
    command: "npx",
    args: [
      "--yes", // Suppress npm warnings that can pollute stdout
      "@mondaydotcomorg/monday-api-mcp@1.14.0",
      "-t",
      token,
      "-ro", // Read-only mode - blocks all write operations at MCP server level
    ],
    env: {
      MONDAY_API_TOKEN: token,
      // Suppress npm update check warnings
      NO_UPDATE_NOTIFIER: "1",
      npm_config_update_notifier: "false",
    },
  };
}

// Export for backward compatibility
export const mondayMCPConfig = getMondayMCPConfig();

