import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function deleteUser(userId: string) {
  if (process.env.NODE_ENV !== "production") {
    throw new Error(
      "User deletion is disabled in development (Drizzle/Postgres is disabled)"
    );
  }

  await db.delete(users).where(eq(users.id, userId));
}
