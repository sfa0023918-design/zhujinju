"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

import { getPreviousInternalRoute, markBackTarget } from "./internal-route-history";

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

function getInternalReferrerRoute() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawReferrer = document.referrer?.trim();

  if (!rawReferrer) {
    return null;
  }

  try {
    const referrerUrl = new URL(rawReferrer);

    if (referrerUrl.origin !== window.location.origin) {
      return null;
    }

    const candidate = `${referrerUrl.pathname}${referrerUrl.search}${referrerUrl.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    return candidate && candidate !== current ? candidate : null;
  } catch {
    return null;
  }
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

        const previousInternalRoute = getPreviousInternalRoute() ?? getInternalReferrerRoute();
        const historyState = typeof window !== "undefined" ? (window.history.state as { idx?: number } | null) : null;
        const canUseBrowserBack =
          typeof historyState?.idx === "number" ? historyState.idx > 0 : window.history.length > 1;

        if (canUseBrowserBack) {
          if (previousInternalRoute) {
            markBackTarget(previousInternalRoute);
          }
          router.back();
          return;
        }

        if (previousInternalRoute) {
          markBackTarget(previousInternalRoute);
          router.push(previousInternalRoute);
          return;
        }

        router.push(fallbackHref);
      }}
    >
      {children}
    </Link>
  );
}
