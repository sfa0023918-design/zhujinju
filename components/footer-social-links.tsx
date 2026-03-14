"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";

import type { FooterPlatform } from "./footer-social-icon";
import { FooterSocialIcon } from "./footer-social-icon";

type FooterSocialLinksProps = {
  platforms: FooterPlatform[];
  wechatQrSrc: string;
};

export function FooterSocialLinks({ platforms, wechatQrSrc }: FooterSocialLinksProps) {
  const [isWechatOpen, setIsWechatOpen] = useState(false);
  const dialogId = useId();

  useEffect(() => {
    if (!isWechatOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsWechatOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isWechatOpen]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3.5 pt-1">
        {platforms.map((platform) => {
          if (platform.key === "wechat") {
            return (
              <button
                key={platform.key}
                type="button"
                aria-label={platform.label}
                aria-controls={dialogId}
                aria-expanded={isWechatOpen}
                title={platform.label}
                onClick={() => setIsWechatOpen(true)}
                className="inline-flex h-7 w-7 items-center justify-center transition-colors hover:text-[var(--ink)]"
              >
                <FooterSocialIcon platform={platform.key} />
              </button>
            );
          }

          if (platform.href) {
            return (
              <a
                key={platform.key}
                href={platform.href}
                target="_blank"
                rel="noreferrer"
                aria-label={platform.label}
                title={platform.label}
                className="inline-flex h-7 w-7 items-center justify-center transition-colors hover:text-[var(--ink)]"
              >
                <FooterSocialIcon platform={platform.key} />
              </a>
            );
          }

          return (
            <span
              key={platform.key}
              aria-label={platform.label}
              title={platform.label}
              className="inline-flex h-7 w-7 items-center justify-center"
            >
              <FooterSocialIcon platform={platform.key} />
            </span>
          );
        })}
      </div>

      {isWechatOpen ? (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-[rgba(12,10,8,0.76)] px-4 py-6 backdrop-blur-[2px]"
          onClick={() => setIsWechatOpen(false)}
        >
          <div
            id={dialogId}
            role="dialog"
            aria-modal="true"
            aria-label="微信二维码"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[28rem] border border-[var(--line)] bg-[var(--surface)] p-4 text-[var(--ink)] shadow-[0_20px_80px_rgba(0,0,0,0.24)] md:p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[0.88rem] tracking-[0.14em]">微信</p>
                <p className="text-[0.7rem] uppercase tracking-[0.14em] text-[var(--muted)]">WeChat QR</p>
              </div>
              <button
                type="button"
                onClick={() => setIsWechatOpen(false)}
                className="text-[0.75rem] tracking-[0.12em] text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
              >
                关闭
              </button>
            </div>
            <div className="border border-[var(--line)]/78 bg-[var(--surface-2)] p-2">
              <Image
                src={wechatQrSrc}
                alt="竹瑾居微信二维码"
                width={720}
                height={960}
                className="h-auto w-full object-contain"
                priority={false}
              />
            </div>
            <p className="mt-3 text-[0.78rem] leading-[1.7] text-[var(--muted)]">
              扫描二维码即可添加微信。 Scan the code to add Zhu Jin Ju on WeChat.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
