import type { ArtworkStatus, BilingualText } from "./data/types";

export function bt(zh: string, en: string): BilingualText {
  return { zh, en };
}

export function formatInlineText(text: BilingualText, separator = " / ") {
  return `${text.zh}${separator}${text.en}`;
}

export function formatMetadataText(text: string | BilingualText) {
  if (typeof text === "string") {
    return text;
  }

  return `${text.zh} | ${text.en}`;
}

const artworkStatusMap: Record<ArtworkStatus, BilingualText> = {
  inquiry: bt("可洽询", "Available on Request"),
  sold: bt("已洽购", "Acquired"),
  reserved: bt("暂留", "On Hold"),
};

export function getArtworkStatusText(status: ArtworkStatus) {
  return artworkStatusMap[status];
}
