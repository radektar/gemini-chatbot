"use server";

import { promises as fs } from "fs";
import path from "path";

import { getAllChannelHistory, getChannels } from "./client";

const DATA_DIR = path.join(process.cwd(), "data", "slack");

interface SyncMetadata {
  channelId: string;
  channelName: string;
  lastSyncTimestamp: string;
  messageCount: number;
}

interface ChannelData {
  metadata: SyncMetadata;
  messages: Array<{
    ts: string;
    user?: string;
    text: string;
    thread_ts?: string;
    reply_count?: number;
  }>;
}

async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating data directory:", error);
    throw error;
  }
}

async function getLastSyncTimestamp(channelId: string): Promise<string | null> {
  try {
    const filePath = path.join(DATA_DIR, `${channelId}.json`);
    const data = await fs.readFile(filePath, "utf-8");
    const channelData: ChannelData = JSON.parse(data);
    return channelData.metadata.lastSyncTimestamp;
  } catch (error) {
    // File doesn't exist or is invalid, return null for full sync
    return null;
  }
}

async function saveChannelData(channelId: string, channelName: string, messages: any[]): Promise<void> {
  await ensureDataDir();

  const filePath = path.join(DATA_DIR, `${channelId}.json`);
  
  // Get existing messages if file exists
  let existingMessages: any[] = [];
  let lastSyncTimestamp: string | null = null;

  try {
    const existingData = await fs.readFile(filePath, "utf-8");
    const existingChannelData: ChannelData = JSON.parse(existingData);
    existingMessages = existingChannelData.messages || [];
    lastSyncTimestamp = existingChannelData.metadata.lastSyncTimestamp;
  } catch (error) {
    // File doesn't exist, start fresh
  }

  // Merge messages, avoiding duplicates (by timestamp)
  const messageMap = new Map<string, any>();
  
  // Add existing messages
  existingMessages.forEach((msg) => {
    messageMap.set(msg.ts, msg);
  });

  // Add/update new messages
  messages.forEach((msg) => {
    messageMap.set(msg.ts, msg);
  });

  // Sort by timestamp (oldest first)
  const allMessages = Array.from(messageMap.values()).sort(
    (a, b) => parseFloat(a.ts) - parseFloat(b.ts)
  );

  // Get the newest timestamp
  const newestTimestamp = allMessages.length > 0 
    ? allMessages[allMessages.length - 1].ts 
    : new Date().toISOString();

  const channelData: ChannelData = {
    metadata: {
      channelId,
      channelName,
      lastSyncTimestamp: newestTimestamp,
      messageCount: allMessages.length,
    },
    messages: allMessages,
  };

  await fs.writeFile(filePath, JSON.stringify(channelData, null, 2), "utf-8");
}

export async function syncAllChannels(): Promise<{
  success: boolean;
  channelsSynced: number;
  totalMessages: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let channelsSynced = 0;
  let totalMessages = 0;

  try {
    const channels = await getChannels();

    for (const channel of channels) {
      try {
        const messages = await getAllChannelHistory(channel.id);
        await saveChannelData(channel.id, channel.name, messages);
        channelsSynced++;
        totalMessages += messages.length;
      } catch (error) {
        const errorMsg = `Failed to sync channel ${channel.name}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return {
      success: errors.length === 0,
      channelsSynced,
      totalMessages,
      errors,
    };
  } catch (error) {
    errors.push(`Failed to fetch channels: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      channelsSynced,
      totalMessages,
      errors,
    };
  }
}

export async function syncChannel(channelId: string): Promise<{
  success: boolean;
  messageCount: number;
  error?: string;
}> {
  try {
    const channels = await getChannels();
    const channel = channels.find((c) => c.id === channelId);

    if (!channel) {
      return {
        success: false,
        messageCount: 0,
        error: "Channel not found",
      };
    }

    const lastSync = await getLastSyncTimestamp(channelId);
    const messages = await getAllChannelHistory(channelId);
    
    await saveChannelData(channel.id, channel.name, messages);

    return {
      success: true,
      messageCount: messages.length,
    };
  } catch (error) {
    return {
      success: false,
      messageCount: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function getChannelData(channelId: string): Promise<ChannelData | null> {
  try {
    const filePath = path.join(DATA_DIR, `${channelId}.json`);
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as ChannelData;
  } catch (error) {
    return null;
  }
}

export async function getAllChannelData(): Promise<ChannelData[]> {
  await ensureDataDir();

  try {
    const files = await fs.readdir(DATA_DIR);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    const allData: ChannelData[] = [];

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(DATA_DIR, file);
        const data = await fs.readFile(filePath, "utf-8");
        allData.push(JSON.parse(data) as ChannelData);
      } catch (error) {
        console.error(`Error reading file ${file}:`, error);
      }
    }

    return allData;
  } catch (error) {
    console.error("Error reading channel data:", error);
    return [];
  }
}

