import { db } from "@/db";
import { users } from "@/db/schema";
import { ilike, or } from "drizzle-orm";
import { checkAdminAuth } from "@/lib/admin-auth";
import { logInfo, logError } from "@/lib/billing/logger";
import { looksLikeEmail } from "@/lib/billing/admin-helpers";
import { withAdminLicense } from "@/lib/license";

/**
 * ADMIN ONLY: Search users by email or userId
 *
 * GET /api/admin/billing/search?q=<query>
 *
 * Query: email (partial, case-insensitive) or userId (prefix match)
 * Minimum 2 characters required.
 * Returns up to 10 results.
 *
 * Response: { users: [{ id, email, name, createdAt }] }
 */
async function handleGet(req: Request) {
  // ADMIN ONLY: Check admin auth
  if (!checkAdminAuth()) {
    logError("admin:billing:search", "Unauthorized access attempt");
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return Response.json({ users: [] });
  }

  try {
    logInfo("admin:billing:search", `Searching for: ${query}`);

    // Determine search type: email or userId
    const isEmail = looksLikeEmail(query);

    const results = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        createdAt: users.emailVerified, // Use emailVerified as proxy for account creation
      })
      .from(users)
      .where(
        isEmail
          ? ilike(users.email, `%${query}%`)
          : ilike(users.id, `${query}%`)
      )
      .limit(10);

    logInfo("admin:billing:search", `Found ${results.length} user(s)`, {
      query,
      isEmail,
    });

    return Response.json({
      users: results.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name || undefined,
        createdAt: u.createdAt?.toISOString() || new Date().toISOString(),
      })),
    });
  } catch (error) {
    logError("admin:billing:search", "Search failed", error);
    return Response.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}

export const GET = withAdminLicense(handleGet);
