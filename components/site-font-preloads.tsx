"use client";

import { preload } from "react-dom";

// Keep resource hints in the document head, outside the streamed site layout.
// This component also renders on the server, so the hints still arrive early.
export function SiteFontPreloads() {
  for (const font of [
    "InstrumentSans.woff2",
  ]) {
    preload(`/fonts/${font}`, {
      as: "font",
      type: "font/woff2",
      crossOrigin: "anonymous",
    });
  }

  return null;
}
