"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

import { getCurrentInternalRouteEntry, markBackTarget } from "./internal-route-history";

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

        const historyEntry = getCurrentInternalRouteEntry();
        const previousInternalRoute = historyEntry?.previousInternalRoute ?? null;

        if (!previousInternalRoute) {
          router.push(fallbackHref);
          return;
        }

        if (historyEntry?.clientNavigation) {
          markBackTarget(previousInternalRoute);
          router.back();
          return;
        }

        markBackTarget(previousInternalRoute);
        router.push(previousInternalRoute);
      }}
    >
      {children}
    </Link>
  );
}
