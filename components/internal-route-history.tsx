"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

const ROUTE_STACK_KEY = "zhujinju:route-stack";
const BACK_TARGET_KEY = "zhujinju:back-target";
const HISTORY_ENTRY_KEY = "zhujinju:internal-route-entry";

type InternalRouteEntry = {
  currentRoute: string;
  previousInternalRoute: string | null;
  clientNavigation: boolean;
};

function getCurrentRoute(pathname: string, searchParams: URLSearchParams | null) {
  const query = searchParams?.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function readRouteStack() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(ROUTE_STACK_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeRouteStack(stack: string[]) {
  window.sessionStorage.setItem(ROUTE_STACK_KEY, JSON.stringify(stack));
}

function getBrowserRoute() {
  return `${window.location.pathname}${window.location.search}`;
}

function isInternalRoute(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//");
}

function getInternalReferrerRoute(currentRoute: string) {
  const rawReferrer = document.referrer?.trim();

  if (!rawReferrer) {
    return null;
  }

  try {
    const referrerUrl = new URL(rawReferrer);

    if (referrerUrl.origin !== window.location.origin) {
      return null;
    }

    const candidate = `${referrerUrl.pathname}${referrerUrl.search}`;
    return candidate !== currentRoute && isInternalRoute(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

export function getCurrentInternalRouteEntry(): InternalRouteEntry | null {
  if (typeof window === "undefined") {
    return null;
  }

  const historyState = window.history.state;

  if (!historyState || typeof historyState !== "object") {
    return null;
  }

  const entry = (historyState as Record<string, unknown>)[HISTORY_ENTRY_KEY];

  if (!entry || typeof entry !== "object") {
    return null;
  }

  const candidate = entry as Partial<InternalRouteEntry>;
  const currentRoute = getBrowserRoute();

  if (
    candidate.currentRoute !== currentRoute ||
    !isInternalRoute(candidate.currentRoute) ||
    (candidate.previousInternalRoute !== null && !isInternalRoute(candidate.previousInternalRoute)) ||
    typeof candidate.clientNavigation !== "boolean"
  ) {
    return null;
  }

  return {
    currentRoute: candidate.currentRoute,
    previousInternalRoute: candidate.previousInternalRoute ?? null,
    clientNavigation: candidate.clientNavigation,
  };
}

function writeCurrentInternalRouteEntry(entry: InternalRouteEntry) {
  const historyState = window.history.state;
  const nextState = historyState && typeof historyState === "object"
    ? { ...historyState }
    : {};

  window.history.replaceState(
    {
      ...nextState,
      [HISTORY_ENTRY_KEY]: entry,
    },
    "",
  );
}

export function markBackTarget(target: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(BACK_TARGET_KEY, target);
}

export function InternalRouteHistory() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousRouteRef = useRef<string | null>(null);

  useEffect(() => {
    const currentRoute = getCurrentRoute(pathname, searchParams);
    const previousRoute = previousRouteRef.current;
    const existingEntry = getCurrentInternalRouteEntry();

    if (!existingEntry) {
      const clientNavigation = previousRoute !== null && previousRoute !== currentRoute;
      writeCurrentInternalRouteEntry({
        currentRoute,
        previousInternalRoute: clientNavigation
          ? previousRoute
          : getInternalReferrerRoute(currentRoute),
        clientNavigation,
      });
    }

    const stack = readRouteStack();
    const backTarget = window.sessionStorage.getItem(BACK_TARGET_KEY);

    if (backTarget && backTarget === currentRoute) {
      const existingIndex = stack.lastIndexOf(currentRoute);
      if (existingIndex >= 0) {
        writeRouteStack(stack.slice(0, existingIndex + 1));
      } else {
        writeRouteStack([...stack, currentRoute]);
      }
      window.sessionStorage.removeItem(BACK_TARGET_KEY);
    } else if (stack[stack.length - 1] !== currentRoute) {
      writeRouteStack([...stack, currentRoute]);
    }

    previousRouteRef.current = currentRoute;
  }, [pathname, searchParams]);

  return null;
}
