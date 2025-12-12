import { MCPServerConfig } from "./client";

// Monday.com MCP Server Configuration
// Using official @mondaydotcomorg/monday-api-mcp package
// Documentation: https://support.monday.com/hc/en-us/articles/28588158981266-Get-started-with-monday-MCP

export const mondayMCPConfig: MCPServerConfig = {
  name: "monday",
  command: "npx",
  args: [
    "@mondaydotcomorg/monday-api-mcp@latest",
    "-t",
    process.env.MONDAY_API_TOKEN || "",
    "-ro", // Read-only mode - blocks all write operations at MCP server level
  ],
  env: {
    MONDAY_API_TOKEN: process.env.MONDAY_API_TOKEN || "",
  },
};

