import { z } from "zod";

import { getChannels } from "./client";
import { getAllChannelData, getChannelData } from "./sync";

export const slackTools = {
  getSlackChannels: {
    description: "Get list of available Slack channels",
    parameters: z.object({}),
    execute: async () => {
      try {
        const channels = await getChannels();
        return {
          channels: channels.map((channel) => ({
            id: channel.id,
            name: channel.name,
            isPrivate: channel.is_private,
          })),
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : "Failed to fetch Slack channels",
        };
      }
    },
  },

  searchSlackHistory: {
    description: "Search through synced Slack message history",
    parameters: z.object({
      query: z.string().describe("Search query to find in message text"),
      channelId: z.string().optional().describe("Optional: specific channel ID to search in"),
      limit: z.number().optional().describe("Maximum number of results (default: 20)"),
    }),
    execute: async ({ query, channelId, limit = 20 }: { query: string; channelId?: string; limit?: number }) => {
      try {
        const searchQuery = query.toLowerCase();
        const results: Array<{
          channelId: string;
          channelName: string;
          ts: string;
          user?: string;
          text: string;
          timestamp: string;
        }> = [];

        if (channelId) {
          // Search in specific channel
          const channelData = await getChannelData(channelId);
          if (channelData) {
            channelData.messages
              .filter((msg) => msg.text.toLowerCase().includes(searchQuery))
              .slice(0, limit)
              .forEach((msg) => {
                results.push({
                  channelId: channelData.metadata.channelId,
                  channelName: channelData.metadata.channelName,
                  ts: msg.ts,
                  user: msg.user,
                  text: msg.text,
                  timestamp: new Date(parseFloat(msg.ts) * 1000).toISOString(),
                });
              });
          }
        } else {
          // Search across all channels
          const allChannelData = await getAllChannelData();
          
          for (const channelData of allChannelData) {
            channelData.messages
              .filter((msg) => msg.text.toLowerCase().includes(searchQuery))
              .forEach((msg) => {
                results.push({
                  channelId: channelData.metadata.channelId,
                  channelName: channelData.metadata.channelName,
                  ts: msg.ts,
                  user: msg.user,
                  text: msg.text,
                  timestamp: new Date(parseFloat(msg.ts) * 1000).toISOString(),
                });
              });
          }

          // Sort by timestamp (newest first) and limit
          results.sort((a, b) => parseFloat(b.ts) - parseFloat(a.ts));
          results.splice(limit);
        }

        return {
          query,
          results: results.map((r) => ({
            channel: r.channelName,
            timestamp: r.timestamp,
            user: r.user,
            text: r.text,
          })),
          totalFound: results.length,
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : "Failed to search Slack history",
        };
      }
    },
  },
};

