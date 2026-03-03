// src/lib/auth.ts
import { randomUUID } from "crypto";
import { db } from "@/db";
import { env } from "@/env";
import { users } from "@/db/schema";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { AuthOptions, DefaultSession } from "next-auth";
import { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

 declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

const hasGoogleAuth = env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET;

const devEmailProvider = CredentialsProvider({
  id: "dev-email",
  name: "Dev Email Login",
  credentials: {
    email: { label: "Email", type: "email" },
  },
  async authorize(credentials) {
    const email = credentials?.email;
    if (!email) return null;

    // 查找已有用户
    let user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, email),
    });

    // 没有就创建
    if (!user) {
      const inserted = await db
        .insert(users)
        .values({ id: randomUUID(), email, name: email })
        .returning();
      user = inserted[0];
    }

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image ?? null,
    };
  },
});

const providers = [
  devEmailProvider,
  ...(hasGoogleAuth
    ? [
        GoogleProvider({
          clientId: env.GOOGLE_CLIENT_ID!,
          clientSecret: env.GOOGLE_CLIENT_SECRET!,
        }),
      ]
    : []),
];

export const authConfig = {
  adapter: DrizzleAdapter(db) as Adapter,
  secret: env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      // 登录时 user 会传进来，直接用
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        return token;
      }

      // 后续请求从 DB 刷新
      const dbUser = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, token.email!),
      });

      if (!dbUser) return token; // 不抛错，直接返回原 token

      token.id = dbUser.id;
      token.name = dbUser.name;
      token.email = dbUser.email;
      token.picture = dbUser.image;
      return token;
    },
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
} satisfies AuthOptions;
