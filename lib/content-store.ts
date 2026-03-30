import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { unstable_cache } from "next/cache";

import { getArticleBodyParagraphs, normalizeArticleContentBlocks } from "./article-content";
import { bt } from "./bilingual";
import { normalizeBilingualFieldsDeep } from "./copy-quality";
import { articles as defaultArticles } from "./data/articles";
import { artworks as defaultArtworks } from "./data/artworks";
import { brandIntro as defaultBrandIntro, collectingDirections as defaultCollectingDirections, operationalFacts as defaultOperationalFacts } from "./data/brand";
import { exhibitions as defaultExhibitions } from "./data/exhibitions";
import { homeContent as defaultHomeContent } from "./data/home-content";
import { pageCopy as defaultPageCopy } from "./data/page-copy";
import type {
  Article,
  Artwork,
  BilingualText,
  EditableSectionValueMap,
  EditableSectionKey,
  Exhibition,
  HomeContent,
  ImageAsset,
  OperationalFact,
  PublicationStatus,
  SiteContent,
  SiteConfigContent,
} from "./data/types";
import { getRepoUtf8File, hasGitHubRepoConfig, putRepoUtf8File } from "./github-repo";
import { normalizeMediaPath } from "./media-path";
import { getArticlePublicationIssues, getArtworkPublicationIssues, getExhibitionPublicationIssues } from "./publication-validation";
import { getSiteContentTag } from "./public-site-revalidate";
import { siteConfig as defaultSiteConfig } from "./site-config";

const CONTENT_DIR = path.join(process.cwd(), "content");
const CONTENT_FILE_PATH = path.join(CONTENT_DIR, "site-content.json");
const CONTENT_REPO_PATH = "content/site-content.json";
import type { ValidationIssue } from "./publication-validation";

type PersistedSiteContent = Pick<SiteContent, "artworks" | "exhibitions" | "articles">;

export class ContentValidationError extends Error {
  issues: ValidationIssue[];

  constructor(message: string, issues: ValidationIssue[] = []) {
    super(message || "当前内容尚不能发布，请先补全必要字段。");
    this.name = "ContentValidationError";
    this.issues = issues;
  }
}

export const editableSections: Array<{
  key: EditableSectionKey;
  title: BilingualText;
  description: BilingualText;
}> = [
  {
    key: "artworks",
    title: bt("藏品", "Artworks"),
    description: bt("新增、编辑、排序与发布藏品。", "Create, edit, reorder, and publish artworks."),
  },
  {
    key: "exhibitions",
    title: bt("展览与图录", "Exhibitions"),
    description: bt("维护展览项目、图录信息与相关作品。", "Maintain exhibitions, catalogue information, and related works."),
  },
  {
    key: "articles",
    title: bt("文章", "Articles"),
    description: bt("文章、作者、关键词与互链信息。", "Articles, authors, keywords, and cross-linking."),
  },
];

export function getDefaultSiteContent(): SiteContent {
  return normalizeSiteContent({
    siteConfig: structuredClone(defaultSiteConfig) as SiteConfigContent,
    homeContent: structuredClone(defaultHomeContent) as HomeContent,
    pageCopy: structuredClone(defaultPageCopy),
    brandIntro: structuredClone(defaultBrandIntro),
    collectingDirections: structuredClone(defaultCollectingDirections),
    operationalFacts: structuredClone(defaultOperationalFacts),
    artworks: structuredClone(defaultArtworks),
    exhibitions: structuredClone(defaultExhibitions),
    articles: structuredClone(defaultArticles),
  });
}

async function readLocalContentFile() {
  try {
    const raw = await fs.readFile(CONTENT_FILE_PATH, "utf8");
    return JSON.parse(raw) as Partial<SiteContent>;
  } catch {
    return null;
  }
}

async function readGitHubContentFile() {
  try {
    const raw = await getRepoUtf8File(CONTENT_REPO_PATH);
    return raw ? (JSON.parse(raw) as Partial<SiteContent>) : null;
  } catch {
    return null;
  }
}

function shouldPreferRemoteContent() {
  return process.env.NODE_ENV === "production" && hasGitHubRepoConfig();
}

function toPersistedSiteContent(content: SiteContent): PersistedSiteContent {
  return {
    artworks: content.artworks,
    exhibitions: content.exhibitions,
    articles: content.articles,
  };
}

async function readBestAvailableContentFile(options?: { preferRemote?: boolean }) {
  const preferRemote = options?.preferRemote ?? shouldPreferRemoteContent();

  if (preferRemote) {
    const remote = await readGitHubContentFile();

    if (remote) {
      return remote;
    }
  }

  const local = await readLocalContentFile();

  if (local) {
    return local;
  }

  if (!preferRemote && hasGitHubRepoConfig()) {
    const remote = await readGitHubContentFile();

    if (remote) {
      return remote;
    }
  }

  return null;
}

const loadCachedSiteContent = unstable_cache(
  async () =>
    normalizeSiteContent(
      (await readBestAvailableContentFile({ preferRemote: true })) ?? getDefaultSiteContent(),
    ),
  ["site-content-v5"],
  { tags: [getSiteContentTag()] },
);

export async function loadSiteContent(): Promise<SiteContent> {
  if (process.env.NODE_ENV === "production") {
    return await loadCachedSiteContent();
  }

  return await readSiteContentFresh();
}

export async function readSiteContentFresh() {
  return normalizeSiteContent(
    (await readBestAvailableContentFile({ preferRemote: shouldPreferRemoteContent() })) ?? getDefaultSiteContent(),
  );
}

export async function writeLocalContentFile(content: SiteContent) {
  await fs.mkdir(CONTENT_DIR, { recursive: true });
  await fs.writeFile(CONTENT_FILE_PATH, `${JSON.stringify(toPersistedSiteContent(content), null, 2)}\n`, "utf8");
}

function canWriteLocalContentFile() {
  return process.env.NODE_ENV !== "production";
}

