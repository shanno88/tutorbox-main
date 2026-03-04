// @ts-nocheck
// src/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/prisma";
import { env } from "@/env";

const TRIAL_DAYS = 7;

export async function onUserLogin(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const now = new Date();
    return await prisma.user.create({
      data: {
        email,
        trialStartedAt: now,
        plan: "TRIAL",
      },
    });
  }

  return user;
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },

  providers: [
    Credentials({
      name: "Email only",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        if (!email) return null;

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({
            data: { email },
          });
        }
        return user;
      },
    }),
  ],

  secret: env.NEXTAUTH_SECRET,
});
