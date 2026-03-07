// src/lib/auth.ts
import { prisma } from "@/prisma";
import { env } from "@/env";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { AuthOptions, DefaultSession } from "next-auth";
import { Adapter } from "next-auth/adapters";
import EmailProvider from "next-auth/providers/email";
import { Resend } from "resend";

// Google OAuth removed - using email magic links only
// import GoogleProvider from "next-auth/providers/google";
// import CredentialsProvider from "next-auth/providers/credentials";

 declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

// Google OAuth removed - using email magic links via Resend only
// const hasGoogleAuth = env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET;

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendVerificationRequest({
  identifier: email,
  url,
}: {
  identifier: string;
  url: string;
  baseUrl?: string;
  token?: string;
}) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "noreply@tutorbox.cc",
    to: email,
    subject: "Sign in to Tutorbox",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 16px;">Sign in to Tutorbox</h2>
        <p style="color: #555; margin-bottom: 24px;">Click the button below to sign in. This link expires in 24 hours.</p>
        <a href="${url}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
          Sign in
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">If you did not request this email, you can safely ignore it.</p>
      </div>
    `,
  });
}

// Dev email provider removed - using real email magic links only in all environments
/*
const devEmailProvider = CredentialsProvider({
  id: "dev-email",
  name: "Dev Email Login",
  credentials: {
    email: { label: "Email", type: "email" },
  },
  async authorize(credentials) {
    const email = credentials?.email;
    if (!email) return null;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    return user;
  },
});
*/

// Simplified: Only email magic links via Resend
const providers = [
  EmailProvider({
    server: "",
    from: process.env.EMAIL_FROM ?? "noreply@tutorbox.cc",
    sendVerificationRequest,
  }),
];

export const authConfig = {
  adapter: PrismaAdapter(prisma) as Adapter,
  secret: env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers,
  pages: {
    signIn: "/en/login",
  },
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
      const dbUser = await prisma.user.findUnique({
        where: { email: token.email! },
      });

      if (!dbUser) return token; // 不抛错，直接返回原 token

      token.id = dbUser.id;
      token.email = dbUser.email;

      if ("name" in dbUser) {
        token.name = (dbUser as any).name;
      }

      if ("image" in dbUser) {
        token.picture = (dbUser as any).image;
      }
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