async function pushContentToGitHub(content: SiteContent, message: string) {
  await putRepoUtf8File(
    CONTENT_REPO_PATH,
    `${JSON.stringify(toPersistedSiteContent(content), null, 2)}\n`,
    message,
  );
}

async function persistSiteContent(content: SiteContent, message: string) {
  if (canWriteLocalContentFile()) {
    await writeLocalContentFile(content);
  }

  await pushContentToGitHub(content, message);
}

function makeArtworkId() {
  return `artwork_${randomUUID()}`;
}

function makeArtworkSlug() {
  return `artwork-${Date.now()}`;
}

function makeExhibitionSlug() {
  return `exhibition-${Date.now()}`;
}

function makeArticleSlug() {
  return `article-${Date.now()}`;
}

function createArtworkDraftRecord(): Artwork {
  return {
    id: makeArtworkId(),
    slug: makeArtworkSlug(),
    publicationStatus: "draft",
    title: bt("未命名藏品", "Untitled Artwork"),
    subtitle: bt("", ""),
    period: bt("", ""),
    region: bt("", ""),
    origin: bt("", ""),
    material: bt("", ""),
    category: bt("", ""),
    dimensions: bt("", ""),
    status: "inquiry",
    excerpt: bt("", ""),
    viewingNote: bt("", ""),
    comparisonNote: bt("", ""),
    provenance: [],
    exhibitions: [],
    publications: [],
    inquirySupport: [
      bt("可索取高清图", "High-resolution images available on request"),
      bt("可索取品相信息", "Condition report available on request"),
      bt("可索取图录页", "Catalogue pages available on request"),
    ],
    relatedArticleSlugs: [],
    relatedExhibitionSlugs: [],
    image: "",
    gallery: [],
    featured: false,
  };
}

function createExhibitionDraftRecord(): Exhibition {
  return {
    slug: makeExhibitionSlug(),
    publicationStatus: "draft",
    title: bt("", ""),
    subtitle: bt("", ""),
    period: bt("", ""),
    venue: bt("", ""),
    intro: bt("", ""),
    description: [bt("", "")],
    highlightArtworkSlugs: [],
    highlightCount: 0,
    featuredWorksCount: 0,
    catalogueTitle: bt("", ""),
    catalogueIntro: bt("", ""),
    cataloguePages: 0,
    cataloguePageCount: 0,
    cataloguePageImages: [],
    catalogueNote: bt("", ""),
    curatorialLead: bt("", ""),
    curatorialNote: bt("", ""),
    relatedArticleSlugs: [],
    cover: "",
    current: false,
  };
}

function createArticleDraftRecord(): Article {
  return {
    slug: makeArticleSlug(),
    publicationStatus: "draft",
    title: bt("", ""),
    category: bt("", ""),
    column: bt("", ""),
    author: bt("", ""),
    date: new Date().toISOString().slice(0, 10),
    excerpt: bt("", ""),
    body: [bt("", "")],
    contentBlocks: [
      {
        type: "paragraph",
        content: bt("", ""),
      },
    ],
    keywords: [bt("", "")],
    relatedArtworkSlugs: [],
    relatedExhibitionSlugs: [],
    cover: "",
  };
}

function appendCopySuffix(text: BilingualText, fallbackZh: string, fallbackEn: string) {
  const zh = text.zh.trim() || fallbackZh;
  const en = text.en.trim() || fallbackEn;

  return {
    zh: zh.includes("副本") ? zh : `${zh}（副本）`,
    en: /\(copy\)$/i.test(en) ? en : `${en} (Copy)`,
  };
}

function getArtworkId(artwork: Artwork) {
  return artwork.id?.trim() || artwork.slug;
}


function throwIfBlockingIssues(issues: ValidationIssue[]) {
  const blocking = issues.filter((issue) => issue.level === "error");

  if (!blocking.length) {
    return;
  }

  throw new ContentValidationError(
    `当前内容尚不能发布，请先完成以下字段：${blocking.map((issue) => issue.message.replace(/^请/, "").replace(/。$/, "")).join("、")}`,
    issues,
  );
}

function validateArtworkForPublication(artwork: Artwork, artworks: Artwork[]) {
  if ((artwork.publicationStatus ?? "draft") !== "published") {
    return;
  }

  throwIfBlockingIssues(getArtworkPublicationIssues(artwork, artworks));
}

function validateExhibitionForPublication(exhibition: Exhibition, exhibitions: Exhibition[]) {
  if ((exhibition.publicationStatus ?? "draft") !== "published") {
    return;
  }

  throwIfBlockingIssues(getExhibitionPublicationIssues(exhibition, exhibitions));
}

function validateArticleForPublication(article: Article, articles: Article[]) {
  if ((article.publicationStatus ?? "draft") !== "published") {
    return;
  }

  throwIfBlockingIssues(getArticlePublicationIssues(article, articles));
}

function validateSectionBeforeSave(
  section: EditableSectionKey,
  nextValue: EditableSectionValueMap[EditableSectionKey],
) {
  if (section === "artworks") {
    (nextValue as Artwork[]).forEach((artwork) => validateArtworkForPublication(artwork, nextValue as Artwork[]));
  }

  if (section === "exhibitions") {
    (nextValue as Exhibition[]).forEach((exhibition) => validateExhibitionForPublication(exhibition, nextValue as Exhibition[]));
  }

  if (section === "articles") {
    (nextValue as Article[]).forEach((article) => validateArticleForPublication(article, nextValue as Article[]));
  }
}

function getFeaturedArtworkIds(artworks: Artwork[]) {
  return artworks.filter((artwork) => artwork.featured).map((artwork) => getArtworkId(artwork));
}

function getNormalizedSelectedArtworkIds(homeContent: SiteContent["homeContent"], artworks: Artwork[]) {
  const fallbackIds = getFeaturedArtworkIds(artworks);
  const rawIds = Array.isArray(homeContent?.selectedArtworkIds) ? homeContent.selectedArtworkIds : fallbackIds;
  const featuredIdSet = new Set(fallbackIds);
  const normalized = rawIds.filter((id, index) => id && rawIds.indexOf(id) === index && featuredIdSet.has(id));
  const remaining = fallbackIds.filter((id) => !normalized.includes(id));

  return [...normalized, ...remaining];
}

