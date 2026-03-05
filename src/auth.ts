// @ts-nocheck
// src/auth.ts
import { prisma } from "@/prisma";

export async function onUserLogin(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return await prisma.user.create({
      data: {
        email,
      },
    });
  }

  return user;
}
