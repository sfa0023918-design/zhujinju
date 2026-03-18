function safeDecode(pathname: string) {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

function normalizePathname(pathname: string) {
  const withLeadingSlash = `/${pathname.replace(/^\/+/, "")}`;
  return withLeadingSlash.replace(/\/{2,}/g, "/");
}

export function normalizeMediaPath(value: string | null | undefined) {
  const raw = typeof value === "string" ? value.trim() : "";

  if (!raw) {
    return "";
  }

  if (raw.startsWith("uploads/")) {
    return normalizePathname(raw);
  }

  if (raw.startsWith("/uploads/")) {
    return normalizePathname(raw);
  }

  if (raw.startsWith("/api/placeholder/")) {
    return raw;
  }

  try {
    const parsed = new URL(raw);
    const pathname = normalizePathname(safeDecode(parsed.pathname));

    if (pathname.startsWith("/uploads/")) {
      // Ignore cache-busting query from frontend display URLs when saving to content.
      return pathname;
    }

    if (pathname.startsWith("/api/placeholder/")) {
      return `${pathname}${parsed.search}`;
    }
  } catch {
    // Keep non-URL values as-is.
  }

  return raw;
}

export function isUploadsPath(value: string) {
  return normalizeMediaPath(value).startsWith("/uploads/");
}
