import { promises as fs } from "fs";
import path from "path";

import { bt } from "./bilingual";
import { articles as defaultArticles } from "./data/articles";
import { artworks as defaultArtworks } from "./data/artworks";
import { brandIntro as defaultBrandIntro, collectingDirections as defaultCollectingDirections, operationalFacts as defaultOperationalFacts } from "./data/brand";
import { exhibitions as defaultExhibitions } from "./data/exhibitions";
import type {
  Article,
  Artwork,
  BilingualText,
  EditableSectionKey,
  Exhibition,
  SiteContent,
  SiteConfigContent,
} from "./data/types";
import { putRepoUtf8File } from "./github-repo";
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
    key: "siteConfig",
    title: bt("站点设置", "Site Settings"),
    description: bt("网站名、SEO、域名与联系方式。", "Site name, SEO, domain, and contact details."),
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
];

export function getDefaultSiteContent(): SiteContent {
  return {
    siteConfig: structuredClone(defaultSiteConfig) as SiteConfigContent,
    brandIntro: structuredClone(defaultBrandIntro),
    collectingDirections: structuredClone(defaultCollectingDirections),
    operationalFacts: structuredClone(defaultOperationalFacts),
    artworks: structuredClone(defaultArtworks),
    exhibitions: structuredClone(defaultExhibitions),
    articles: structuredClone(defaultArticles),
  };
}

async function readLocalContentFile() {
  try {
    const raw = await fs.readFile(CONTENT_FILE_PATH, "utf8");
    return JSON.parse(raw) as SiteContent;
  } catch {
    return null;
  }
}

export async function loadSiteContent(): Promise<SiteContent> {
  const localContent = await readLocalContentFile();
  return localContent ?? getDefaultSiteContent();
}

export async function readSiteContentFresh() {
  return (await readLocalContentFile()) ?? getDefaultSiteContent();
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

export async function saveSiteSection(
  section: EditableSectionKey,
  nextValue: unknown,
  actor: string,
) {
  const current = await readSiteContentFresh();
  const nextContent = {
    ...current,
    [section]: nextValue,
  } as SiteContent;

  if (canWriteLocalContentFile()) {
    await writeLocalContentFile(nextContent);
  }

  await pushContentToGitHub(nextContent, `Update ${section} from admin by ${actor}`);

  return nextContent;
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
  return content.artworks.filter((artwork) => artwork.featured);
}

export function getCurrentExhibition(content: SiteContent) {
  return content.exhibitions.find((exhibition) => exhibition.current) ?? content.exhibitions[0];
}

export function getFilterOptions(content: SiteContent) {
  return {
    all: bt("全部", "All"),
    categories: getUniqueBilingual(content.artworks.map((artwork) => artwork.category)),
    regions: getUniqueBilingual(content.artworks.map((artwork) => artwork.region)),
    periods: getUniqueBilingual(content.artworks.map((artwork) => artwork.period)),
    materials: getUniqueBilingual(content.artworks.map((artwork) => artwork.material)),
  };
}

export function getArtworkBySlug(content: SiteContent, slug: string) {
  return content.artworks.find((artwork) => artwork.slug === slug);
}

export function getExhibitionBySlug(content: SiteContent, slug: string) {
  return content.exhibitions.find((exhibition) => exhibition.slug === slug);
}

export function getArticleBySlug(content: SiteContent, slug: string) {
  return content.articles.find((article) => article.slug === slug);
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
  return content.artworks
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

  return content.artworks.filter((artwork) => {
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
