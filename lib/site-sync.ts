import { createHash } from "crypto";

import type { EditableSectionKey, SiteContent } from "./data/types";

type SyncTarget =
  | { section: "artworks"; id: string }
  | { section: "exhibitions" }
  | { section: "articles" };

export type SiteSyncSnapshot = {
  target: SyncTarget;
  signature: string;
  ready: boolean;
  publicImpact: boolean;
  missingAssetCount: number;
  message: string;
};

function createSignature(value: unknown) {
  return createHash("sha1").update(JSON.stringify(value)).digest("hex").slice(0, 12);
}

const canCheckLocalUploadAssets =
  process.env.NODE_ENV !== "production" && !process.env.VERCEL;

async function toUploadFilePath(url: string) {
  if (!url.startsWith("/uploads/")) {
    return null;
  }

  const path = await import("path");

  return path.join(process.cwd(), "public", url.replace(/^\/+/, ""));
}

async function assetExists(url: string) {
  if (!canCheckLocalUploadAssets) {
    return true;
  }

  const filePath = await toUploadFilePath(url);

  if (!filePath) {
    return true;
  }

  try {
    const { access } = await import("fs/promises");
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function countMissingAssets(urls: string[]) {
  const unique = Array.from(new Set(urls.filter(Boolean)));
  const checks: number[] = await Promise.all(unique.map(async (url) => ((await assetExists(url)) ? 0 : 1)));
  return checks.reduce((total, current) => total + current, 0);
}

function publishedArtworks(content: SiteContent) {
  return content.artworks.filter((artwork) => (artwork.publicationStatus ?? "published") === "published");
}

function publishedExhibitions(content: SiteContent) {
  return content.exhibitions.filter((exhibition) => (exhibition.publicationStatus ?? "published") === "published");
}

function publishedArticles(content: SiteContent) {
  return content.articles.filter((article) => (article.publicationStatus ?? "published") === "published");
}

export async function buildSiteSyncSnapshot(content: SiteContent, target: SyncTarget): Promise<SiteSyncSnapshot> {
  if (target.section === "artworks") {
    const artwork = content.artworks.find((item) => (item.id?.trim() || item.slug) === target.id);

    if (!artwork) {
      throw new Error("未找到要检查的网站内容。");
    }

    const publicImpact = (artwork.publicationStatus ?? "draft") === "published";
    const assetUrls = [artwork.image, ...(artwork.gallery ?? [])].filter((url) => url.startsWith("/uploads/"));
    const missingAssetCount = publicImpact ? await countMissingAssets(assetUrls) : 0;

    return {
      target,
      signature: createSignature({
        ...artwork,
        gallery: artwork.gallery ?? [],
      }),
      ready: !publicImpact || missingAssetCount === 0,
      publicImpact,
      missingAssetCount,
      message: !publicImpact
        ? "当前记录仍是草稿，前台不会显示。"
        : missingAssetCount === 0
          ? "网站已显示这件作品的最新内容。"
          : "内容已保存，网站还在同步这件作品的图片。",
    };
  }

  if (target.section === "exhibitions") {
    const exhibitions = publishedExhibitions(content);
    const exhibitionAssets = exhibitions.flatMap((item) => [item.cover, ...(item.cataloguePageImages ?? [])]);
    const missingAssetCount = await countMissingAssets(exhibitionAssets.filter((url) => url.startsWith("/uploads/")));

    return {
      target,
      signature: createSignature(exhibitions),
      ready: missingAssetCount === 0,
      publicImpact: exhibitions.length > 0,
      missingAssetCount,
      message: missingAssetCount === 0 ? "网站已显示最新展览内容。" : "内容已保存，网站还在同步展览图片。",
    };
  }

  const articles = publishedArticles(content);
  const missingAssetCount = await countMissingAssets(articles.map((item) => item.cover).filter((url) => url.startsWith("/uploads/")));

  return {
    target,
    signature: createSignature(articles),
    ready: missingAssetCount === 0,
    publicImpact: articles.length > 0,
    missingAssetCount,
    message: missingAssetCount === 0 ? "网站已显示最新文章内容。" : "内容已保存，网站还在同步文章图片。",
  };
}

export function buildSyncTarget(section: EditableSectionKey, options?: { id?: string }) {
  if (section === "exhibitions" || section === "articles") {
    return { section } as SyncTarget;
  }

  if (section === "artworks" && options?.id) {
    return { section: "artworks", id: options.id } as SyncTarget;
  }

  return null;
}
