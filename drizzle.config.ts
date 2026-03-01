import { env } from "@/env";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  driver: "pg",
  dbCredentials: {
    connectionString: env.DATABASE_URL ?? "postgresql://postgres:example@localhost:5432/postgres",
  },
  verbose: true,
  strict: true,
});
