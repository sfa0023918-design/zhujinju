import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

import { bt } from "./bilingual";
import { articles as defaultArticles } from "./data/articles";
import { artworks as defaultArtworks } from "./data/artworks";
import { brandIntro as defaultBrandIntro, collectingDirections as defaultCollectingDirections, operationalFacts as defaultOperationalFacts } from "./data/brand";
import { exhibitions as defaultExhibitions } from "./data/exhibitions";
import { pageCopy as defaultPageCopy } from "./data/page-copy";
import type {
  Article,
  Artwork,
  BilingualText,
  EditableSectionKey,
  Exhibition,
  PublicationStatus,
  SiteContent,
  SiteConfigContent,
} from "./data/types";
import { getRepoUtf8File, hasGitHubRepoConfig, putRepoUtf8File } from "./github-repo";
import { siteConfig as defaultSiteConfig } from "./site-config";

const CONTENT_DIR = path.join(process.cwd(), "content");
const CONTENT_FILE_PATH = path.join(CONTENT_DIR, "site-content.json");
const CONTENT_REPO_PATH = "content/site-content.json";

export const editableSections: Array<{
  key: EditableSectionKey;
  title: BilingualText;
  description: BilingualText;
}> = [
  {
    key: "pageCopy",
    title: bt("页面文案", "Page Copy"),
    description: bt("推荐先改：按前台页面顺序编辑首页、关于、联系、藏品、展览与文章页文案。", "Recommended first: edit homepage, about, contact, collection, exhibition, and journal copy in front-end order."),
  },
  {
    key: "artworks",
    title: bt("藏品", "Artworks"),
    description: bt("新增、编辑或下线藏品资料。", "Create, edit, or unpublish artworks."),
  },
  {
    key: "exhibitions",
    title: bt("展览", "Exhibitions"),
    description: bt("展览项目、图录页数与相关作品。", "Exhibitions, catalogue pagination, and related works."),
  },
  {
    key: "articles",
    title: bt("文章", "Articles"),
    description: bt("文章、作者、关键词与互链信息。", "Articles, authors, keywords, and cross-linking."),
  },
  {
    key: "brandIntro",
    title: bt("品牌信息", "Brand Intro"),
    description: bt("品牌说明、方法论与首页导语。", "Brand statement, methodology, and homepage lead texts."),
  },
  {
    key: "collectingDirections",
    title: bt("收藏方向", "Collecting Directions"),
    description: bt("首页与藏品页使用的收藏方向。", "Collecting directions used across the homepage and collection pages."),
  },
  {
    key: "operationalFacts",
    title: bt("专业信任", "Operational Facts"),
    description: bt("首页与关于页使用的专业积累信息。", "Professional facts used on the homepage and about page."),
  },
  {
    key: "siteConfig",
    title: bt("站点设置", "Site Settings"),
    description: bt("网站名、SEO、域名与联系方式。", "Site name, SEO, domain, and contact details."),
  },
];

