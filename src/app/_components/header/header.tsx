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

        <div className="flex justify-between gap-4">
          <Unsubscribed>
            <PaddleUpgradeButton />
          </Unsubscribed>

          <FeedbackButton />

          <ModeToggle />

          <LocaleSwitcher />

          <SignedIn>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Avatar>
                  <AvatarImage src={user?.image || undefined} />
                  <AvatarFallback>{t("avatarFallback")}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Link
                    href="/api/auth/signout?callbackUrl=/"
                    className="flex gap-2 items-center"
                  >
                    <LogOut className="w-4 h-4" /> {t("signOut")}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SignedIn>

          <SignedOut>
            <Button asChild>
              <Link href="/zh/login">{t("signIn")}</Link>
            </Button>
          </SignedOut>
        </div>
      </div>
    </div>
  );
}
