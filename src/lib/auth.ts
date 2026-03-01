import { db } from "@/db";
import { env } from "@/env";
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

const hasGoogleAuth =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET;

const providers = hasGoogleAuth
  ? [
      GoogleProvider({
        clientId: env.GOOGLE_CLIENT_ID!,
        clientSecret: env.GOOGLE_CLIENT_SECRET!,
      }),
    ]
  : [
      CredentialsProvider({
        id: "placeholder",
        name: "Placeholder",
        credentials: {},
        async authorize() {
          return null;
        },
      }),
    ];

if (!hasGoogleAuth && process.env.NODE_ENV === "production") {
  console.warn(
    "[auth] Google OAuth not configured (GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET). Sign-in disabled."
  );
}

export const authConfig = {
  adapter: DrizzleAdapter(db) as Adapter,
  session: {
    strategy: "jwt",
  },
  providers,
  callbacks: {
    async jwt({ token }) {
      const dbUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, token.email!),
      });

      if (!dbUser) {
        throw new Error("no user with email found");
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
      };
    },
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
      }

      return session;
    },
  },
} satisfies AuthOptions;
