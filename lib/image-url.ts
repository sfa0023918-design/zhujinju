const IMAGE_URL_VERSION = "r2";

export function withImageVersion(src: string) {
  if (!src) {
    return src;
  }

  const versionSeed = src.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "image";
  const separator = src.includes("?") ? "&" : "?";

  return `${src}${separator}v=${encodeURIComponent(`${IMAGE_URL_VERSION}-${versionSeed}`)}`;
}
