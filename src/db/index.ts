import * as schema from "./schema";
import { PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var -- only var works here
  var db: PostgresJsDatabase<typeof schema> | undefined;
}

let db: PostgresJsDatabase<typeof schema>;

if (!global.db) {
  // 先写死连接串，后面再改回 env
  const databaseUrl =
    "postgresql://postgres:lW730208@localhost:5432/tutorbox_auth_dev";

  console.log("DB URL hardcoded:", databaseUrl);

  const client = postgres(databaseUrl);
  db = drizzle(client, { schema });
  global.db = db;
} else {
  db = global.db;
}

export { db };
export * from "./schema";
