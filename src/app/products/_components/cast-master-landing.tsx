"use client";

import { useEffect, useState } from "react";
import { CastMasterAccessCta } from "./cast-master-access-cta";

type Screenshot = {
  src: string;
  alt: string;
};

const screenshots: Screenshot[] = [
  {
    src: "/images/products/cast-master/screenshot-1.png",
    alt: "播感大师主编辑器界面：双栏布局（脚本与标注）",
  },
  {
    src: "/images/products/cast-master/screenshot-2.png",
    alt: "自定义卖货逻辑弹窗界面",
  },
  {
    src: "/images/products/cast-master/screenshot-3.png",
    alt: "自定义短视频逻辑弹窗界面",
  },
  {
    src: "/images/products/cast-master/screenshot-4.png",
    alt: "自定义卖课逻辑弹窗界面",
  },
];

function ScreenshotImage({
  screenshot,
  onClick,
}: {
  screenshot: Screenshot;
  onClick: () => void;
}) {
  return (
    <img
      src={screenshot.src}
      alt={screenshot.alt}
      onClick={onClick}
      className="w-full rounded-xl shadow-sm ring-1 ring-black/5 cursor-pointer"
      loading="lazy"
    />
  );
}

export function CastMasterLanding() {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxSrc(null);
    }

    if (lightboxSrc) {
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [lightboxSrc]);

  return (
    <main className="bg-white">
      <section className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
              已上线 · 7 天免费试用
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
              Cast Master · 播感大师
            </h1>

            <p className="mt-4 text-lg text-gray-600 md:text-xl">
              短视频创作者的 AI 助手 — 从脚本到上镜，一气呵成
            </p>

            <div className="mt-8">
              <CastMasterAccessCta />
              <p className="mt-3 text-sm text-gray-500">免费试用 7 天，无需信用卡</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="text-2xl">🎬</div>
              <div className="mt-3 font-bold text-gray-900">AI 脚本生成</div>
              <div className="mt-2 text-sm leading-6 text-gray-600">
                输入产品名或课程名，一键生成卖货、卖课、短视频话术，支持 10 种短视频公式
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="text-2xl">✍️</div>
              <div className="mt-3 font-bold text-gray-900">AI 播感标注</div>
              <div className="mt-2 text-sm leading-6 text-gray-600">
                自动标注重点、停顿、语调，让每句话抓住观众注意力
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="text-2xl">📤</div>
              <div className="mt-3 font-bold text-gray-900">多格式导出</div>
              <div className="mt-2 text-sm leading-6 text-gray-600">
                导出 Word、SRT 字幕、Kling AI JSON，无缝接入剪辑流程
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="container mx-auto px-4 py-14 md:py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
              真实界面，所见即所得
            </h2>

            <div className="mt-8">
              <div className="mx-auto max-w-4xl">
                <ScreenshotImage
                  screenshot={screenshots[0]}
                  onClick={() => setLightboxSrc(screenshots[0].src)}
                />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                {screenshots.slice(1).map((s) => (
                  <ScreenshotImage
                    key={s.src}
                    screenshot={s}
                    onClick={() => setLightboxSrc(s.src)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {lightboxSrc && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setLightboxSrc(null)}
          >
            <img
              src={lightboxSrc}
              alt="截图预览"
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </section>

      <section className="border-t border-gray-100 bg-gray-50">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5 md:p-10">
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
              立即开始 7 天免费试用
            </h2>
            <p className="mt-3 text-gray-600">
              体验完整功能，到期后按需选择套餐，随时可取消
            </p>

            <div className="mt-7">
              <CastMasterAccessCta />
              <p className="mt-3 text-sm text-gray-500">免费试用 7 天，无需信用卡</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
