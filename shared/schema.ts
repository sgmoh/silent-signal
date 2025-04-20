import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Discord message recipient user schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  discordId: text("discord_id").notNull(),
  username: text("username"),
  status: text("status").default("unknown"),
});

// Message schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  discordUserId: text("discord_user_id").notNull(),
  status: text("status").notNull().default("pending"),
  error: text("error"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Auth token schema (no persistence, just for validation)
export const tokenSchema = z.object({
  token: z.string().min(50).max(100),
});

// DM request schema
export const dmRequestSchema = z.object({
  userId: z.string().min(17).max(19),
  message: z.string().min(1).max(2000),
  token: z.string().min(50).max(100),
});

// Bulk DM request schema
export const bulkDmRequestSchema = z.object({
  userIds: z.array(z.string().min(17).max(19)),
  message: z.string().min(1).max(2000),
  token: z.string().min(50).max(100),
  delay: z.number().min(0).max(10).optional(),
});

// Discord token validation schema
export const validateTokenSchema = z.object({
  token: z.string().min(50).max(100),
});

// Guild ID schema for fetching members
export const guildIdSchema = z.object({
  token: z.string().min(50).max(100),
  guildId: z.string().min(17).max(19),
});

// Message status schema for frontend
export const messageStatusSchema = z.object({
  userId: z.string(),
  username: z.string().nullable(),
  message: z.string(),
  success: z.boolean(),
  error: z.string().optional(),
  timestamp: z.date(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  discordId: true,
  username: true,
  status: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
  discordUserId: true,
  status: true,
  error: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type TokenRequest = z.infer<typeof tokenSchema>;
export type DmRequest = z.infer<typeof dmRequestSchema>;
export type BulkDmRequest = z.infer<typeof bulkDmRequestSchema>;
export type ValidateTokenRequest = z.infer<typeof validateTokenSchema>;
export type GuildIdRequest = z.infer<typeof guildIdSchema>;
export type MessageStatus = z.infer<typeof messageStatusSchema>;

// Discord types
export interface DiscordUser {
  id: string;
  username: string;
  discriminator?: string;
  avatar?: string;
  bot?: boolean;
  system?: boolean;
  banner?: string;
  accent_color?: number;
}

export interface DiscordBot {
  id: string;
  username: string;
  discriminator?: string;
  avatar?: string;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon?: string;
  permissions?: string;
  features?: string[];
}

export interface DiscordGuildMember {
  id: string;
  username: string;
  discriminator?: string;
  avatar?: string;
  nickname?: string;
  roles: string[];
  joinedAt: string;
}

export interface BulkProgress {
  current: number;
  total: number;
  inProgress: boolean;
}