function trimImageUrl(value?: string | null) {
  return normalizeMediaPath(value);
}

function normalizeImageAsset(asset?: ImageAsset | null, fallbackUrl?: string) {
  const fallback = trimImageUrl(fallbackUrl);
  const originalFromAsset = trimImageUrl(asset?.original);
  const hasPrimaryMismatch = Boolean(fallback && originalFromAsset && fallback !== originalFromAsset);
  const original = hasPrimaryMismatch ? fallback : originalFromAsset || fallback;

  if (!original) {
    return undefined;
  }

  // If primary image changed but asset metadata is still from a previous file,
  // reset derived variants so list/detail always stay in sync.
  if (hasPrimaryMismatch) {
    return {
      original,
    } satisfies ImageAsset;
  }

  return {
    original,
    card: trimImageUrl(asset?.card) || undefined,
    hero: trimImageUrl(asset?.hero) || undefined,
    detail: trimImageUrl(asset?.detail) || undefined,
    screen: trimImageUrl(asset?.screen) || undefined,
    hd: trimImageUrl(asset?.hd) || undefined,
    width: typeof asset?.width === "number" && asset.width > 0 ? asset.width : undefined,
    height: typeof asset?.height === "number" && asset.height > 0 ? asset.height : undefined,
  } satisfies ImageAsset;
}

function resolveImageUrl(value: string | undefined, asset?: ImageAsset | null) {
  return trimImageUrl(value) || trimImageUrl(asset?.original);
}

function normalizeArtworkGalleryState(
  gallery: string[] | undefined,
  primaryImage: string,
  galleryAssets?: Array<ImageAsset | null>,
) {
  const maxLength = Math.max(gallery?.length ?? 0, galleryAssets?.length ?? 0);

  if (maxLength === 0) {
    return {
      gallery: [] as string[],
      galleryAssets: [] as Array<ImageAsset | null>,
    };
  }

  const seen = new Set<string>();
  const normalizedGallery: string[] = [];
  const normalizedGalleryAssets: Array<ImageAsset | null> = [];

  for (let index = 0; index < maxLength; index += 1) {
    const rawEntry = gallery?.[index];
    const normalizedEntry = trimImageUrl(rawEntry);
    const normalizedAsset = normalizeImageAsset(galleryAssets?.[index] ?? undefined, normalizedEntry);
    // Keep legacy compatibility for records that only have asset metadata, but never
    // revive slots that were explicitly cleared to an empty string in admin.
    const resolvedImage = normalizedEntry || (rawEntry === undefined ? trimImageUrl(normalizedAsset?.original) : "");

    if (
      !resolvedImage ||
      resolvedImage === primaryImage ||
      resolvedImage.startsWith("/api/placeholder/") ||
      seen.has(resolvedImage)
    ) {
      continue;
    }

    seen.add(resolvedImage);
    normalizedGallery.push(resolvedImage);
    normalizedGalleryAssets.push(normalizeImageAsset(normalizedAsset, resolvedImage) ?? null);
  }

  return {
    gallery: normalizedGallery,
    galleryAssets: normalizedGalleryAssets,
  };
}

export function getEditableSectionValue<K extends EditableSectionKey>(
  content: SiteContent,
  section: K,
): EditableSectionValueMap[K] {
  return content[section] as unknown as EditableSectionValueMap[K];
}

function findArtworkIndexById(artworks: Artwork[], artworkId: string) {
  return artworks.findIndex((artwork) => getArtworkId(artwork) === artworkId);
}

export async function saveSiteSection(
  section: EditableSectionKey,
  nextValue: EditableSectionValueMap[EditableSectionKey],
  actor: string,
  options?: {
    baseValue?: EditableSectionValueMap[EditableSectionKey];
  },
) {
  const current = await readSiteContentFresh();
  const baseValue = options?.baseValue;
  const mergedSectionValue = (
    section === "exhibitions"
      ? mergeExhibitionSection(
          current.exhibitions,
          nextValue as Exhibition[],
          Array.isArray(baseValue) ? (baseValue as Exhibition[]) : undefined,
        )
      : section === "articles"
        ? mergeArticleSection(
            current.articles,
            nextValue as Article[],
            Array.isArray(baseValue) ? (baseValue as Article[]) : undefined,
          )
        : nextValue
  ) as EditableSectionValueMap[EditableSectionKey];
  validateSectionBeforeSave(section, mergedSectionValue);
  const nextContent = normalizeSiteContent({
    ...current,
    [section]: mergedSectionValue,
  } as SiteContent);

  await persistSiteContent(nextContent, `Update ${section} from admin by ${actor}`);

  return nextContent;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function areDeepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) {
      return false;
    }

    return left.every((item, index) => areDeepEqual(item, right[index]));
  }

  if (isPlainObject(left) && isPlainObject(right)) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);

    if (leftKeys.length !== rightKeys.length) {
      return false;
    }

    return leftKeys.every((key) => areDeepEqual(left[key], right[key]));
  }

  return false;
}

function mergeValueWithBase(baseValue: unknown, currentValue: unknown, nextValue: unknown): unknown {
  // If editor did not change this field (next === base), keep latest server value.
  if (areDeepEqual(nextValue, baseValue)) {
    return structuredClone(currentValue);
  }

  if (isPlainObject(baseValue) && isPlainObject(currentValue) && isPlainObject(nextValue)) {
    const keys = new Set([...Object.keys(baseValue), ...Object.keys(currentValue), ...Object.keys(nextValue)]);
    const merged: Record<string, unknown> = {};

    keys.forEach((key) => {
      merged[key] = mergeValueWithBase(baseValue[key], currentValue[key], nextValue[key]);
    });

    return merged;
  }

  // Arrays and primitives are treated as an intentional replacement if changed from base.
  return structuredClone(nextValue);
}

