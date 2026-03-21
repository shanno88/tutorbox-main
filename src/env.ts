<<<<<<< HEAD
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().optional(),
    NODE_ENV: z.string().optional(),
    // Google OAuth removed - no longer required
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    NEXTAUTH_SECRET: z.string().min(1).optional(),
    PADDLE_API_KEY: z.string().min(1).optional(),
    PADDLE_WEBHOOK_SECRET: z.string().min(1).optional(),
    HOSTNAME: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: z.string().optional(),
    NEXT_PUBLIC_PADDLE_PRICE_ID: z.string().optional(),
    NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY: z.string().optional(),
    NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD: z.string().optional(),
    NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD: z.string().optional(),
    NEXT_PUBLIC_PADDLE_PRICE_ID_PROMPTER_YEARLY_CNY: z.string().optional(),
    NEXT_PUBLIC_PADDLE_ENV: z.enum(["production", "sandbox"]).optional(),
    NEXT_PUBLIC_PROJECT_PLANNER_ID: z.string().optional(),
    NEXT_PUBLIC_SKIP_EVENTS: z.string().optional(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "dev-nextauth-secret",
    PADDLE_API_KEY: process.env.PADDLE_API_KEY,
    PADDLE_WEBHOOK_SECRET: process.env.PADDLE_WEBHOOK_SECRET,
    HOSTNAME: process.env.HOSTNAME ?? "http://localhost:3000",
    NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "",
    NEXT_PUBLIC_PADDLE_PRICE_ID: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID,
    NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY ?? "",
    NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD ?? "",
    NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD ?? "",
    NEXT_PUBLIC_PADDLE_PRICE_ID_PROMPTER_YEARLY_CNY: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_PROMPTER_YEARLY_CNY ?? "",
    NEXT_PUBLIC_PADDLE_ENV: process.env.NEXT_PUBLIC_PADDLE_ENV ?? "sandbox",
    NEXT_PUBLIC_PROJECT_PLANNER_ID: process.env.NEXT_PUBLIC_PROJECT_PLANNER_ID,
    NEXT_PUBLIC_SKIP_EVENTS: process.env.NEXT_PUBLIC_SKIP_EVENTS,
  },
});
=======
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().optional(),
    NODE_ENV: z.string().optional(),
    // Google OAuth removed - no longer required
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    NEXTAUTH_SECRET: z.string().min(1).optional(),
    PADDLE_API_KEY: z.string().min(1).optional(),
    PADDLE_WEBHOOK_SECRET: z.string().min(1).optional(),
    HOSTNAME: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: z.string().optional(),
    NEXT_PUBLIC_PADDLE_PRICE_ID: z.string().optional(),
    NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY: z.string().optional(),
    NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD: z.string().optional(),
    NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD: z.string().optional(),
    NEXT_PUBLIC_PADDLE_PRICE_ID_PROMPTER_YEARLY_CNY: z.string().optional(),
    NEXT_PUBLIC_PADDLE_ENV: z.enum(["production", "sandbox"]).optional(),
    NEXT_PUBLIC_PROJECT_PLANNER_ID: z.string().optional(),
    NEXT_PUBLIC_SKIP_EVENTS: z.string().optional(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "dev-nextauth-secret",
    PADDLE_API_KEY: process.env.PADDLE_API_KEY,
    PADDLE_WEBHOOK_SECRET: process.env.PADDLE_WEBHOOK_SECRET,
    HOSTNAME: process.env.HOSTNAME ?? "http://localhost:3000",
    NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "",
    NEXT_PUBLIC_PADDLE_PRICE_ID: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID,
    NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY ?? "",
    NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD ?? "",
    NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD ?? "",
    NEXT_PUBLIC_PADDLE_PRICE_ID_PROMPTER_YEARLY_CNY: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_PROMPTER_YEARLY_CNY ?? "",
    NEXT_PUBLIC_PADDLE_ENV: process.env.NEXT_PUBLIC_PADDLE_ENV ?? "sandbox",
    NEXT_PUBLIC_PROJECT_PLANNER_ID: process.env.NEXT_PUBLIC_PROJECT_PLANNER_ID,
    NEXT_PUBLIC_SKIP_EVENTS: process.env.NEXT_PUBLIC_SKIP_EVENTS,
  },
});
>>>>>>> origin/main
