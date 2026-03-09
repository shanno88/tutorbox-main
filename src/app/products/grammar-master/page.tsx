"use client";

import { useState } from "react";
import Link from "next/link";

type AccessStatus = "idle" | "loading" | "expired" | "unauthenticated";

function TrialExpiredNotice() {
  return (
    <div className="mx-auto mt-6 mb-6 max-w-xl rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-2 text-red-900">语法大师试用已结束</h2>
      <p className="text-sm text-gray-700 mb-3">
        你的 7 天免费试用已经用完。升级为语法大师 Pro 版后，你可以继续无限次使用语法大师的所有功能。
      </p>
      <ul className="list-disc pl-5 text-sm text-gray-700 mb-4 space-y-1">
        <li>无限次语法纠错与详细讲解</li>
        <li>复杂句子成分拆解（主谓宾、定状补等）与中文解释</li>
        <li>更地道、更清晰的改写建议</li>
        <li>适用于考试和工作写作的长期精修</li>
      </ul>
      <div className="flex gap-3 mb-3">
        <a
          href="/zh#grammar-master-pricing"
          className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        >
          立即升级 Pro
        </a>
        <button
          type="button"
          onClick={() => (window.location.href = "/zh")}
          className="text-sm text-gray-500 underline underline-offset-4 hover:text-gray-700"
        >
          稍后再说
        </button>
      </div>
      <p className="text-xs text-gray-500">
        升级确认和发票会发送到你的邮箱。如果几分钟内没看到，请检查垃圾邮箱或广告邮件，并将{" "}
        <span className="font-mono">noreply@tutorbox.cc</span> 加入联系人或标记为"非垃圾邮件"。
      </p>
    </div>
  );
}

export default function GrammarMasterProductPage() {
  const [status, setStatus] = useState<AccessStatus>("idle");
  const [statusImage, setStatusImage] = useState<string | null>(null);

  async function handleStartGrammarMaster() {
    setStatus("loading");
    try {
      const res = await fetch("/api/grammar/access", { method: "GET" });

      if (res.status === 200) {
        window.location.href = "https://gm.tutorbox.cc";
        return;
      }

      if (res.status === 401) {
        setStatus("unauthenticated");
        return;
      }

      if (res.status === 403) {
        setStatus("expired");
        return;
      }

      setStatus("idle");
    } catch {
      setStatus("idle");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold mb-4">语法大师 Grammar Master</h1>

      <p className="text-gray-700 mb-4">
        专为已经有一定基础、想系统提升语法表达的中文母语者设计的英语语法教练。
      </p>
      <p className="text-gray-700 mb-2">
        它会把你写的句子成分拆开讲，标注主谓宾、定状补等语法成分，并逐一解释每一部分在句子中的作用。
      </p>
      <p className="text-sm text-red-500 mb-6">
        你可以输入任何自己写的英文句子，让语法大师自动分析句子结构并讲解每一部分的作用。
      </p>

      {status === "expired" && <TrialExpiredNotice />}

      {/* 试用与价格 + 按钮放在更靠上位置 */}
      {status === "expired" && <TrialExpiredNotice />}

      {/* 试用与价格 + 按钮放在更靠上位置 */}
      <section className="mb-6 text-sm text-gray-700">
        <h2 className="text-lg font-medium mb-2">试用与价格</h2>
        <p className="mb-1">
          现在注册即可获得 <span className="font-semibold">7 天语法大师免费试用</span>。
        </p>
        <p className="mb-1">
          试用期内，你可以<span className="font-semibold">不限次数</span>提交句子，获得完整的句子成分分析和改写建议。
        </p>
        <p className="mb-3">
          试用结束后，你可以一次性升级为语法大师 Pro 版，
          <span className="font-semibold"> 199 元人民币（或 49 美元）买断一年，一次付清</span>，无自动续费。
        </p>

        <button
          onClick={handleStartGrammarMaster}
          disabled={status === "loading"}
          className="inline-flex items-center justify-center rounded-md bg-black px-6 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {status === "loading" ? "正在检查权限…" : "开始使用语法大师"}
        </button>

        {status === "unauthenticated" && (
          <p className="mt-3 text-sm text-red-500">
            请先登录后再使用语法大师。你可以返回{" "}
            <Link href="/zh" className="underline underline-offset-4">
              首页
            </Link>{" "}
            通过邮箱登录。
          </p>
        )}

        <p className="mt-3 text-xs text-gray-500">
          登录链接和支付确认会发送到你的邮箱。如果几分钟内没有看到，请检查
          <span className="font-semibold">垃圾邮箱</span>或推广邮件，
          并将 <span className="font-mono">noreply@tutorbox.cc</span> 加入联系人或标记为"非垃圾邮件"。
        </p>
      </section>

      {/* 三大核心功能展示（可点击放大） */}
      <section className="mb-8 space-y-8 max-w-xl mx-auto">
        {/* 成分分析 */}
        <div>
          <h2 className="text-lg font-medium mb-2">成分分析：一句句拆开讲明白</h2>
          <p className="text-sm text-gray-700 mb-3">
            自动提取每个句子中的语法成分，并用通俗易懂的中文详细说明每一部分的含义和功能。
          </p>
          <button
            type="button"
            onClick={() => setStatusImage("/grammar-components.png")}
            className="block w-full"
          >
            <img
              src="/grammar-components.png"
              alt="语法大师句子成分分析示例"
              className="w-full max-h-[260px] rounded-lg border border-gray-200 shadow-sm object-contain bg-white cursor-zoom-in"
            />
          </button>
        </div>

        {/* 智能纠错 */}
        <div>
          <h2 className="text-lg font-medium mb-2">智能纠错：发现错误，给出更好的表达</h2>
          <p className="text-sm text-gray-700 mb-3">
            指出语法错误和别扭表达，并给出更地道、更清晰的改写版本，帮你一步步修正到更自然的英文。
          </p>
          <button
            type="button"
            onClick={() => setStatusImage("/grammar-correction.png")}
            className="block w-full"
          >
            <img
              src="/grammar-correction.png"
              alt="语法大师智能纠错与改写示例"
              className="w-full max-h-[260px] rounded-lg border border-gray-200 shadow-sm object-contain bg-white cursor-zoom-in"
            />
          </button>
        </div>

        {/* 高考句典 / 考试句典 */}
        <div>
          <h2 className="text-lg font-medium mb-2">高考句典：从真题句子里学语法</h2>
          <p className="text-sm text-gray-700 mb-3">
            内置大量考试与真题语料，适合高考、四级、六级、考研写作，以及工作邮件、汇报材料等场景，从真实句子里拆解语法结构。
          </p>
          <button
            type="button"
            onClick={() => setStatusImage("/grammar-gaokao.png")}
            className="block w-full"
          >
            <img
              src="/grammar-gaokao.png"
      </section>

      {/* 图片放大预览层 */}
      </section>

      {/* 图片放大预览层 */}
      {statusImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setStatusImage(null)}
        >
          <div className="max-w-4xl max-h-[90vh] px-4">
            <img
              src={statusImage}
              alt="语法大师功能大图预览"
              className="w-full h-full object-contain rounded-lg shadow-lg bg-white"
            />
          </div>
        </div>
      )}
    </main>
  );
}
