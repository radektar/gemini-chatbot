#!/usr/bin/env tsx
/**
 * Research script using Perplexity MCP to find best practices
 * for hiding status messages in AI chatbots
 */

import { callPerplexityMCPTool, initializeMCP } from "../integrations/mcp/init";

async function researchStatusMessages() {
  console.log("🔍 Researching best practices for hiding status messages in AI chatbots...\n");

  try {
    // Initialize MCP (including Perplexity)
    await initializeMCP();

    // Research query using Perplexity
    console.log("📚 Querying Perplexity for best practices...\n");
    
    const researchResult = await callPerplexityMCPTool("perplexity_research", {
      messages: [
        {
          role: "user",
          content: `How do modern AI chatbots like ChatGPT, Perplexity AI, and Claude hide intermediate status messages and "thinking out loud" messages from users? What are the best technical approaches to prevent AI assistants from showing step-by-step processing messages (like "I'm searching...", "Now I'm checking...") and only display final results? Include:

1. Prompt engineering techniques
2. Response filtering methods (client-side and server-side)
3. Stream processing approaches
4. Configuration options in AI SDKs (like Vercel AI SDK)
5. Examples from production systems

Focus on practical, implementable solutions.`,
        },
      ],
      strip_thinking: true,
    });

    console.log("✅ Research completed!\n");
    console.log("=" .repeat(80));
    console.log("RESEARCH RESULTS:");
    console.log("=" .repeat(80));
    console.log("\n");
    
    // Display results
    if (typeof researchResult === "string") {
      console.log(researchResult);
    } else if (researchResult && typeof researchResult === "object") {
      console.log(JSON.stringify(researchResult, null, 2));
    } else {
      console.log("Result:", researchResult);
    }

    console.log("\n" + "=" .repeat(80));
    console.log("Research complete!");
    
  } catch (error) {
    console.error("❌ Research failed:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Stack:", error.stack);
    }
    process.exit(1);
  }
}

// Run research
researchStatusMessages().catch(console.error);

