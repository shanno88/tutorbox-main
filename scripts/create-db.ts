// scripts/create-db.ts
import { Client } from "pg";

async function main() {
  // 连接到默认 postgres 库，用超级用户创建新库
  const client = new Client({
    connectionString: "postgresql://postgres:lW730208@localhost:5432/postgres",
  });

  await client.connect();
  await client.query('CREATE DATABASE "tutorbox_auth_dev"');
  await client.end();

  console.log('Database tutorbox_auth_dev created');
}

main().catch((err) => {
  console.error("Create DB failed", err);
  process.exit(1);
});
