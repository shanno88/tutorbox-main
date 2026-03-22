// scripts/init-auth-db.ts
import { Client } from "pg";

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  // 1. user 表（按你 schema.ts）
  await client.query(`
    CREATE TABLE IF NOT EXISTS "user" (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT NOT NULL,
      "emailVerified" TIMESTAMP,
      image TEXT
    );
  `);

  // 2. plans 表
  await client.query(`
    CREATE TABLE IF NOT EXISTS "plans" (
      id SERIAL PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      rate_limit_per_min INTEGER NOT NULL DEFAULT 60,
      quota_per_month INTEGER NOT NULL DEFAULT 100000,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // 3. api_keys 表
  await client.query(`
    CREATE TABLE IF NOT EXISTS "api_keys" (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan_id INTEGER NOT NULL,
      key_hash TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active',
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT api_keys_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
      CONSTRAINT api_keys_plan_id_fkey
        FOREIGN KEY (plan_id) REFERENCES "plans"(id) ON DELETE RESTRICT
    );
  `);

  await client.end();
  console.log("auth tables ready");
}

main().catch((err) => {
  console.error("init-auth-db failed", err);
  process.exit(1);
});
