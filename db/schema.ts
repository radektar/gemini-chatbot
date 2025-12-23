import { Message } from "ai";
import { InferSelectModel } from "drizzle-orm";
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  index,
  integer,
  text,
} from "drizzle-orm/pg-core";

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (table) => ({
  emailIdx: index("user_email_idx").on(table.email),
}));

export type User = InferSelectModel<typeof user>;

export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  title: varchar("title", { length: 255 }),
  messages: json("messages").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
}, (table) => ({
  userIdIdx: index("chat_userId_idx").on(table.userId),
  createdAtIdx: index("chat_createdAt_idx").on(table.createdAt),
}));

export type Chat = Omit<InferSelectModel<typeof chat>, "messages"> & {
  messages: Array<Message>;
};

export const messageFeedback = pgTable("MessageFeedback", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId").references(() => chat.id, { onDelete: "cascade" }),
  userId: uuid("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  messageId: varchar("messageId", { length: 255 }),
  rating: integer("rating").notNull(), // 1 lub -1
  comment: text("comment"),
  userQuery: text("userQuery"),
  assistantResponse: text("assistantResponse"),
  toolsUsed: json("toolsUsed"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (table) => ({
  chatIdIdx: index("feedback_chatId_idx").on(table.chatId),
  userIdIdx: index("feedback_userId_idx").on(table.userId),
  ratingIdx: index("feedback_rating_idx").on(table.rating),
  createdAtIdx: index("feedback_createdAt_idx").on(table.createdAt),
}));

export type MessageFeedback = InferSelectModel<typeof messageFeedback>;
