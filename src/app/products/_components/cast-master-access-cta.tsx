"use client";

import { useState } from "react";

type AccessResponse =
  | { ok: true; code: "OK"; entryUrl?: string }
  | { ok: false; code: string; message?: string; upgradeUrl?: string };

export function CastMasterAccessCta() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/teleprompter/access", { method: "GET" });
      const data = (await res.json().catch(() => null)) as AccessResponse | null;

      if (res.status === 200 && data && "ok" in data && data.ok) {
        window.location.href = data.entryUrl ?? "https://tl.tutorbox.cc/";
        return;
      }

      if (res.status === 401 && data && !data.ok && data.code === "NOT_AUTHENTICATED") {
        alert("请先登录后再使用播感大师。你可以返回首页通过邮箱登录。");
        window.location.href = "https://tutorbox.cc/zh";
        return;
      }

      // trial expired or other errors
      if (data && !data.ok && data.message) {
        alert(data.message);
        return;
      }

      alert("暂时无法验证权限，请稍后重试。");
    } catch {
      alert("暂时无法验证权限，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center justify-center rounded-md bg-black px-6 py-2.5 text-sm font-medium text-white disabled:opacity-60 font-bold text-base mt-4"
    >
      {loading ? "正在检查权限…" : "开始使用播感大师"}
    </button>
  );
}