function mergeRecordsWithBase<T>(
  currentRecords: T[],
  nextRecords: T[],
  getKey: (record: T) => string,
  baseRecords?: T[],
) {
  if (!baseRecords?.length) {
    return nextRecords;
  }

  const currentByKey = new Map(currentRecords.map((record) => [getKey(record), record]));
  const baseByKey = new Map(baseRecords.map((record) => [getKey(record), record]));
  const resolved: T[] = [];
  const consumedCurrentKeys = new Set<string>();

  nextRecords.forEach((nextRecord, nextIndex) => {
    const key = getKey(nextRecord);
    const currentRecord = currentByKey.get(key);
    const baseRecord = baseByKey.get(key);

    if (!currentRecord) {
      // Record was removed by another newer save; do not resurrect it from stale payload.
      if (baseRecord) {
        return;
      }

      const baseRecordAtIndex = baseRecords[nextIndex];

      if (baseRecordAtIndex) {
        const baseIndexKey = getKey(baseRecordAtIndex);
        const currentRecordByBaseIndex = currentByKey.get(baseIndexKey);
        const stillReferencedByNext = nextRecords.some(
          (record, index) => index !== nextIndex && getKey(record) === baseIndexKey,
        );

        // Handle key edits (for example slug rename) by matching the same list position.
        if (currentRecordByBaseIndex && !consumedCurrentKeys.has(baseIndexKey) && !stillReferencedByNext) {
          resolved.push(mergeValueWithBase(baseRecordAtIndex, currentRecordByBaseIndex, nextRecord) as T);
          consumedCurrentKeys.add(baseIndexKey);
          return;
        }
      }

      resolved.push(nextRecord);
      return;
    }

    if (!baseRecord) {
      resolved.push(nextRecord);
      consumedCurrentKeys.add(key);
      return;
    }

    resolved.push(mergeValueWithBase(baseRecord, currentRecord, nextRecord) as T);
    consumedCurrentKeys.add(key);
  });

  // Preserve records that were not present in the incoming payload to avoid accidental deletions.
  currentRecords.forEach((currentRecord) => {
    const key = getKey(currentRecord);

    if (!consumedCurrentKeys.has(key)) {
      resolved.push(currentRecord);
    }
  });

  return resolved;
}

function mergeExhibitionSection(
  currentExhibitions: Exhibition[],
  nextExhibitions: Exhibition[],
  baseExhibitions?: Exhibition[],
) {
  return mergeRecordsWithBase(currentExhibitions, nextExhibitions, (exhibition) => exhibition.slug, baseExhibitions);
}

function mergeArticleSection(currentArticles: Article[], nextArticles: Article[], baseArticles?: Article[]) {
  return mergeRecordsWithBase(currentArticles, nextArticles, (article) => article.slug, baseArticles);
}

export async function createArtworkDraft(actor: string) {
  const current = await readSiteContentFresh();
  const nextContent = normalizeSiteContent(structuredClone(current));
  const artwork = createArtworkDraftRecord();

  nextContent.artworks.push(artwork);
  await persistSiteContent(nextContent, `Create artwork draft from admin by ${actor}`);

  return {
    artwork: nextContent.artworks[nextContent.artworks.length - 1],
    artworks: nextContent.artworks,
  };
}

export async function duplicateArtworkRecord(artworkId: string, actor: string) {
  const current = await readSiteContentFresh();
  const artworkIndex = findArtworkIndexById(current.artworks, artworkId);

  if (artworkIndex < 0) {
    throw new Error("未找到要复制的藏品记录。");
  }

  const nextContent = normalizeSiteContent(structuredClone(current));
  const source = nextContent.artworks[artworkIndex];
  const duplicate: Artwork = {
    ...structuredClone(source),
    id: makeArtworkId(),
    slug: makeArtworkSlug(),
    publicationStatus: "draft",
    title: appendCopySuffix(source.title, "未命名藏品", "Untitled Artwork"),
    featured: false,
  };

  nextContent.artworks.splice(artworkIndex + 1, 0, duplicate);
  await persistSiteContent(nextContent, `Duplicate artwork record from admin by ${actor}`);

  return {
    artwork: duplicate,
    artworks: nextContent.artworks,
  };
}

export async function createExhibitionDraft(actor: string) {
  const current = await readSiteContentFresh();
  const nextContent = normalizeSiteContent(structuredClone(current));
  const exhibition = createExhibitionDraftRecord();

  nextContent.exhibitions.push(exhibition);
  await persistSiteContent(nextContent, `Create exhibition draft from admin by ${actor}`);

  return {
    exhibition,
    exhibitions: nextContent.exhibitions,
  };
}

export async function duplicateExhibitionRecord(slug: string, actor: string) {
  const current = await readSiteContentFresh();
  const exhibitionIndex = current.exhibitions.findIndex((item) => item.slug === slug);

  if (exhibitionIndex < 0) {
    throw new Error("未找到要复制的展览记录。");
  }

  const nextContent = normalizeSiteContent(structuredClone(current));
  const source = nextContent.exhibitions[exhibitionIndex];
  const duplicate: Exhibition = {
    ...structuredClone(source),
    slug: makeExhibitionSlug(),
    publicationStatus: "draft",
    title: appendCopySuffix(source.title, "未命名展览", "Untitled Exhibition"),
    current: false,
  };

  nextContent.exhibitions.splice(exhibitionIndex + 1, 0, duplicate);
  await persistSiteContent(nextContent, `Duplicate exhibition record from admin by ${actor}`);

  return {
    exhibition: duplicate,
    exhibitions: nextContent.exhibitions,
  };
}

export async function deleteExhibitionRecord(slug: string, actor: string) {
  const current = await readSiteContentFresh();
  const exhibitionIndex = current.exhibitions.findIndex((item) => item.slug === slug);

  if (exhibitionIndex < 0) {
    throw new Error("未找到要删除的展览记录。");
  }

  const nextContent = normalizeSiteContent(structuredClone(current));
  nextContent.exhibitions.splice(exhibitionIndex, 1);
  await persistSiteContent(nextContent, `Delete exhibition record from admin by ${actor}`);

  return {
    exhibitions: nextContent.exhibitions,
  };
}

