"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";

import type { FooterPlatform } from "./footer-social-icon";
import { FooterSocialIcon } from "./footer-social-icon";
import styles from "./footer-social-links.module.css";

type FooterSocialLinksProps = {
  platforms: FooterPlatform[];
  wechatQrSrc: string;
  wechatLabel: string;
};

export function FooterSocialLinks({
  platforms,
  wechatQrSrc,
  wechatLabel,
}: FooterSocialLinksProps) {
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
      <div className={styles.socials}>
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
                className={styles.socialButton}
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
                className={styles.socialButton}
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
              className={styles.socialButton}
            >
              <FooterSocialIcon platform={platform.key} />
            </span>
          );
        })}
      </div>

      {isWechatOpen ? (
        <div className={styles.backdrop} onClick={() => setIsWechatOpen(false)}>
          <div
            id={dialogId}
            role="dialog"
            aria-modal="true"
            aria-label="微信二维码"
            onClick={(event) => event.stopPropagation()}
            className={styles.panel}
          >
            <div className={styles.panelHeader}>
              <div className={styles.title}>
                <p>微信</p>
                <p>WeChat QR</p>
              </div>
              <button
                type="button"
                onClick={() => setIsWechatOpen(false)}
                className={styles.close}
              >
                关闭
              </button>
            </div>
            <div className={styles.qr}>
              <Image
                src={wechatQrSrc}
                alt="竹瑾居微信二维码"
                width={720}
                height={960}
                unoptimized
                priority={false}
              />
            </div>
            <p className={styles.description}>
              扫描二维码即可添加微信，账号显示为“{wechatLabel}”。 Scan the code
              to add Zhu Jin Ju on WeChat.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
