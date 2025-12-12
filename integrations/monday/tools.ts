import { z } from "zod";

import { getBoards, getBoardItems, getItemDetails } from "./client";

export const mondayTools = {
  listMondayBoards: {
    description: "List all active boards from Monday.com",
    parameters: z.object({}),
    execute: async () => {
      try {
        const boards = await getBoards();
        return {
          boards: boards.map((board) => ({
            id: board.id,
            name: board.name,
            description: board.description || "",
          })),
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : "Failed to fetch boards",
        };
      }
    },
  },

  getMondayTasks: {
    description: "Get tasks (items) from a specific Monday.com board",
    parameters: z.object({
      boardId: z.string().describe("The ID of the Monday.com board"),
      status: z.string().optional().describe("Filter by status (optional)"),
    }),
    execute: async ({ boardId, status }: { boardId: string; status?: string }) => {
      try {
        const items = await getBoardItems(boardId);
        
        let filteredItems = items;
        if (status) {
          // Filter by status column if provided
          filteredItems = items.filter((item) =>
            item.column_values.some(
              (col) => col.text?.toLowerCase().includes(status.toLowerCase())
            )
          );
        }

        return {
          boardId,
          tasks: filteredItems.map((item) => ({
            id: item.id,
            name: item.name,
            status: item.state,
            columns: item.column_values.map((col) => ({
              id: col.id,
              text: col.text || "",
            })),
          })),
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : "Failed to fetch tasks",
        };
      }
    },
  },

  getMondayTaskDetails: {
    description: "Get detailed information about a specific Monday.com task (item)",
    parameters: z.object({
      itemId: z.string().describe("The ID of the Monday.com item/task"),
    }),
    execute: async ({ itemId }: { itemId: string }) => {
      try {
        const item = await getItemDetails(itemId);
        if (!item) {
          return { error: "Task not found" };
        }

        return {
          id: item.id,
          name: item.name,
          status: item.state,
          board: {
            id: item.board.id,
            name: item.board.name,
          },
          group: {
            id: item.group.id,
            title: item.group.title,
          },
          columns: item.column_values.map((col) => ({
            id: col.id,
            text: col.text || "",
            value: col.value || "",
          })),
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : "Failed to fetch task details",
        };
      }
    },
  },
};

