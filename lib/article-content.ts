import type { Article, ArticleContentBlock, ArticleImagePairItem, BilingualText } from "./site-data";

function normalizeText(value: string | undefined) {
  return (value ?? "").trim();
}

function normalizeBilingual(value: BilingualText | undefined, mode: "line" | "long" = "line"): BilingualText {
  const zh = mode === "long" ? (value?.zh ?? "").trim() : normalizeText(value?.zh);
  const en = mode === "long" ? (value?.en ?? "").trim() : normalizeText(value?.en);
  return { zh, en };
}

function normalizeImagePairItems(items: ArticleImagePairItem[] | undefined) {
  const normalized = (items ?? []).slice(0, 2).map((item) => ({
    image: normalizeText(item?.image),
    caption: normalizeBilingual(item?.caption, "long"),
  }));

  while (normalized.length < 2) {
    normalized.push({
      image: "",
      caption: emptyBilingual(),
    });
  }

  return normalized;
}

export function emptyBilingual(): BilingualText {
  return { zh: "", en: "" };
}

export function createArticleParagraphBlock(): ArticleContentBlock {
  return {
    type: "paragraph",
    content: emptyBilingual(),
  };
}

export function createArticleImageBlock(): ArticleContentBlock {
  return {
    type: "image",
    image: "",
    caption: emptyBilingual(),
    layout: "wide",
  };
}

export function createArticleImagePairBlock(): ArticleContentBlock {
  return {
    type: "imagePair",
    items: normalizeImagePairItems([]),
  };
}

export function normalizeArticleContentBlocks(
  blocks: ArticleContentBlock[] | undefined,
  fallbackBody: BilingualText[] = [],
): ArticleContentBlock[] {
  const source = blocks?.length
    ? blocks
    : fallbackBody.map((paragraph) => ({
        type: "paragraph" as const,
        content: paragraph,
      }));

  return source.map((block) => {
    if (block.type === "paragraph") {
      return {
        type: "paragraph" as const,
        content: normalizeBilingual(block.content, "long"),
      };
    }

    if (block.type === "image") {
      return {
        type: "image" as const,
        image: normalizeText(block.image),
        caption: normalizeBilingual(block.caption, "long"),
        layout: block.layout === "inline" ? "inline" : "wide",
      };
    }

    return {
      type: "imagePair" as const,
      items: normalizeImagePairItems(block.items),
    };
  });
}

export function getArticleBodyParagraphs(blocks: ArticleContentBlock[] | undefined, fallbackBody: BilingualText[] = []) {
  const normalized = normalizeArticleContentBlocks(blocks, fallbackBody);
  const paragraphs = normalized
    .filter((block): block is Extract<ArticleContentBlock, { type: "paragraph" }> => block.type === "paragraph")
    .map((block) => normalizeBilingual(block.content, "long"))
    .filter((paragraph) => paragraph.zh || paragraph.en);

  return paragraphs.length ? paragraphs : fallbackBody.map((paragraph) => normalizeBilingual(paragraph, "long"));
}

export function getRenderableArticleContentBlocks(article: Article) {
  return normalizeArticleContentBlocks(article.contentBlocks, article.body).filter((block) => {
    if (block.type === "paragraph") {
      return Boolean(block.content.zh || block.content.en);
    }

    if (block.type === "image") {
      return Boolean(block.image);
    }

    return block.items.some((item) => item.image);
  });
}

export function articleHasBodyContent(article: Article) {
  return getRenderableArticleContentBlocks(article).some((block) => block.type === "paragraph");
}
