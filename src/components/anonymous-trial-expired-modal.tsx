"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Mail } from "lucide-react";

interface AnonymousTrialExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
}

export function AnonymousTrialExpiredModal({
  isOpen,
  onClose,
  productName,
}: AnonymousTrialExpiredModalProps) {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleSignUp = () => {
    setIsRedirecting(true);
    // Redirect to login page with return URL
    router.push(`/en/login?redirect=${encodeURIComponent(window.location.pathname)}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <Clock className="h-6 w-6 text-orange-600" />
          </div>
          <DialogTitle className="text-center text-xl">
            Your 30-Minute Trial Has Ended
          </DialogTitle>
          <DialogDescription className="text-center space-y-3 pt-2">
            <p className="text-base">
              You've been using <span className="font-semibold">{productName}</span> for 30 minutes.
            </p>
            <p className="text-sm text-muted-foreground">
              To continue using {productName} and unlock full access, please sign up with your email
              to start a <span className="font-semibold">3-day free trial</span>.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
          <h4 className="font-semibold text-sm">What you'll get with a free account:</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>3-day full trial with unlimited access</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Access to both Grammar Master and Broadcast Master</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Save your work and access from any device</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>No credit card required</span>
            </li>
          </ul>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={handleSignUp}
            disabled={isRedirecting}
            className="w-full"
            size="lg"
          >
            <Mail className="mr-2 h-4 w-4" />
            {isRedirecting ? "Redirecting..." : "Sign Up with Email"}
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full"
            size="sm"
          >
            Maybe Later
          </Button>
        </DialogFooter>

        <p className="text-xs text-center text-muted-foreground">
          This is an issue on the partner's side, not with your account or device.
        </p>
      </DialogContent>
    </Dialog>
  );
}

// Bilingual version (Chinese)
export function AnonymousTrialExpiredModalCN({
  isOpen,
  onClose,
  productName,
}: AnonymousTrialExpiredModalProps) {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleSignUp = () => {
    setIsRedirecting(true);
    router.push(`/zh/login?redirect=${encodeURIComponent(window.location.pathname)}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <Clock className="h-6 w-6 text-orange-600" />
          </div>
          <DialogTitle className="text-center text-xl">
            30 分钟试用已结束
          </DialogTitle>
          <DialogDescription className="text-center space-y-3 pt-2">
            <p className="text-base">
              你已经使用 <span className="font-semibold">{productName}</span> 30 分钟了。
            </p>
            <p className="text-sm text-muted-foreground">
              继续使用 {productName} 并解锁完整功能，请用邮箱注册，
              开始 <span className="font-semibold">3 天免费试用</span>。
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
          <h4 className="font-semibold text-sm">注册后你将获得：</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>3 天完整试用，不限次数使用</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>同时使用语法大师和播感大师</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>保存你的工作，任何设备都能访问</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>无需信用卡</span>
            </li>
          </ul>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={handleSignUp}
            disabled={isRedirecting}
            className="w-full"
            size="lg"
          >
            <Mail className="mr-2 h-4 w-4" />
            {isRedirecting ? "跳转中..." : "用邮箱注册"}
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full"
            size="sm"
          >
            稍后再说
          </Button>
        </DialogFooter>

        <p className="text-xs text-center text-muted-foreground">
          注册链接会发送到你的邮箱，请检查垃圾邮件文件夹。
        </p>
      </DialogContent>
    </Dialog>
  );
}
