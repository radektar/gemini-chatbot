import "server-only";

import { User } from "./schema";

// PoC: Mock database queries (no Postgres required)
// All data is stored only in browser session, not persisted

export async function getUser(email: string): Promise<Array<User>> {
  // Return mock user for PoC
  console.log("[PoC] Mock getUser:", email);
  return [{ id: "poc-user-id", email, password: null }];
}

export async function createUser(email: string, password?: string) {
  console.log("[PoC] Mock createUser:", email);
  return { id: "poc-user-id" };
}

export async function saveChat({
  id,
  messages,
  userId,
}: {
  id: string;
  messages: any;
  userId: string;
}) {
  // PoC: Chat history is not persisted, only stored in browser session
  console.log("[PoC] Mock saveChat - not persisted (id:", id, ")");
  return { id };
}

export async function deleteChatById({ id }: { id: string }) {
  console.log("[PoC] Mock deleteChatById:", id);
  return {};
}

export async function getChatsByUserId({ id }: { id: string }) {
  // PoC: Return empty array - no persisted history
  console.log("[PoC] Mock getChatsByUserId:", id);
  return [];
}

export async function getChatById({ id }: { id: string }) {
  // PoC: Return null - no persisted chats
  console.log("[PoC] Mock getChatById:", id);
  return null;
}

