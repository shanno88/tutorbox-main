import { Client } from "pg";

async function main() {
  const client = new Client({
    connectionString:
      "postgresql://postgres:lW730208@localhost:5432/tutorbox_auth_dev",
  });

  await client.connect();

  await client.query(`
    INSERT INTO "user"(id, name, email)
    VALUES ('test-user-1', 'Test User', 'test@example.com')
    ON CONFLICT (id) DO NOTHING;
  `);

  await client.end();
  console.log("seeded user test-user-1");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