export async function createArticleDraft(actor: string) {
  const current = await readSiteContentFresh();
  const nextContent = normalizeSiteContent(structuredClone(current));
  const article = createArticleDraftRecord();

  nextContent.articles.push(article);
  await persistSiteContent(nextContent, `Create article draft from admin by ${actor}`);

  return {
    article,
    articles: nextContent.articles,
  };
}

export async function duplicateArticleRecord(slug: string, actor: string) {
  const current = await readSiteContentFresh();
  const articleIndex = current.articles.findIndex((item) => item.slug === slug);

  if (articleIndex < 0) {
    throw new Error("未找到要复制的文章记录。");
  }

  const nextContent = normalizeSiteContent(structuredClone(current));
  const source = nextContent.articles[articleIndex];
  const duplicate: Article = {
    ...structuredClone(source),
    slug: makeArticleSlug(),
    publicationStatus: "draft",
    title: appendCopySuffix(source.title, "未命名文章", "Untitled Article"),
  };

  nextContent.articles.splice(articleIndex + 1, 0, duplicate);
  await persistSiteContent(nextContent, `Duplicate article record from admin by ${actor}`);

  return {
    article: duplicate,
    articles: nextContent.articles,
  };
}

export async function deleteArticleRecord(slug: string, actor: string) {
  const current = await readSiteContentFresh();
  const articleIndex = current.articles.findIndex((item) => item.slug === slug);

  if (articleIndex < 0) {
    throw new Error("未找到要删除的文章记录。");
  }

  const nextContent = normalizeSiteContent(structuredClone(current));
  nextContent.articles.splice(articleIndex, 1);
  await persistSiteContent(nextContent, `Delete article record from admin by ${actor}`);

  return {
    articles: nextContent.articles,
  };
}

export async function saveArtworkRecord(
  artworkId: string,
  nextArtwork: Artwork,
  actor: string,
  options?: {
    baseArtwork?: Artwork;
  },
) {
  const current = await readSiteContentFresh();
  const artworkIndex = findArtworkIndexById(current.artworks, artworkId);

  if (artworkIndex < 0) {
    throw new Error("未找到要保存的藏品记录。");
  }

  const nextContent = normalizeSiteContent(structuredClone(current));
  const currentArtwork = nextContent.artworks[artworkIndex];
  const resolvedArtwork = options?.baseArtwork
    ? (mergeValueWithBase(options.baseArtwork, currentArtwork, nextArtwork) as Artwork)
    : nextArtwork;
  const mergedArtwork: Artwork = {
    ...currentArtwork,
    ...resolvedArtwork,
    id: currentArtwork.id,
  };

  validateArtworkForPublication(mergedArtwork, current.artworks.map((item, index) => (index === artworkIndex ? mergedArtwork : item)));

  nextContent.artworks[artworkIndex] = mergedArtwork;
  const normalized = normalizeSiteContent(nextContent);

  await persistSiteContent(normalized, `Update artwork record from admin by ${actor}`);

  return {
    artwork: normalized.artworks[artworkIndex],
    artworks: normalized.artworks,
  };
}

export async function deleteArtworkRecord(artworkId: string, actor: string) {
  const current = await readSiteContentFresh();
  const artworkIndex = findArtworkIndexById(current.artworks, artworkId);

  if (artworkIndex < 0) {
    throw new Error("未找到要删除的藏品记录。");
  }

  const nextContent = normalizeSiteContent(structuredClone(current));
  nextContent.artworks.splice(artworkIndex, 1);
  await persistSiteContent(nextContent, `Delete artwork record from admin by ${actor}`);

  return {
    artworks: nextContent.artworks,
  };
}

export async function reorderArtworkRecords(orderedIds: string[], actor: string) {
  const current = await readSiteContentFresh();
  const currentById = new Map(current.artworks.map((artwork) => [getArtworkId(artwork), artwork]));
  const ordered = orderedIds
    .map((id) => currentById.get(id))
    .filter((artwork): artwork is Artwork => Boolean(artwork));
  const remaining = current.artworks.filter((artwork) => !orderedIds.includes(getArtworkId(artwork)));
  const nextContent = normalizeSiteContent({
    ...current,
    artworks: [...ordered, ...remaining],
  });

  await persistSiteContent(nextContent, `Reorder artworks from admin by ${actor}`);

  return {
    artworks: nextContent.artworks,
  };
}

export async function saveArtworkMediaField(
  artworkId: string,
  field: "image" | "gallery",
  value: string,
  actor: string,
  options?: { galleryIndex?: number; asset?: ImageAsset },
) {
  const current = await readSiteContentFresh();
  const artworkIndex = findArtworkIndexById(current.artworks, artworkId);

  if (artworkIndex < 0) {
    throw new Error("未找到要更新图片的藏品。");
  }

  const nextContent = normalizeSiteContent(structuredClone(current));
  const artwork = nextContent.artworks[artworkIndex];

  if (field === "image") {
    artwork.image = trimImageUrl(value);
    artwork.imageAsset = normalizeImageAsset(options?.asset, artwork.image);
  } else {
    const slotIndex = options?.galleryIndex ?? 0;
    const gallery = [...(artwork.gallery ?? [])];
    const galleryAssets = [...(artwork.galleryAssets ?? [])];
    const normalizedValue = trimImageUrl(value);
    gallery[slotIndex] = normalizedValue;
    galleryAssets[slotIndex] = normalizeImageAsset(options?.asset, normalizedValue) ?? null;
    const normalizedGalleryState = normalizeArtworkGalleryState(gallery, artwork.image, galleryAssets);
    artwork.gallery = normalizedGalleryState.gallery;
    artwork.galleryAssets = normalizedGalleryState.galleryAssets;
  }

  if (field === "image") {
    const normalizedGalleryState = normalizeArtworkGalleryState(artwork.gallery, artwork.image, artwork.galleryAssets);
    artwork.gallery = normalizedGalleryState.gallery;
    artwork.galleryAssets = normalizedGalleryState.galleryAssets;
  }

  const normalized = normalizeSiteContent(nextContent);

  await persistSiteContent(normalized, `Update artwork media from admin by ${actor}`);

  return {
    artwork: normalized.artworks[artworkIndex],
    artworks: normalized.artworks,
  };
}

