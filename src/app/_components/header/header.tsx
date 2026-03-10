import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SignedIn } from "@/components/auth/signed-in";
import { SignedOut } from "@/components/auth/signed-out";
import { PaddleUpgradeButton } from "@/components/paddle/upgrade-button";
import { Unsubscribed } from "@/components/auth/subscription-status";
import { LogOut } from "lucide-react";
import { getSSRSession } from "@/lib/get-server-session";
import { ModeToggle } from "../mode-toggle";
import FeedbackButton from "./feedback";
import { LocaleSwitcher } from "./locale-switcher";
import { Links } from "./links";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

export async function Header() {
  const { user } = await getSSRSession();
  const t = await getTranslations("header");

  return (
    <div className="border-b py-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex gap-8 items-center">
          <Link href="/" className="flex gap-2 items-center text-xl">
            <span className="font-bold">
              Shanno <span className="text-primary">Studio</span>
            </span>
          </Link>

          <Links />
        </div>

        <div className="flex items-center gap-2">
          {/* Left side: Utility controls */}
          <div className="flex items-center gap-2 mr-2">
            <Unsubscribed>
              <PaddleUpgradeButton />
            </Unsubscribed>

            <FeedbackButton />

            <ModeToggle />

            <LocaleSwitcher />
          </div>

          {/* Right side: Account controls - visually separated */}
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <SignedIn>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user?.image || undefined} />
                      <AvatarFallback className="text-xs">
                        {user?.email?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm max-w-[120px] truncate">
                      {user?.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link
                      href="/api/auth/signout?callbackUrl=/"
                      className="flex gap-2 items-center cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> {t("signOut")}
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SignedIn>

            <SignedOut>
              <Button asChild size="sm">
                <Link href="/en/login">{t("signIn")}</Link>
              </Button>
            </SignedOut>
          </div>
        </div>
      </div>
    </div>
  );
}