export function getDefaultSiteContent(): SiteContent {
  return normalizeSiteContent({
    siteConfig: structuredClone(defaultSiteConfig) as SiteConfigContent,
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
    return JSON.parse(raw) as SiteContent;
  } catch {
    return null;
  }
}

async function readGitHubContentFile() {
  try {
    const raw = await getRepoUtf8File(CONTENT_REPO_PATH);
    return raw ? (JSON.parse(raw) as SiteContent) : null;
  } catch {
    return null;
  }
}

async function readBestAvailableContentFile() {
  if (process.env.NODE_ENV === "production" && hasGitHubRepoConfig()) {
    const remote = await readGitHubContentFile();

    if (remote) {
      return remote;
    }
  }

  return await readLocalContentFile();
}

export async function loadSiteContent(): Promise<SiteContent> {
  const content = await readBestAvailableContentFile();
  return normalizeSiteContent(content ?? getDefaultSiteContent());
}

export async function readSiteContentFresh() {
  return normalizeSiteContent((await readBestAvailableContentFile()) ?? getDefaultSiteContent());
}

export async function writeLocalContentFile(content: SiteContent) {
  await fs.mkdir(CONTENT_DIR, { recursive: true });
  await fs.writeFile(CONTENT_FILE_PATH, `${JSON.stringify(content, null, 2)}\n`, "utf8");
}

function canWriteLocalContentFile() {
  return process.env.NODE_ENV !== "production";
}

async function pushContentToGitHub(content: SiteContent, message: string) {
  await putRepoUtf8File(
    CONTENT_REPO_PATH,
    `${JSON.stringify(content, null, 2)}\n`,
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

function getArtworkId(artwork: Artwork) {
  return artwork.id?.trim() || artwork.slug;
}

function findArtworkIndexById(artworks: Artwork[], artworkId: string) {
  return artworks.findIndex((artwork) => getArtworkId(artwork) === artworkId);
}

export async function saveSiteSection(
  section: EditableSectionKey,
  nextValue: unknown,
  actor: string,
) {
  const current = await readSiteContentFresh();
  const mergedValue =
    section === "artworks"
      ? mergeArtworkSection(current.artworks, nextValue as Artwork[])
      : nextValue;
  const nextContent = normalizeSiteContent({
    ...current,
    [section]: mergedValue,
  } as SiteContent);

  await persistSiteContent(nextContent, `Update ${section} from admin by ${actor}`);

  return nextContent;
}

function mergeArtworkSection(currentArtworks: Artwork[], nextArtworks: Artwork[]) {
  const currentById = new Map(currentArtworks.map((artwork) => [getArtworkId(artwork), artwork]));

  return nextArtworks.map((artwork) => {
    const current = currentById.get(getArtworkId(artwork));

    if (!current) {
      return artwork;
    }

    // Media fields are persisted through dedicated endpoints so a full-form save
    // cannot accidentally roll them back to stale client state.
    return {
      ...artwork,
      image: current.image,
      gallery: current.gallery,
    };
  });
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

export async function saveArtworkRecord(
  artworkId: string,
  nextArtwork: Artwork,
  actor: string,
) {
  const current = await readSiteContentFresh();
  const artworkIndex = findArtworkIndexById(current.artworks, artworkId);

  if (artworkIndex < 0) {
    throw new Error("未找到要保存的藏品记录。");
  }

  const nextContent = normalizeSiteContent(structuredClone(current));
  const currentArtwork = nextContent.artworks[artworkIndex];
  const mergedArtwork: Artwork = {
    ...currentArtwork,
    ...nextArtwork,
    id: currentArtwork.id,
  };

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
  options?: { galleryIndex?: number },
) {
  const current = await readSiteContentFresh();
  const artworkIndex = findArtworkIndexById(current.artworks, artworkId);

  if (artworkIndex < 0) {
    throw new Error("未找到要更新图片的藏品。");
  }

  const nextContent = normalizeSiteContent(structuredClone(current));
  const artwork = nextContent.artworks[artworkIndex];

  if (field === "image") {
    artwork.image = value.trim();
  } else {
    const slotIndex = options?.galleryIndex ?? 0;
    const gallery = [...(artwork.gallery ?? [])];
    gallery[slotIndex] = value.trim();
    artwork.gallery = gallery;
  }

  const normalized = normalizeSiteContent(nextContent);

  await persistSiteContent(normalized, `Update artwork media from admin by ${actor}`);

  return {
    artwork: normalized.artworks[artworkIndex],
    artworks: normalized.artworks,
  };
}

function normalizeSiteContent(content: SiteContent): SiteContent {
  return {
    ...content,
    pageCopy: {
      ...structuredClone(defaultPageCopy),
      ...content.pageCopy,
      siteChrome: {
        ...structuredClone(defaultPageCopy.siteChrome),
        ...content.pageCopy?.siteChrome,
        footer: {
          ...structuredClone(defaultPageCopy.siteChrome.footer),
          ...content.pageCopy?.siteChrome?.footer,
        },
        contactForm: {
          ...structuredClone(defaultPageCopy.siteChrome.contactForm),
          ...content.pageCopy?.siteChrome?.contactForm,
          roleOptions:
            content.pageCopy?.siteChrome?.contactForm?.roleOptions ??
            structuredClone(defaultPageCopy.siteChrome.contactForm.roleOptions),
        },
      },
      home: {
        ...structuredClone(defaultPageCopy.home),
        ...content.pageCopy?.home,
        focusCurrent: {
          ...structuredClone(defaultPageCopy.home.focusCurrent),
          ...content.pageCopy?.home?.focusCurrent,
        },
        focusRecent: {
          ...structuredClone(defaultPageCopy.home.focusRecent),
          ...content.pageCopy?.home?.focusRecent,
        },
        focusSummaryLine: {
          ...structuredClone(defaultPageCopy.home.focusSummaryLine),
          ...content.pageCopy?.home?.focusSummaryLine,
        },
        selectedWorks: {
          ...structuredClone(defaultPageCopy.home.selectedWorks),
          ...content.pageCopy?.home?.selectedWorks,
        },
        collectingDirections: {
          ...structuredClone(defaultPageCopy.home.collectingDirections),
          ...content.pageCopy?.home?.collectingDirections,
        },
        operationalFacts: {
          ...structuredClone(defaultPageCopy.home.operationalFacts),
          ...content.pageCopy?.home?.operationalFacts,
        },
        contact: {
          ...structuredClone(defaultPageCopy.home.contact),
          ...content.pageCopy?.home?.contact,
        },
      },
      about: {
        ...structuredClone(defaultPageCopy.about),
        ...content.pageCopy?.about,
        hero: {
          ...structuredClone(defaultPageCopy.about.hero),
          ...content.pageCopy?.about?.hero,
        },
        position: {
          ...structuredClone(defaultPageCopy.about.position),
          ...content.pageCopy?.about?.position,
        },
      },
      contact: {
        ...structuredClone(defaultPageCopy.contact),
        ...content.pageCopy?.contact,
        hero: {
          ...structuredClone(defaultPageCopy.contact.hero),
          ...content.pageCopy?.contact?.hero,
        },
        infoLabels: {
          ...structuredClone(defaultPageCopy.contact.infoLabels),
          ...content.pageCopy?.contact?.infoLabels,
        },
      },
      collection: {
        ...structuredClone(defaultPageCopy.collection),
        ...content.pageCopy?.collection,
        hero: {
          ...structuredClone(defaultPageCopy.collection.hero),
          ...content.pageCopy?.collection?.hero,
        },
        filters: {
          ...structuredClone(defaultPageCopy.collection.filters),
          ...content.pageCopy?.collection?.filters,
        },
      },
      artworkDetail: {
        ...structuredClone(defaultPageCopy.artworkDetail),
        ...content.pageCopy?.artworkDetail,
        fieldLabels: {
          ...structuredClone(defaultPageCopy.artworkDetail.fieldLabels),
          ...content.pageCopy?.artworkDetail?.fieldLabels,
        },
      },
      exhibitions: {
        ...structuredClone(defaultPageCopy.exhibitions),
        ...content.pageCopy?.exhibitions,
        hero: {
          ...structuredClone(defaultPageCopy.exhibitions.hero),
          ...content.pageCopy?.exhibitions?.hero,
        },
        cardLabels: {
          ...structuredClone(defaultPageCopy.exhibitions.cardLabels),
          ...content.pageCopy?.exhibitions?.cardLabels,
        },
      },
      exhibitionDetail: {
        ...structuredClone(defaultPageCopy.exhibitionDetail),
        ...content.pageCopy?.exhibitionDetail,
        summaryLine: {
          ...structuredClone(defaultPageCopy.exhibitionDetail.summaryLine),
          ...content.pageCopy?.exhibitionDetail?.summaryLine,
        },
      },
      journal: {
        ...structuredClone(defaultPageCopy.journal),
        ...content.pageCopy?.journal,
        hero: {
          ...structuredClone(defaultPageCopy.journal.hero),
          ...content.pageCopy?.journal?.hero,
        },
      },
      articleDetail: {
        ...structuredClone(defaultPageCopy.articleDetail),
        ...content.pageCopy?.articleDetail,
      },
    },
    brandIntro: {
      ...content.brandIntro,
      heroImage: content.brandIntro.heroImage ?? "/api/placeholder/home-hero?kind=landscape",
      heroAlt: content.brandIntro.heroAlt ?? bt("竹瑾居首页主视觉", "Zhu Jin Ju homepage hero"),
    },
    artworks: content.artworks.map((artwork) => ({
      ...artwork,
      id: getArtworkId(artwork),
      publicationStatus: artwork.publicationStatus ?? "published",
      gallery: normalizeArtworkGallery(artwork.gallery, artwork.image),
    })),
    exhibitions: content.exhibitions.map((exhibition) => ({
      ...exhibition,
      publicationStatus: exhibition.publicationStatus ?? "published",
    })),
    articles: content.articles.map((article) => ({
      ...article,
      publicationStatus: article.publicationStatus ?? "published",
    })),
  };
}

function normalizeArtworkGallery(gallery: string[] | undefined, primaryImage: string) {
  const trimmed = (gallery ?? []).map((image) => image.trim());
  let lastFilledIndex = -1;

  trimmed.forEach((image, index) => {
    if (image) {
      lastFilledIndex = index;
    }
  });

  if (lastFilledIndex < 0) {
    return [];
  }

  const trimmedToLastFilled = trimmed.slice(0, lastFilledIndex + 1);
  const seen = new Set<string>();

  return trimmedToLastFilled.filter((image) => {
    if (!image || image === primaryImage || image.startsWith("/api/placeholder/") || seen.has(image)) {
      return false;
    }

    seen.add(image);
    return true;
  });
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
  return getPublicArtworks(content).filter((artwork) => artwork.featured);
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
    .filter((article) => isPublished(article.publicationStatus));
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

export function getRelatedArtworks(content: SiteContent, currentSlug: string, categoryZh: string) {
  return getPublicArtworks(content)
    .filter((artwork) => artwork.slug !== currentSlug && artwork.category.zh === categoryZh)
    .slice(0, 3);
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
