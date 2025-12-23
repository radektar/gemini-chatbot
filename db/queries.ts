import "server-only";

import { genSaltSync, hashSync } from "bcrypt-ts";
import { desc, eq, and, sql, count, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { user, chat, User, messageFeedback, MessageFeedback } from "./schema";

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
          updatedAt: new Date(),
        })
        .where(eq(chat.id, id));
    }

    // Dla nowego chatu - generowanie title z pierwszej wiadomości użytkownika
    const firstUserMessage = messages.find((m: any) => m.role === 'user');
    const title = firstUserMessage?.content 
      ? (typeof firstUserMessage.content === 'string' 
          ? firstUserMessage.content.slice(0, 100) 
          : String(firstUserMessage.content).slice(0, 100))
      : 'Nowy chat';

    return await database.insert(chat).values({
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      title,
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

export async function saveFeedback({
  chatId,
  userId,
  messageId,
  rating,
  comment,
  userQuery,
  assistantResponse,
  toolsUsed,
}: {
  chatId?: string;
  userId: string;
  messageId?: string;
  rating: 1 | -1;
  comment?: string;
  userQuery?: string;
  assistantResponse?: string;
  toolsUsed?: any;
}) {
  try {
    const database = getDb();
    
    // Check if chatId exists in Chat table before saving feedback
    // If chatId is provided but doesn't exist, set it to null to avoid foreign key violation
    let finalChatId: string | null = chatId || null;
    if (finalChatId) {
      try {
        const existingChat = await database.select().from(chat).where(eq(chat.id, finalChatId)).limit(1);
        if (existingChat.length === 0) {
          console.warn(`⚠️  Chat ${finalChatId} does not exist in database - setting chatId to null`);
          finalChatId = null;
        }
      } catch (checkError) {
        // If check fails, set chatId to null to avoid foreign key violation
        console.warn(`⚠️  Failed to check if chat exists - setting chatId to null: ${checkError}`);
        finalChatId = null;
      }
    }
    
    return await database.insert(messageFeedback).values({
      chatId: finalChatId,
      userId,
      messageId: messageId || null,
      rating,
      comment: comment || null,
      userQuery: userQuery || null,
      assistantResponse: assistantResponse || null,
      toolsUsed: toolsUsed ? JSON.stringify(toolsUsed) : null,
      createdAt: new Date(),
    });
  } catch (error) {
    // Graceful degradation: silently fail if DB not configured (PoC mode)
    if (error instanceof Error && error.message.includes("Database not configured")) {
      console.warn("⚠️  Database not configured - feedback not saved (PoC mode)");
      return;
    }
    console.error("Failed to save feedback in database");
    throw error;
  }
}

export async function getFeedbackStats(period?: string) {
  try {
    const database = getDb();
    
    let whereCondition = sql`1=1`;
    
    if (period) {
      const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 0;
      if (days > 0) {
        whereCondition = sql`${messageFeedback.createdAt} >= NOW() - INTERVAL '${sql.raw(String(days))} days'`;
      }
    }
    
    const [stats] = await database
      .select({
        total: count(),
        positive: sql<number>`COUNT(CASE WHEN ${messageFeedback.rating} = 1 THEN 1 END)`,
        negative: sql<number>`COUNT(CASE WHEN ${messageFeedback.rating} = -1 THEN 1 END)`,
      })
      .from(messageFeedback)
      .where(whereCondition);
    
    const total = Number(stats.total) || 0;
    const positive = Number(stats.positive) || 0;
    const negative = Number(stats.negative) || 0;
    const rate = total > 0 ? positive / total : 0;
    
    return {
      total,
      positive,
      negative,
      rate,
    };
  } catch (error) {
    // Graceful degradation: return empty stats if DB not configured (PoC mode)
    if (error instanceof Error && error.message.includes("Database not configured")) {
      console.warn("⚠️  Database not configured - returning empty feedback stats (PoC mode)");
      return { total: 0, positive: 0, negative: 0, rate: 0 };
    }
    console.error("Failed to get feedback stats from database");
    throw error;
  }
}

export async function getFeedbackByChat(chatId: string) {
  try {
    const database = getDb();
    return await database
      .select()
      .from(messageFeedback)
      .where(eq(messageFeedback.chatId, chatId))
      .orderBy(desc(messageFeedback.createdAt));
  } catch (error) {
    // Graceful degradation: return empty array if DB not configured (PoC mode)
    if (error instanceof Error && error.message.includes("Database not configured")) {
      console.warn("⚠️  Database not configured - returning empty feedback list (PoC mode)");
      return [];
    }
    console.error("Failed to get feedback by chat from database");
    throw error;
  }
}

export async function getRecentNegativeFeedback(limit: number = 10) {
  try {
    const database = getDb();
    return await database
      .select()
      .from(messageFeedback)
      .where(eq(messageFeedback.rating, -1))
      .orderBy(desc(messageFeedback.createdAt))
      .limit(limit);
  } catch (error) {
    // Graceful degradation: return empty array if DB not configured (PoC mode)
    if (error instanceof Error && error.message.includes("Database not configured")) {
      console.warn("⚠️  Database not configured - returning empty negative feedback list (PoC mode)");
      return [];
    }
    console.error("Failed to get recent negative feedback from database");
    throw error;
  }
}

