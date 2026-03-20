import {
  timestamp,
  pgTable,
  text,
  serial,
  varchar,
  primaryKey,
  integer,
  date,
  boolean,
  uuid,
  unique,
  time,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "@auth/core/adapters";
import { sql } from "drizzle-orm";
//import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const plans = pgTable('plans', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),      // 例如 'grammar-master-yearly'
  name: text('name').notNull(),
  rateLimitPerMin: integer('rate_limit_per_min').notNull().default(60),
  quotaPerMonth: integer('quota_per_month').notNull().default(100000),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  userId: text('user_id')                     // 看你 User 表的主键类型，如果是 text 就用 text
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  planId: integer('plan_id')
    .notNull()
    .references(() => plans.id, { onDelete: 'restrict' }),
  keyHash: text('key_hash').notNull().unique(),
  status: text('status').notNull().default('active'), // 'active' | 'revoked'
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
// 已有的 users 导入保持不变
// import { users } from './schema';
/**
 * NEXT-AUTH TABLES
 */
export const users = pgTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    primaryKey: [account.provider, account.providerAccountId],
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    primaryKey: [vt.identifier, vt.token],
  })
);

/**
 * APP SPECIFIC TABLES
 */

export const todos = pgTable("todo", {
  id: uuid("id")
    .notNull()
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  text: varchar("text").notNull(),
  isCompleted: boolean("isCompleted").notNull().default(false),
  createdAt: time("createdAt")
    .notNull()
    .default(sql`now()`),
});

export const subscriptions = pgTable("subscriptions", {
  userId: text("userId")
    .notNull()
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  paddleSubscriptionId: text("paddleSubscriptionId").notNull(),
  paddleCustomerId: text("paddleCustomerId").notNull(),
  paddlePriceId: text("paddlePriceId").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd", {
    mode: "date",
  }).notNull(),
});

export type Todo = typeof todos.$inferSelect;

// src/db/schema.ts （末尾追加）
//import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const productGrants = pgTable("product_grant", {
  id:            text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:        text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  productKey:    text("productKey").notNull(),   // "thinker-ai" | "flowforge" | "webpilot"
  type:          text("type").notNull(),          // "trial" | "paid" | "gift"
  status:        text("status").notNull().default("active"),        // "active" | "expired"
  trialStartsAt: timestamp("trialStartsAt"),
  trialEndsAt:   timestamp("trialEndsAt"),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
});


export const apiUsage = pgTable(
  "api_usage",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    apiKeyId: integer("api_key_id")
      .notNull()
      .references(() => apiKeys.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    used: integer("used").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniqueKey: unique("api_usage_unique_key").on(
      table.userId,
      table.apiKeyId,
      table.year,
      table.month
    ),
  })
);
