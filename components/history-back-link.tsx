"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

type HistoryBackLinkProps = {
  fallbackHref: string;
  className?: string;
  children: ReactNode;
};

function shouldBypassClientBack(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

export function HistoryBackLink({
  fallbackHref,
  className,
  children,
}: HistoryBackLinkProps) {
  const router = useRouter();

  return (
    <Link
      href={fallbackHref}
      className={className}
      onClick={(event) => {
        if (shouldBypassClientBack(event)) {
          return;
        }

        event.preventDefault();

        const hasHistory = typeof window !== "undefined" && window.history.length > 1;
        const referrer = typeof document !== "undefined" ? document.referrer : "";

        let isSameOriginReferrer = false;
        if (typeof window !== "undefined" && referrer) {
          try {
            isSameOriginReferrer = new URL(referrer).origin === window.location.origin;
          } catch {
            isSameOriginReferrer = false;
          }
        }

        if (hasHistory && isSameOriginReferrer) {
          router.back();
          return;
        }

        router.push(fallbackHref);
      }}
    >
      {children}
    </Link>
  );
}
