// scripts/run-migration.ts
import { readFileSync } from "fs";
import { Client } from "pg";

async function main() {
  const sql = readFileSync("drizzle/0001_gorgeous_dagger.sql", "utf8");

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  await client.query(sql);
  await client.end();

  console.log("Migration applied");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
