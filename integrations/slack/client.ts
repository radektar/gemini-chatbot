"use server";

import { WebClient } from "@slack/web-api";
import { processSlackPayload } from "@/lib/slack-payload-control";

// Read token in runtime, not at module load time (allows dotenv to load it first)
function getSlackBotToken(): string {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    throw new Error("SLACK_BOT_TOKEN is not configured");
  }
  return token;
}

let slackClient: WebClient | null = null;

function getSlackClient(): WebClient {
  const token = getSlackBotToken();

  if (!slackClient) {
    slackClient = new WebClient(token);
  }

  return slackClient;
}

export interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  is_archived: boolean;
}

export interface SlackMessage {
  ts: string;
  user?: string;
  text: string;
  thread_ts?: string;
  reply_count?: number;
}

export async function getChannels(): Promise<SlackChannel[]> {
  try {
    const client = getSlackClient();
    const result = await client.conversations.list({
      types: "public_channel",  // Only public channels
      exclude_archived: true,
    });

    if (!result.ok || !result.channels) {
      throw new Error(result.error || "Failed to fetch channels");
    }

    // Optional whitelist filtering
    const allowedChannels = process.env.SLACK_ALLOWED_CHANNELS?.split(',').map(id => id.trim()) || [];
    
    let channels = result.channels;
    
    // Apply whitelist if configured
    if (allowedChannels.length > 0) {
      channels = channels.filter((channel) => allowedChannels.includes(channel.id!));
      console.log(`[Slack] Filtered to ${channels.length} whitelisted channels (out of ${result.channels.length} total)`);
    } else {
      console.log(`[Slack] No whitelist configured - returning all ${channels.length} public channels`);
    }

    return channels.map((channel) => ({
      id: channel.id!,
      name: channel.name || "",
      is_private: false,  // Always false (only public channels)
      is_archived: channel.is_archived || false,
    }));
  } catch (error) {
    console.error("Error fetching Slack channels:", error);
    throw error;
  }
}

export async function getChannelHistory(
  channelId: string,
  oldest?: string,
  limit?: number,
): Promise<SlackMessage[]> {
  // Default limit: 15 messages (configurable via env)
  const defaultLimit = parseInt(process.env.SLACK_MAX_MESSAGES || "15", 10);
  const finalLimit = limit ?? defaultLimit;
  try {
    // Audit logging
    console.log(`[Slack Audit] ${new Date().toISOString()} | Operation: getChannelHistory | Channel: ${channelId} | Limit: ${limit}`);
    
    const client = getSlackClient();
    const result = await client.conversations.history({
      channel: channelId,
      oldest,
      limit,
    });

    if (!result.ok || !result.messages) {
      throw new Error(result.error || "Failed to fetch channel history");
    }

    const rawMessages = result.messages.map((msg) => ({
      ts: msg.ts!,
      user: msg.user,
      text: msg.text || "",
      thread_ts: msg.thread_ts,
      reply_count: msg.reply_count,
    }));

    // Apply payload control (limit messages, estimate tokens)
    const processed = processSlackPayload(rawMessages, {
      maxMessages: parseInt(process.env.SLACK_MAX_MESSAGES || "15", 10),
      triggerNarrowAt: parseInt(process.env.SLACK_TRIGGER_NARROW_AT || "50", 10),
      compactJson: true,
    });

    // Log payload info
    console.log(
      `[Slack Payload] Channel: ${channelId}, Original: ${processed.originalCount} messages, ` +
      `Processed: ${processed.messages.length} messages, ~${processed.tokenEstimate} tokens`
    );

    // If should narrow, log warning (but still return limited messages)
    if (processed.shouldNarrow) {
      console.warn(
        `[Slack Payload] Found ${processed.originalCount} messages, consider narrowing search scope`
      );
    }

    return processed.messages;
  } catch (error) {
    console.error(`Error fetching history for channel ${channelId}:`, error);
    throw error;
  }
}

export async function getAllChannelHistory(
  channelId: string,
): Promise<SlackMessage[]> {
  // Audit logging
  console.log(`[Slack Audit] ${new Date().toISOString()} | Operation: getAllChannelHistory | Channel: ${channelId}`);
  
  const allMessages: SlackMessage[] = [];
  let cursor: string | undefined;
  let oldest: string | undefined;

  do {
    try {
      const client = getSlackClient();
      const result = await client.conversations.history({
        channel: channelId,
        oldest,
        cursor,
        limit: 200,
      });

      if (!result.ok || !result.messages) {
        throw new Error(result.error || "Failed to fetch channel history");
      }

      const batchMessages = result.messages.map((msg) => ({
        ts: msg.ts!,
        user: msg.user,
        text: msg.text || "",
        thread_ts: msg.thread_ts,
        reply_count: msg.reply_count,
      }));

      allMessages.push(...batchMessages);

      cursor = result.response_metadata?.next_cursor;
      
      // Set oldest to the oldest message timestamp for next iteration
      if (result.messages.length > 0) {
        oldest = result.messages[result.messages.length - 1].ts;
      }
    } catch (error) {
      console.error(`Error fetching history for channel ${channelId}:`, error);
      throw error;
    }
  } while (cursor);

  // Apply payload control to final result
  const processed = processSlackPayload(allMessages, {
    maxMessages: parseInt(process.env.SLACK_MAX_MESSAGES || "15", 10),
    triggerNarrowAt: parseInt(process.env.SLACK_TRIGGER_NARROW_AT || "50", 10),
    compactJson: true,
  });

  // Log payload info
  console.log(
    `[Slack Payload] getAllChannelHistory - Channel: ${channelId}, ` +
    `Original: ${processed.originalCount} messages, ` +
    `Processed: ${processed.messages.length} messages, ~${processed.tokenEstimate} tokens`
  );

  // If should narrow, log warning
  if (processed.shouldNarrow) {
    console.warn(
      `[Slack Payload] Found ${processed.originalCount} messages, consider narrowing search scope`
    );
  }

  return processed.messages;
}

