"use server";

const MONDAY_API_URL = "https://api.monday.com/v2";
const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN;

if (!MONDAY_API_TOKEN) {
  console.warn("MONDAY_API_TOKEN is not set. Monday.com integration will not work.");
}

interface MondayGraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

async function mondayRequest<T>(query: string, variables?: Record<string, any>): Promise<T> {
  if (!MONDAY_API_TOKEN) {
    throw new Error("MONDAY_API_TOKEN is not configured");
  }

  const response = await fetch(MONDAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: MONDAY_API_TOKEN,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const result: MondayGraphQLResponse<T> = await response.json();

  if (result.errors) {
    throw new Error(`Monday.com API error: ${result.errors.map((e) => e.message).join(", ")}`);
  }

  return result.data;
}

export interface MondayBoard {
  id: string;
  name: string;
  description?: string;
  state: string;
}

export interface MondayItem {
  id: string;
  name: string;
  state: string;
  column_values: Array<{
    id: string;
    text?: string;
    value?: string;
  }>;
}

export interface MondayItemDetails extends MondayItem {
  board: {
    id: string;
    name: string;
  };
  group: {
    id: string;
    title: string;
  };
}

export async function getBoards(): Promise<MondayBoard[]> {
  const query = `
    query {
      boards(limit: 50) {
        id
        name
        description
        state
      }
    }
  `;

  const data = await mondayRequest<{ boards: MondayBoard[] }>(query);
  return data.boards.filter((board) => board.state === "active");
}

export async function getBoardItems(boardId: string): Promise<MondayItem[]> {
  const query = `
    query GetBoardItems($boardId: [ID!]) {
      boards(ids: $boardId) {
        items_page {
          items {
            id
            name
            state
            column_values {
              id
              text
              value
            }
          }
        }
      }
    }
  `;

  const data = await mondayRequest<{
    boards: Array<{
      items_page: {
        items: MondayItem[];
      };
    }>;
  }>(query, { boardId: [boardId] });

  if (data.boards.length === 0) {
    return [];
  }

  return data.boards[0].items_page.items.filter((item) => item.state === "active");
}

export async function getItemDetails(itemId: string): Promise<MondayItemDetails | null> {
  const query = `
    query GetItemDetails($itemId: [ID!]) {
      items(ids: $itemId) {
        id
        name
        state
        board {
          id
          name
        }
        group {
          id
          title
        }
        column_values {
          id
          text
          value
        }
      }
    }
  `;

  const data = await mondayRequest<{
    items: MondayItemDetails[];
  }>(query, { itemId: [itemId] });

  if (data.items.length === 0) {
    return null;
  }

  return data.items[0];
}

