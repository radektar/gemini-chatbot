#!/usr/bin/env tsx
/**
 * Test script for Slack search functionality
 * Tests sync and search operations
 * Run with: npx tsx scripts/test-slack-search.ts
 */

// Load environment variables from .env.local BEFORE any imports
import { config } from "dotenv";
const envResult = config({
  path: ".env.local",
});

if (envResult.error) {
  console.warn("Warning: Could not load .env.local:", envResult.error.message);
}

// Force reload of environment variables
if (envResult.parsed) {
  Object.assign(process.env, envResult.parsed);
}

// Now import modules that need env vars
import { syncAllChannels } from "../integrations/slack/sync";
import { slackTools } from "../integrations/slack/tools";

async function testSlackSearch() {
  console.log("=== Slack Search Test ===\n");
  
  // Debug: Check if token is loaded
  const token = process.env.SLACK_BOT_TOKEN;
  if (token) {
    console.log(`✓ SLACK_BOT_TOKEN loaded: ${token.substring(0, 10)}...${token.substring(token.length - 4)}\n`);
  } else {
    console.error("✗ SLACK_BOT_TOKEN not found in environment\n");
    console.error("Make sure .env.local exists and contains SLACK_BOT_TOKEN=xoxb-...");
    process.exit(1);
  }

  // Step 1: Sync channels
  console.log("Step 1: Syncing Slack channels...");
  try {
    const syncResult = await syncAllChannels();
    
    if (syncResult.success) {
      console.log(`✅ Synced ${syncResult.channelsSynced} channels`);
      console.log(`✅ Total messages: ${syncResult.totalMessages}`);
    } else {
      console.error("❌ Sync failed:");
      syncResult.errors.forEach((err) => console.error(`  - ${err}`));
      if (syncResult.channelsSynced === 0) {
        console.error("\n⚠️  No channels synced. Check:");
        console.error("  1. SLACK_BOT_TOKEN is set in .env.local");
        console.error("  2. Bot is invited to public channels");
        console.error("  3. Bot has channels:read and channels:history scopes");
        process.exit(1);
      }
    }
  } catch (error) {
    console.error("❌ Sync error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  console.log("\n" + "=".repeat(50) + "\n");

  // Step 2: Test search
  console.log("Step 2: Testing search for 'Lenovo'...");
  try {
    const searchResult = await slackTools.searchSlackHistory.execute({
      query: "Lenovo",
      limit: 10,
    });

    if (searchResult.error) {
      console.error(`❌ Search error: ${searchResult.error}`);
    } else {
      console.log(`✅ Search completed`);
      console.log(`   Query: "${searchResult.query}"`);
      console.log(`   Total found: ${searchResult.totalFound}`);
      
      if (searchResult.results && searchResult.results.length > 0) {
        console.log(`\n   Results (showing first ${Math.min(5, searchResult.results.length)}):`);
        searchResult.results.slice(0, 5).forEach((result, idx) => {
          console.log(`\n   ${idx + 1}. Channel: #${result.channel}`);
          console.log(`      Timestamp: ${result.timestamp}`);
          console.log(`      User: ${result.user || "unknown"}`);
          console.log(`      Text: ${result.text.substring(0, 100)}${result.text.length > 100 ? "..." : ""}`);
        });
      } else {
        console.log(`\n   ⚠️  No results found for "Lenovo"`);
        console.log(`   This could mean:`);
        console.log(`   - The word doesn't appear in synced messages`);
        console.log(`   - Messages are older than what was synced`);
        console.log(`   - Bot doesn't have access to channels with this word`);
      }
    }
  } catch (error) {
    console.error("❌ Search test error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  console.log("\n" + "=".repeat(50) + "\n");

  // Step 3: Test search with different query
  console.log("Step 3: Testing search with another query...");
  try {
    const searchResult2 = await slackTools.searchSlackHistory.execute({
      query: "test",
      limit: 5,
    });

    if (searchResult2.error) {
      console.error(`❌ Search error: ${searchResult2.error}`);
    } else {
      console.log(`✅ Search for "test" found: ${searchResult2.totalFound} results`);
    }
  } catch (error) {
    console.error("❌ Search test error:", error instanceof Error ? error.message : String(error));
  }

  console.log("\n✅ All tests completed!");
}

testSlackSearch().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

