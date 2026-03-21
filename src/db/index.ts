<<<<<<< HEAD
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
=======
import { env } from "@/env";
import * as schema from "./schema";
import { PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var -- only var works here
  var db: PostgresJsDatabase<typeof schema> | undefined;
}

let db: PostgresJsDatabase<typeof schema>;

if (env.NODE_ENV === "production") {
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  db = drizzle(postgres(databaseUrl), { schema });
} else {
  db = new Proxy(
    {},
    {
      get() {
        throw new Error(
          "Drizzle/Postgres is disabled in development. Use Prisma + SQLite (DATABASE_URL=file:./dev.db) instead."
        );
      },
    }
  ) as unknown as PostgresJsDatabase<typeof schema>;
}

export { db };
export * from "./schema";
>>>>>>> origin/main
