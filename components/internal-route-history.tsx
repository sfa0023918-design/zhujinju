"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const ROUTE_STACK_KEY = "zhujinju:route-stack";
const BACK_TARGET_KEY = "zhujinju:back-target";

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

export function getPreviousInternalRoute() {
  const stack = readRouteStack();
  return stack.length >= 2 ? stack[stack.length - 2] : null;
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

  useEffect(() => {
    const currentRoute = getCurrentRoute(pathname, searchParams);
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
      return;
    }

    if (stack[stack.length - 1] !== currentRoute) {
      writeRouteStack([...stack, currentRoute]);
    }
  }, [pathname, searchParams]);

  return null;
}