export async function assertMediaTargetExists(
  section: "artworks" | "exhibitions" | "articles",
  recordId: string,
) {
  const current = await readSiteContentFresh();

  if (section === "artworks") {
    if (findArtworkIndexById(current.artworks, recordId) < 0) {
      throw new Error("未找到要更新图片的藏品。");
    }

    return;
  }

  if (section === "exhibitions") {
    if (!current.exhibitions.some((item) => item.slug === recordId)) {
      throw new Error("未找到要更新图片的展览。");
    }

    return;
  }

  if (!current.articles.some((item) => item.slug === recordId)) {
    throw new Error("未找到要更新图片的文章。");
  }
}

export async function saveRecordMediaField(
  section: "exhibitions" | "articles",
  recordId: string,
  field: "cover",
  value: string,
  actor: string,
  options?: { asset?: ImageAsset },
) {
  const current = await readSiteContentFresh();
  const nextContent = normalizeSiteContent(structuredClone(current));

  if (section === "exhibitions") {
    const recordIndex = nextContent.exhibitions.findIndex((item) => item.slug === recordId);

    if (recordIndex < 0) {
      throw new Error("未找到要更新图片的展览。");
    }

    const normalizedValue = trimImageUrl(value);
    nextContent.exhibitions[recordIndex].cover = normalizedValue;
    nextContent.exhibitions[recordIndex].coverAsset = normalizeImageAsset(options?.asset, normalizedValue);
    await persistSiteContent(nextContent, `Update exhibition media from admin by ${actor}`);

    return {
      item: nextContent.exhibitions[recordIndex],
      value: nextContent.exhibitions,
    };
  }

  const recordIndex = nextContent.articles.findIndex((item) => item.slug === recordId);

  if (recordIndex < 0) {
    throw new Error("未找到要更新图片的文章。");
  }

  const normalizedValue = trimImageUrl(value);
  nextContent.articles[recordIndex].cover = normalizedValue;
  nextContent.articles[recordIndex].coverAsset = normalizeImageAsset(options?.asset, normalizedValue);
  await persistSiteContent(nextContent, `Update article media from admin by ${actor}`);

  return {
    item: nextContent.articles[recordIndex],
    value: nextContent.articles,
  };
}

function normalizeSiteContent(content: Partial<SiteContent>): SiteContent {
  return {
    ...content,
    // Static brand and page copy now come from code so admin saves cannot roll them back.
    siteConfig: structuredClone(defaultSiteConfig),
    homeContent: structuredClone(defaultHomeContent),
    pageCopy: structuredClone(defaultPageCopy),
    brandIntro: structuredClone(defaultBrandIntro),
    collectingDirections: structuredClone(defaultCollectingDirections),
    operationalFacts: structuredClone(defaultOperationalFacts),
    artworks: (content.artworks ?? []).map((artwork) => {
      const cleanedArtwork = normalizeBilingualFieldsDeep(artwork).value;
      const sourceViewingNoteEn = typeof artwork.viewingNote?.en === "string" ? artwork.viewingNote.en : null;
      const sourceViewingNoteZh = typeof artwork.viewingNote?.zh === "string" ? artwork.viewingNote.zh : null;
      if (sourceViewingNoteEn !== null || sourceViewingNoteZh !== null) {
        cleanedArtwork.viewingNote = {
          zh: sourceViewingNoteZh ?? cleanedArtwork.viewingNote?.zh ?? "",
          en: sourceViewingNoteEn ?? cleanedArtwork.viewingNote?.en ?? "",
        };
      }
      const imageAsset = normalizeImageAsset(cleanedArtwork.imageAsset, cleanedArtwork.image);
      const image = resolveImageUrl(cleanedArtwork.image, imageAsset);
      const normalizedGalleryState = normalizeArtworkGalleryState(
        cleanedArtwork.gallery,
        image,
        cleanedArtwork.galleryAssets,
      );

      return {
        ...cleanedArtwork,
        id: getArtworkId(cleanedArtwork),
        publicationStatus: cleanedArtwork.publicationStatus ?? "published",
        image,
        imageAsset,
        gallery: normalizedGalleryState.gallery,
        galleryAssets: normalizedGalleryState.galleryAssets,
      };
    }),
    exhibitions: (content.exhibitions ?? []).map((exhibition) => {
      const cleanedExhibition = normalizeBilingualFieldsDeep(exhibition).value;
      const coverAsset = normalizeImageAsset(cleanedExhibition.coverAsset, cleanedExhibition.cover);
      const featuredWorksCount =
        cleanedExhibition.featuredWorksCount ??
        cleanedExhibition.highlightCount ??
        cleanedExhibition.highlightArtworkSlugs.length;
      const cataloguePageCount = cleanedExhibition.cataloguePageCount ?? cleanedExhibition.cataloguePages ?? 0;
      const catalogueNote = cleanedExhibition.catalogueNote ?? cleanedExhibition.catalogueIntro ?? bt("", "");
      const curatorialNote = cleanedExhibition.curatorialNote ?? cleanedExhibition.curatorialLead ?? bt("", "");

      return {
        ...cleanedExhibition,
        publicationStatus: cleanedExhibition.publicationStatus ?? "published",
        cover: resolveImageUrl(cleanedExhibition.cover, coverAsset),
        coverAsset,
        featuredWorksCount,
        highlightCount: featuredWorksCount,
        cataloguePageCount,
        cataloguePages: cataloguePageCount,
        cataloguePageImages: normalizeExhibitionCataloguePages(cleanedExhibition.cataloguePageImages),
        catalogueNote,
        catalogueIntro: catalogueNote,
        curatorialNote,
        curatorialLead: curatorialNote,
      };
    }),
    articles: (content.articles ?? []).map((article) => {
      const cleanedArticle = normalizeBilingualFieldsDeep(article).value;
      const coverAsset = normalizeImageAsset(cleanedArticle.coverAsset, cleanedArticle.cover);

      return {
        ...cleanedArticle,
        publicationStatus: cleanedArticle.publicationStatus ?? "published",
        cover: resolveImageUrl(cleanedArticle.cover, coverAsset),
        coverAsset,
        contentBlocks: normalizeArticleContentBlocks(cleanedArticle.contentBlocks, cleanedArticle.body),
        body: getArticleBodyParagraphs(cleanedArticle.contentBlocks, cleanedArticle.body),
      };
    }),
  };
}

