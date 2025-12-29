#!/usr/bin/env tsx
/**
 * Test script for Perplexity MCP server
 * Tests connection and basic tool calls
 */

import { mcpManager } from "../integrations/mcp/client";
import { getPerplexityMCPConfig } from "../integrations/mcp/perplexity";

async function testPerplexityMCP() {
  console.log("🔍 Testing Perplexity MCP Server...\n");

  // Check environment variable
  if (!process.env.PERPLEXITY_API_KEY) {
    console.error("❌ PERPLEXITY_API_KEY is not set in environment variables");
    console.log("\nTo set it, add to .env.local:");
    console.log("PERPLEXITY_API_KEY=your_api_key_here");
    process.exit(1);
  }

  try {
    // Connect to Perplexity MCP server
    console.log("1️⃣ Connecting to Perplexity MCP server...");
    const config = getPerplexityMCPConfig();
    await mcpManager.connect(config);
    console.log("✅ Connected successfully\n");

    // List available tools
    console.log("2️⃣ Listing available tools...");
    const toolsResponse = await mcpManager.listTools("perplexity");
    const tools = toolsResponse.tools || [];
    console.log(`✅ Found ${tools.length} tools:`);
    tools.forEach((tool: any) => {
      console.log(`   - ${tool.name}: ${tool.description || "No description"}`);
    });
    console.log();

    // Test a simple search query
    console.log("3️⃣ Testing search query...");
    const searchResult = await mcpManager.callTool("perplexity", "perplexity_search", {
      query: "What is the capital of France?",
      max_results: 3,
    });
    console.log("✅ Search completed");
    console.log("Result:", JSON.stringify(searchResult, null, 2));
    console.log();

    // Test research query
    console.log("4️⃣ Testing research query...");
    const researchResult = await mcpManager.callTool("perplexity", "perplexity_research", {
      messages: [
        {
          role: "user",
          content: "What are the latest developments in AI?",
        },
      ],
    });
    console.log("✅ Research completed");
    console.log("Result preview:", JSON.stringify(researchResult, null, 2).substring(0, 500));
    console.log();

    console.log("✅ All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Stack:", error.stack);
    }
    process.exit(1);
  } finally {
    // Cleanup
    try {
      await mcpManager.disconnect("perplexity");
      console.log("\n🔌 Disconnected from Perplexity MCP server");
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  }
}

// Run test
testPerplexityMCP().catch(console.error);

