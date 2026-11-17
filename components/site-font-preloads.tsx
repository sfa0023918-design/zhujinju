"use client";

import { preload } from "react-dom";
import { useEffect } from "react";
import fallback from "@/lib/data/reading-fallback-stylesheet.json";

// Keep resource hints in the document head, outside the streamed site layout.
// This component also renders on the server, so the hints still arrive early.
export function SiteFontPreloads() {
  useEffect(() => {
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const loadFallback = () => {
      if (document.querySelector(`link[data-reading-fallback]`)) return;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = fallback.href;
      link.dataset.readingFallback = "true";
      // Earlier in source order: compact UI overrides retain precedence.
      document.head.prepend(link);
    };
    const schedule = () => {
      if ("requestIdleCallback" in window) {
        idle = window.requestIdleCallback(loadFallback, { timeout: 2000 });
      } else {
        timer = setTimeout(loadFallback, 200);
      }
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      window.removeEventListener("load", schedule);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer !== undefined) clearTimeout(timer);
    };
  }, []);
  for (const font of [
    "InstrumentSans.woff2",
  ]) {
    preload(`/fonts/${font}`, {
      as: "font",
      type: "font/woff2",
      crossOrigin: "anonymous",
    });
  }

  return <noscript><link rel="stylesheet" href={fallback.href} /></noscript>;
}