function normalizeExhibitionCataloguePages(pages: string[] | undefined) {
  const trimmed = (pages ?? []).map((page) => page.trim());
  let lastFilledIndex = -1;

  trimmed.forEach((page, index) => {
    if (page) {
      lastFilledIndex = index;
    }
  });

  if (lastFilledIndex < 0) {
    return [];
  }

  return trimmed.slice(0, lastFilledIndex + 1);
}

function getUniqueBilingual(items: BilingualText[]) {
  const map = new Map<string, BilingualText>();

  items.forEach((item) => {
    if (!map.has(item.zh)) {
      map.set(item.zh, item);
    }
  });

  return Array.from(map.values());
}

export function getFeaturedArtworks(content: SiteContent) {
  const publicFeaturedArtworks = getPublicArtworks(content).filter((artwork) => artwork.featured);
  const artworksById = new Map(publicFeaturedArtworks.map((artwork) => [getArtworkId(artwork), artwork]));
  const orderedIds = getNormalizedSelectedArtworkIds(content.homeContent, content.artworks);
  const ordered = orderedIds
    .map((id) => artworksById.get(id))
    .filter((artwork): artwork is Artwork => Boolean(artwork));
  const remaining = publicFeaturedArtworks.filter((artwork) => !orderedIds.includes(getArtworkId(artwork)));

  return [...ordered, ...remaining];
}

export function getCurrentExhibition(content: SiteContent) {
  const published = getPublicExhibitions(content);
  return published.find((exhibition) => exhibition.current) ?? published[0];
}

export function getFilterOptions(content: SiteContent) {
  const publicArtworks = getPublicArtworks(content);

  return {
    all: bt("全部", "All"),
    categories: getUniqueBilingual(publicArtworks.map((artwork) => artwork.category)),
    regions: getUniqueBilingual(publicArtworks.map((artwork) => artwork.region)),
    periods: getUniqueBilingual(publicArtworks.map((artwork) => artwork.period)),
    materials: getUniqueBilingual(publicArtworks.map((artwork) => artwork.material)),
  };
}

function isPublished(status?: PublicationStatus) {
  return (status ?? "published") === "published";
}

function parseArticleDateTimestamp(dateText: string) {
  const raw = dateText.trim();

  if (!raw) {
    return null;
  }

  const normalized = raw
    .replace(/[./年]/g, "-")
    .replace(/月/g, "-")
    .replace(/日/g, "")
    .replace(/\s+/g, "");
  const ymdMatch = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  if (ymdMatch) {
    const year = Number(ymdMatch[1]);
    const month = Number(ymdMatch[2]);
    const day = Number(ymdMatch[3]);
    return Date.UTC(year, month - 1, day);
  }

  const withUtcSuffix = raw.includes("T") && !raw.includes("Z") && !/[+-]\d{2}:?\d{2}$/.test(raw)
    ? `${raw}Z`
    : raw;
  const parsed = Date.parse(withUtcSuffix);
  return Number.isNaN(parsed) ? null : parsed;
}

function getArticleSlugTimestamp(slug: string) {
  const match = slug.trim().match(/-(\d{10,})$/);
  return match ? Number(match[1]) : null;
}

function compareArticlesByNewest(a: Article, b: Article) {
  const aDate = parseArticleDateTimestamp(a.date);
  const bDate = parseArticleDateTimestamp(b.date);

  if (aDate !== null && bDate !== null && aDate !== bDate) {
    return bDate - aDate;
  }

  if (aDate !== null && bDate === null) {
    return -1;
  }

  if (aDate === null && bDate !== null) {
    return 1;
  }

  const aSlugTs = getArticleSlugTimestamp(a.slug);
  const bSlugTs = getArticleSlugTimestamp(b.slug);

  if (aSlugTs !== null && bSlugTs !== null && aSlugTs !== bSlugTs) {
    return bSlugTs - aSlugTs;
  }

  if (aSlugTs !== null && bSlugTs === null) {
    return -1;
  }

  if (aSlugTs === null && bSlugTs !== null) {
    return 1;
  }

  return a.slug.localeCompare(b.slug, "zh-Hans-CN");
}

export function getPublicArtworks(content: SiteContent) {
  return content.artworks.filter((artwork) => isPublished(artwork.publicationStatus));
}

export function getPublicExhibitions(content: SiteContent) {
  return content.exhibitions
    .map((exhibition) => ({
      ...exhibition,
      publicationStatus: exhibition.publicationStatus ?? "published",
    }))
    .filter((exhibition) => isPublished(exhibition.publicationStatus));
}

export function getPublicArticles(content: SiteContent) {
  return content.articles
    .map((article) => ({
      ...article,
      publicationStatus: article.publicationStatus ?? "published",
    }))
    .filter((article) => isPublished(article.publicationStatus))
    .sort(compareArticlesByNewest);
}

function hasCatalogueData(exhibition: Exhibition) {
  return Boolean(
    exhibition.catalogueTitle.zh.trim() ||
      exhibition.catalogueTitle.en.trim() ||
      exhibition.catalogueIntro.zh.trim() ||
      exhibition.catalogueIntro.en.trim() ||
      exhibition.cataloguePages > 0 ||
      (exhibition.cataloguePageCount ?? 0) > 0,
  );
}

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

