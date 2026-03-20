import { Client } from "pg";

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  await client.query(`
    INSERT INTO "plans"(slug, name)
    VALUES ('test-plan', 'Test Plan')
    ON CONFLICT (slug) DO NOTHING;
  `);
  await client.end();
  console.log("seeded");
}

main().catch(console.error);
