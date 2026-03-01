import { env } from "@/env";
import * as schema from "./schema";
import { PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var -- only var works here
  var db: PostgresJsDatabase<typeof schema> | undefined;
}

let db: PostgresJsDatabase<typeof schema>;

const databaseUrl = env.DATABASE_URL ?? "postgresql://postgres:example@localhost:5432/postgres";

if (env.NODE_ENV === "production") {
  db = drizzle(postgres(databaseUrl), { schema });
} else {
  if (!global.db) {
    global.db = drizzle(postgres(databaseUrl), { schema });
  }
  db = global.db;
}

export { db };
export * from "./schema";
