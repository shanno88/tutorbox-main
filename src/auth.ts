// @ts-nocheck
// src/auth.ts
import { prisma } from "@/prisma";

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
