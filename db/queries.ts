import "server-only";

import { genSaltSync, hashSync } from "bcrypt-ts";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { user, chat, User } from "./schema";

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// Check if POSTGRES_URL is configured (not required in PoC mode)
function isDatabaseConfigured(): boolean {
  if (!process.env.POSTGRES_URL) {
    return false;
  }
  
  const postgresUrl = process.env.POSTGRES_URL;
  
  // Check if POSTGRES_URL is a placeholder
  const isPlaceholder = 
    postgresUrl.includes('user:password@host:port') ||
    postgresUrl === 'postgresql://user:password@host:port/database?sslmode=require';
  
  return !isPlaceholder;
}

// Lazy initialization of database connection
let client: postgres.Sql | null = null;
let db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!isDatabaseConfigured()) {
    console.warn("⚠️  Database not configured - running in PoC mode without persistence");
    throw new Error("Database not configured. Set POSTGRES_URL environment variable to enable database features.");
  }
  
  if (!db) {
    const baseUrl = process.env.POSTGRES_URL!;
    // Only append sslmode if it's not already in the URL
    const constructedUrl = baseUrl.includes('sslmode') 
      ? baseUrl 
      : `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}sslmode=require`;
    
    client = postgres(constructedUrl);
    db = drizzle(client);
  }
  
  return db;
}

export async function getUser(email: string): Promise<Array<User>> {
  try {
    const database = getDb();
    return await database.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error("Failed to get user from database");
    throw error;
  }
}

export async function createUser(email: string, password?: string) {
  // For OAuth users (Google), password is optional
  let passwordHash: string | null = null;
  
  if (password && password.length > 0) {
    let salt = genSaltSync(10);
    passwordHash = hashSync(password, salt);
  }

  try {
    const database = getDb();
    return await database.insert(user).values({ email, password: passwordHash });
  } catch (error) {
    console.error("Failed to create user in database");
    throw error;
  }
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
  try {
    const database = getDb();
    const selectedChats = await database.select().from(chat).where(eq(chat.id, id));

    if (selectedChats.length > 0) {
      return await database
        .update(chat)
        .set({
          messages: JSON.stringify(messages),
        })
        .where(eq(chat.id, id));
    }

    return await database.insert(chat).values({
      id,
      createdAt: new Date(),
      messages: JSON.stringify(messages),
      userId,
    });
  } catch (error) {
    // Graceful degradation: silently fail if DB not configured (PoC mode)
    if (error instanceof Error && error.message.includes("Database not configured")) {
      console.warn("⚠️  Database not configured - chat not saved (PoC mode)");
      return; // Silent fail - chat exists only in session
    }
    console.error("Failed to save chat in database");
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    const database = getDb();
    return await database.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    // Graceful degradation: silently fail if DB not configured (PoC mode)
    if (error instanceof Error && error.message.includes("Database not configured")) {
      console.warn("⚠️  Database not configured - chat deletion skipped (PoC mode)");
      return; // Silent fail - chat doesn't exist in DB anyway
    }
    console.error("Failed to delete chat by id from database");
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    const database = getDb();
    return await database
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    // Graceful degradation: return empty array if DB not configured (PoC mode)
    if (error instanceof Error && error.message.includes("Database not configured")) {
      console.warn("⚠️  Database not configured - returning empty chat list (PoC mode)");
      return [];
    }
    console.error("Failed to get chats by user from database");
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const database = getDb();
    const [selectedChat] = await database.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    // Graceful degradation: return undefined if DB not configured (PoC mode)
    if (error instanceof Error && error.message.includes("Database not configured")) {
      console.warn("⚠️  Database not configured - returning undefined for chat (PoC mode)");
      return undefined;
    }
    console.error("Failed to get chat by id from database");
    throw error;
  }
}

