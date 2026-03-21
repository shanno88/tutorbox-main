import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth";
import { onUserLogin } from "@/auth";

const handler = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile, email, credentials }) {
      if (user?.email) {
        // Only email provider supported now (Google removed)
        if (account?.provider === "email") {
          await onUserLogin(user.email);
        }
      }

      return true;
    },
  },
});

export { handler as GET, handler as POST };