function getAutoOperationalValue(kind: "exhibitions" | "catalogues" | "articles", content: SiteContent) {
  if (kind === "exhibitions") {
    const count = getPublicExhibitions(content).length;
    return {
      zh: `${count} 项专题展览`,
      en: `${count} ${pluralize(count, "exhibition", "exhibitions")}`,
    };
  }

  if (kind === "catalogues") {
    const count = getPublicExhibitions(content).filter(hasCatalogueData).length;
    return {
      zh: `${count} 册研究图录`,
      en: `${count} ${pluralize(count, "catalogue", "catalogues")}`,
    };
  }

  const count = getPublicArticles(content).length;
  return {
    zh: `${count} 篇公开文章`,
    en: `${count} published ${pluralize(count, "text", "texts")}`,
  };
}

function resolveOperationalFactKind(fact: OperationalFact) {
  const zh = fact.title.zh.trim();
  const en = fact.title.en.trim().toLowerCase();

  if (zh === "展览数量" || en === "exhibitions") {
    return "exhibitions" as const;
  }

  if (zh === "图录数量" || en === "catalogues") {
    return "catalogues" as const;
  }

  if (zh === "研究文章" || en === "research writing") {
    return "articles" as const;
  }

  return null;
}

export function getOperationalFacts(content: SiteContent) {
  return content.operationalFacts.map((fact) => {
    const kind = resolveOperationalFactKind(fact);

    if (!kind) {
      return fact;
    }

    return {
      ...fact,
      value: getAutoOperationalValue(kind, content),
    };
  });
}

export function getArtworkBySlug(content: SiteContent, slug: string, options?: { includeDrafts?: boolean }) {
  return (options?.includeDrafts ? content.artworks : getPublicArtworks(content)).find(
    (artwork) => artwork.slug === slug,
  );
}

export function getExhibitionBySlug(content: SiteContent, slug: string, options?: { includeDrafts?: boolean }) {
  return (options?.includeDrafts ? content.exhibitions : getPublicExhibitions(content)).find(
    (exhibition) => exhibition.slug === slug,
  );
}

export function getArticleBySlug(content: SiteContent, slug: string, options?: { includeDrafts?: boolean }) {
  return (options?.includeDrafts ? content.articles : getPublicArticles(content)).find(
    (article) => article.slug === slug,
  );
}

export function getArticlesBySlugs(content: SiteContent, slugs: string[]) {
  return slugs
    .map((slug) => getArticleBySlug(content, slug))
    .filter((article): article is Article => Boolean(article));
}

export function getExhibitionsBySlugs(content: SiteContent, slugs: string[]) {
  return slugs
    .map((slug) => getExhibitionBySlug(content, slug))
    .filter((exhibition): exhibition is Exhibition => Boolean(exhibition));
}

export function getHighlightedArtworks(content: SiteContent, slugs: string[]) {
  return slugs
    .map((slug) => getArtworkBySlug(content, slug))
    .filter((artwork): artwork is Artwork => Boolean(artwork));
}

function normalizeCompareValue(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function scoreRelatedArtwork(current: Artwork, candidate: Artwork) {
  let score = 0;

  const sameRegion = normalizeCompareValue(candidate.region.zh) === normalizeCompareValue(current.region.zh);
  const sameOrigin = normalizeCompareValue(candidate.origin.zh) === normalizeCompareValue(current.origin.zh);
  const samePeriod = normalizeCompareValue(candidate.period.zh) === normalizeCompareValue(current.period.zh);
  const sameMaterial = normalizeCompareValue(candidate.material.zh) === normalizeCompareValue(current.material.zh);
  const sameCategory = normalizeCompareValue(candidate.category.zh) === normalizeCompareValue(current.category.zh);
  const sharedExhibition = candidate.relatedExhibitionSlugs.some((slug) =>
    current.relatedExhibitionSlugs.includes(slug),
  );

  if (sameRegion) score += 40;
  if (sameOrigin) score += 36;
  if (samePeriod) score += 32;
  if (sameMaterial) score += 24;
  if (sameCategory) score += 20;
  if (sharedExhibition) score += 16;

  return score;
}

export function getRelatedArtworks(content: SiteContent, currentSlug: string, categoryZh: string) {
  const currentArtwork = getArtworkBySlug(content, currentSlug);

  if (!currentArtwork) {
    return getPublicArtworks(content)
      .filter((artwork) => artwork.slug !== currentSlug && artwork.category.zh === categoryZh)
      .slice(0, 4);
  }

  return getPublicArtworks(content)
    .filter((artwork) => artwork.slug !== currentSlug)
    .map((artwork) => ({
      artwork,
      score: scoreRelatedArtwork(currentArtwork, artwork),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.artwork.title.zh.localeCompare(right.artwork.title.zh, "zh-CN");
    })
    .filter((item, index) => item.score > 0 || index < 4)
    .slice(0, 4)
    .map((item) => item.artwork);
}

export function getFilteredArtworks(
  content: SiteContent,
  filters: {
    category?: string;
    region?: string;
    period?: string;
    material?: string;
  },
) {
  const filterOptions = getFilterOptions(content);

  return getPublicArtworks(content).filter((artwork) => {
    const categoryMatch =
      !filters.category ||
      filters.category === filterOptions.all.zh ||
      artwork.category.zh === filters.category;
    const regionMatch =
      !filters.region ||
      filters.region === filterOptions.all.zh ||
      artwork.region.zh === filters.region;
    const periodMatch =
      !filters.period ||
      filters.period === filterOptions.all.zh ||
      artwork.period.zh === filters.period;
    const materialMatch =
      !filters.material ||
      filters.material === filterOptions.all.zh ||
      artwork.material.zh === filters.material;

    return categoryMatch && regionMatch && periodMatch && materialMatch;
  });
}
