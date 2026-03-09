import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

import { bt } from "./bilingual";
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
  HomeContentEditorValue,
  PublicationStatus,
  SiteContent,
  SiteConfigContent,
} from "./data/types";
import { getRepoUtf8File, hasGitHubRepoConfig, putRepoUtf8File } from "./github-repo";
import { siteConfig as defaultSiteConfig } from "./site-config";

const CONTENT_DIR = path.join(process.cwd(), "content");
const CONTENT_FILE_PATH = path.join(CONTENT_DIR, "site-content.json");
const CONTENT_REPO_PATH = "content/site-content.json";
const UNTITLED_ARTWORK_TITLES = new Set(["未命名藏品", "Untitled Artwork"]);

export class ContentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContentValidationError";
  }
}

export const editableSections: Array<{
  key: EditableSectionKey;
  title: BilingualText;
  description: BilingualText;
}> = [
  {
    key: "siteConfig",
    title: bt("站点设置", "Site Settings"),
    description: bt("统一维护品牌、关于、联系、页脚与 SEO 基础信息。", "Maintain brand, about, contact, footer, and SEO basics in one place."),
  },
  {
    key: "homeContent",
    title: bt("首页内容", "Homepage"),
    description: bt("维护首页主视觉、专题、精选作品、收藏方向与专业信任。", "Maintain the homepage hero, focus area, featured works, collecting directions, and trust module."),
  },
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

function getPrimaryText(text: BilingualText | undefined) {
  return text?.zh.trim() || text?.en.trim() || "";
}

function hasMeaningfulArtworkTitle(text: BilingualText | undefined) {
  const primary = getPrimaryText(text);
  return Boolean(primary) && !UNTITLED_ARTWORK_TITLES.has(primary);
}

function validateArtworkForPublication(artwork: Artwork) {
  if ((artwork.publicationStatus ?? "draft") !== "published") {
    return;
  }

  if (!hasMeaningfulArtworkTitle(artwork.title)) {
    throw new ContentValidationError("发布藏品前请填写作品标题。");
  }

  if (!artwork.slug.trim()) {
    throw new ContentValidationError("发布藏品前请填写 slug。");
  }

  if (!artwork.image.trim()) {
    throw new ContentValidationError("发布藏品前请先上传主图。");
  }
}

function validateExhibitionForPublication(exhibition: Exhibition) {
  if ((exhibition.publicationStatus ?? "draft") !== "published") {
    return;
  }

  if (!getPrimaryText(exhibition.title)) {
    throw new ContentValidationError("发布展览前请填写标题。");
  }

  if (!exhibition.slug.trim()) {
    throw new ContentValidationError("发布展览前请填写 slug。");
  }
}

function validateArticleForPublication(article: Article) {
  if ((article.publicationStatus ?? "draft") !== "published") {
    return;
  }

  if (!getPrimaryText(article.title)) {
    throw new ContentValidationError("发布文章前请填写标题。");
  }

  if (!article.slug.trim()) {
    throw new ContentValidationError("发布文章前请填写 slug。");
  }
}

function validateSectionBeforeSave(
  section: EditableSectionKey,
  nextValue: EditableSectionValueMap[EditableSectionKey],
) {
  if (section === "artworks") {
    (nextValue as Artwork[]).forEach(validateArtworkForPublication);
  }

  if (section === "exhibitions") {
    (nextValue as Exhibition[]).forEach(validateExhibitionForPublication);
  }

  if (section === "articles") {
    (nextValue as Article[]).forEach(validateArticleForPublication);
  }
}

function getFeaturedArtworkIds(artworks: Artwork[]) {
  return artworks.filter((artwork) => artwork.featured).map((artwork) => getArtworkId(artwork));
}

function buildHomeContentEditorValue(content: SiteContent): HomeContentEditorValue {
  return {
    intro: content.siteConfig.homeIntro,
    homeContent: content.homeContent,
    collectingDirections: content.collectingDirections,
    operationalFacts: content.operationalFacts,
    featuredArtworkIds: getFeaturedArtworkIds(content.artworks),
  };
}

export function getEditableSectionValue<K extends EditableSectionKey>(
  content: SiteContent,
  section: K,
): EditableSectionValueMap[K] {
  if (section === "homeContent") {
    return buildHomeContentEditorValue(content) as EditableSectionValueMap[K];
  }

  return content[section] as unknown as EditableSectionValueMap[K];
}

function applyHomeContentEditorValue(content: SiteContent, nextValue: HomeContentEditorValue) {
  const featuredIds = new Set(nextValue.featuredArtworkIds);

  return normalizeSiteContent({
    ...content,
    siteConfig: {
      ...content.siteConfig,
      homeIntro: nextValue.intro,
    },
    homeContent: nextValue.homeContent,
    collectingDirections: nextValue.collectingDirections,
    operationalFacts: nextValue.operationalFacts,
    artworks: content.artworks.map((artwork) => ({
      ...artwork,
      featured: featuredIds.has(getArtworkId(artwork)),
    })),
  });
}

function findArtworkIndexById(artworks: Artwork[], artworkId: string) {
  return artworks.findIndex((artwork) => getArtworkId(artwork) === artworkId);
}

export async function saveSiteSection(
  section: EditableSectionKey,
  nextValue: EditableSectionValueMap[EditableSectionKey],
  actor: string,
) {
  validateSectionBeforeSave(section, nextValue);

  const current = await readSiteContentFresh();
  const nextContent =
    section === "homeContent"
      ? applyHomeContentEditorValue(current, nextValue as HomeContentEditorValue)
      : normalizeSiteContent({
          ...current,
          [section]:
            section === "artworks"
              ? mergeArtworkSection(current.artworks, nextValue as Artwork[])
              : nextValue,
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

  validateArtworkForPublication(mergedArtwork);

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
    siteConfig: {
      ...structuredClone(defaultSiteConfig),
      ...content.siteConfig,
      homeIntro:
        content.siteConfig?.homeIntro ??
        content.brandIntro?.statement ??
        structuredClone(defaultSiteConfig.homeIntro),
      about: {
        ...structuredClone(defaultSiteConfig.about),
        ...content.siteConfig?.about,
        eyebrow:
          content.siteConfig?.about?.eyebrow ??
          content.pageCopy?.about?.hero?.eyebrow ??
          structuredClone(defaultSiteConfig.about.eyebrow),
        title:
          content.siteConfig?.about?.title ??
          content.pageCopy?.about?.hero?.title ??
          structuredClone(defaultSiteConfig.about.title),
        subtitle:
          content.siteConfig?.about?.subtitle ??
          content.pageCopy?.about?.position?.title ??
          structuredClone(defaultSiteConfig.about.subtitle),
        body:
          content.siteConfig?.about?.body ??
          [
            content.brandIntro?.about ?? structuredClone(defaultSiteConfig.about.body[0]),
            content.pageCopy?.about?.position?.paragraphTwo ?? structuredClone(defaultSiteConfig.about.body[1]),
            content.pageCopy?.about?.position?.paragraphThree ?? structuredClone(defaultSiteConfig.about.body[2]),
          ],
      },
      contactPage: {
        ...structuredClone(defaultSiteConfig.contactPage),
        ...content.siteConfig?.contactPage,
        eyebrow:
          content.siteConfig?.contactPage?.eyebrow ??
          content.pageCopy?.contact?.hero?.eyebrow ??
          structuredClone(defaultSiteConfig.contactPage.eyebrow),
        title:
          content.siteConfig?.contactPage?.title ??
          content.pageCopy?.contact?.hero?.title ??
          structuredClone(defaultSiteConfig.contactPage.title),
        description:
          content.siteConfig?.contactPage?.description ??
          content.pageCopy?.contact?.hero?.description ??
          structuredClone(defaultSiteConfig.contactPage.description),
        aside:
          content.siteConfig?.contactPage?.aside ??
          content.pageCopy?.contact?.hero?.aside ??
          structuredClone(defaultSiteConfig.contactPage.aside),
        infoLabels: {
          ...structuredClone(defaultSiteConfig.contactPage.infoLabels),
          ...content.siteConfig?.contactPage?.infoLabels,
          ...content.pageCopy?.contact?.infoLabels,
        },
      },
      footer: {
        ...structuredClone(defaultSiteConfig.footer),
        ...content.siteConfig?.footer,
        intro:
          content.siteConfig?.footer?.intro ??
          content.pageCopy?.siteChrome?.footer?.intro ??
          structuredClone(defaultSiteConfig.footer.intro),
        appointment:
          content.siteConfig?.footer?.appointment ??
          content.pageCopy?.siteChrome?.footer?.appointment ??
          structuredClone(defaultSiteConfig.footer.appointment),
        copyrightLabel:
          content.siteConfig?.footer?.copyrightLabel ??
          content.pageCopy?.siteChrome?.footer?.copyrightLabel ??
          structuredClone(defaultSiteConfig.footer.copyrightLabel),
        contactHeading:
          content.siteConfig?.footer?.contactHeading ??
          content.pageCopy?.siteChrome?.footer?.contactHeading ??
          structuredClone(defaultSiteConfig.footer.contactHeading),
        informationHeading:
          content.siteConfig?.footer?.informationHeading ??
          content.pageCopy?.siteChrome?.footer?.informationHeading ??
          structuredClone(defaultSiteConfig.footer.informationHeading),
        collectionLink:
          content.siteConfig?.footer?.collectionLink ??
          content.pageCopy?.siteChrome?.footer?.collectionLink ??
          structuredClone(defaultSiteConfig.footer.collectionLink),
        exhibitionsLink:
          content.siteConfig?.footer?.exhibitionsLink ??
          content.pageCopy?.siteChrome?.footer?.exhibitionsLink ??
          structuredClone(defaultSiteConfig.footer.exhibitionsLink),
        journalLink:
          content.siteConfig?.footer?.journalLink ??
          content.pageCopy?.siteChrome?.footer?.journalLink ??
          structuredClone(defaultSiteConfig.footer.journalLink),
        pdfRequestLabel:
          content.siteConfig?.footer?.pdfRequestLabel ??
          content.pageCopy?.siteChrome?.footer?.pdfRequestLabel ??
          structuredClone(defaultSiteConfig.footer.pdfRequestLabel),
        instagramLabel:
          content.siteConfig?.footer?.instagramLabel ??
          content.pageCopy?.siteChrome?.footer?.instagramLabel ??
          structuredClone(defaultSiteConfig.footer.instagramLabel),
        wechatLabel:
          content.siteConfig?.footer?.wechatLabel ??
          content.pageCopy?.siteChrome?.footer?.wechatLabel ??
          structuredClone(defaultSiteConfig.footer.wechatLabel),
      },
      contact: {
        ...structuredClone(defaultSiteConfig.contact),
        ...content.siteConfig?.contact,
        address:
          content.siteConfig?.contact?.address ??
          structuredClone(defaultSiteConfig.contact.address),
        replyWindow:
          content.siteConfig?.contact?.replyWindow ??
          structuredClone(defaultSiteConfig.contact.replyWindow),
        collaborationNote:
          content.siteConfig?.contact?.collaborationNote ??
          structuredClone(defaultSiteConfig.contact.collaborationNote),
        appointmentNote:
          content.siteConfig?.contact?.appointmentNote ??
          content.pageCopy?.contact?.appointmentLine ??
          structuredClone(defaultSiteConfig.contact.appointmentNote),
      },
    },
    homeContent: {
      ...structuredClone(defaultHomeContent),
      ...content.homeContent,
      heroEyebrow:
        content.homeContent?.heroEyebrow ??
        content.pageCopy?.home?.heroEyebrow ??
        structuredClone(defaultHomeContent.heroEyebrow),
      heroTitle:
        content.homeContent?.heroTitle ??
        content.pageCopy?.home?.heroTitle ??
        structuredClone(defaultHomeContent.heroTitle),
      heroSubtitle:
        content.homeContent?.heroSubtitle ??
        structuredClone(defaultHomeContent.heroSubtitle),
      heroPrimaryAction:
        content.homeContent?.heroPrimaryAction ??
        content.pageCopy?.home?.heroPrimaryAction ??
        structuredClone(defaultHomeContent.heroPrimaryAction),
      heroSecondaryAction:
        content.homeContent?.heroSecondaryAction ??
        content.pageCopy?.home?.heroSecondaryAction ??
        structuredClone(defaultHomeContent.heroSecondaryAction),
      focusCurrent: {
        ...structuredClone(defaultHomeContent.focusCurrent),
        ...content.pageCopy?.home?.focusCurrent,
        ...content.homeContent?.focusCurrent,
      },
      focusRecent: {
        ...structuredClone(defaultHomeContent.focusRecent),
        ...content.pageCopy?.home?.focusRecent,
        ...content.homeContent?.focusRecent,
      },
      focusSummaryLine: {
        ...structuredClone(defaultHomeContent.focusSummaryLine),
        ...content.pageCopy?.home?.focusSummaryLine,
        ...content.homeContent?.focusSummaryLine,
      },
      focusAction:
        content.homeContent?.focusAction ??
        content.pageCopy?.home?.focusAction ??
        structuredClone(defaultHomeContent.focusAction),
      selectedWorks: {
        ...structuredClone(defaultHomeContent.selectedWorks),
        ...content.pageCopy?.home?.selectedWorks,
        ...content.homeContent?.selectedWorks,
      },
      collectingDirections: {
        ...structuredClone(defaultHomeContent.collectingDirections),
        ...content.pageCopy?.home?.collectingDirections,
        ...content.homeContent?.collectingDirections,
      },
      operationalFacts: {
        ...structuredClone(defaultHomeContent.operationalFacts),
        ...content.pageCopy?.home?.operationalFacts,
        ...content.homeContent?.operationalFacts,
      },
      contact: {
        ...structuredClone(defaultHomeContent.contact),
        ...content.pageCopy?.home?.contact,
        ...content.homeContent?.contact,
      },
      contactPrimaryAction:
        content.homeContent?.contactPrimaryAction ??
        content.pageCopy?.home?.contactPrimaryAction ??
        structuredClone(defaultHomeContent.contactPrimaryAction),
      contactSecondaryAction:
        content.homeContent?.contactSecondaryAction ??
        content.pageCopy?.home?.contactSecondaryAction ??
        structuredClone(defaultHomeContent.contactSecondaryAction),
    },
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
