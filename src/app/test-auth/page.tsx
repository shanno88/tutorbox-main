"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, FormEvent } from "react";

export default function TestAuthPage() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">加载中...</p>
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
        <div className="rounded-lg border bg-card p-8 shadow-sm">
          <h1 className="mb-6 text-2xl font-bold">登录成功</h1>
          
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
              <AvatarFallback>
                {session.user.name?.charAt(0) || session.user.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center">
              {session.user.name && (
                <p className="text-lg font-semibold">{session.user.name}</p>
              )}
              <p className="text-sm text-muted-foreground">{session.user.email}</p>
            </div>

            <Button 
              onClick={() => signOut()} 
              variant="outline"
              className="mt-4"
            >
              退出登录
            </Button>
          </div>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn("email", {
        email: email.trim(),
        redirect: false,
      });
      setEmailSent(true);
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
        <div className="rounded-lg border bg-card p-8 shadow-sm">
          <h1 className="mb-6 text-2xl font-bold">查看您的邮箱</h1>
          <p className="text-muted-foreground">登录链接已发送到 {email}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="rounded-lg border bg-card p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold">测试邮箱登录</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="w-full px-4 py-2 border rounded"
          />
          <Button 
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "发送中..." : "发送登录链接"}
          </Button>
        </form>

        {/* Google sign-in removed - using email magic links only */}
        {/*
        <Button 
          onClick={() => signIn("google")}
          className="w-full"
        >
          用 Google 登录
        </Button>
        */}
      </div>
    </div>
  );
}
