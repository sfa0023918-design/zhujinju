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

type ArticleFlowLocale = "zh" | "en";

type ArticleFlowNode =
  | { type: "paragraph"; text: string }
  | { type: "image"; image: string; caption: string; layout: "wide" | "inline" };

const ARTICLE_FLOW_IMAGE_LINE_PATTERN = /^!\[([^\]]*)\]\(([^)]+)\)(?:\{layout=(wide|inline)\})?$/;

function normalizeFlowText(value: string) {
  return value.replace(/\r\n?/g, "\n");
}

function flushFlowParagraph(nodes: ArticleFlowNode[], lines: string[]) {
  if (!lines.length) {
    return;
  }

  const text = lines.join("\n").trim();

  if (!text) {
    lines.length = 0;
    return;
  }

  nodes.push({
    type: "paragraph",
    text,
  });
  lines.length = 0;
}

function parseArticleFlowNodes(value: string): ArticleFlowNode[] {
  const nodes: ArticleFlowNode[] = [];
  const lines = normalizeFlowText(value).split("\n");
  const paragraphLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushFlowParagraph(nodes, paragraphLines);
      continue;
    }

    const match = line.match(ARTICLE_FLOW_IMAGE_LINE_PATTERN);

    if (match?.[2]) {
      flushFlowParagraph(nodes, paragraphLines);
      nodes.push({
        type: "image",
        image: match[2].trim(),
        caption: (match[1] ?? "").trim(),
        layout: match[3] === "inline" ? "inline" : "wide",
      });
      continue;
    }

    paragraphLines.push(rawLine);
  }

  flushFlowParagraph(nodes, paragraphLines);
  return nodes;
}

export function articleBlocksToFlowText(
  blocks: ArticleContentBlock[] | undefined,
  fallbackBody: BilingualText[] = [],
  locale: ArticleFlowLocale,
) {
  const normalized = normalizeArticleContentBlocks(blocks, fallbackBody);
  const chunks: string[] = [];

  for (const block of normalized) {
    if (block.type === "paragraph") {
      const text = (locale === "zh" ? block.content.zh : block.content.en).trim();

      if (text) {
        chunks.push(text);
      }
      continue;
    }

    if (block.type === "image") {
      if (!block.image.trim()) {
        continue;
      }

      const caption = (locale === "zh" ? block.caption.zh : block.caption.en).trim();
      const layout = block.layout === "inline" ? "{layout=inline}" : "";
      chunks.push(`![${caption}](${block.image})${layout}`);
      continue;
    }

    for (const item of block.items) {
      if (!item.image.trim()) {
        continue;
      }

      const caption = (locale === "zh" ? item.caption.zh : item.caption.en).trim();
      chunks.push(`![${caption}](${item.image}){layout=inline}`);
    }
  }

  return chunks.join("\n\n");
}

export function articleFlowTextToBlocks(flowZh: string, flowEn: string): ArticleContentBlock[] {
  const zhNodes = parseArticleFlowNodes(flowZh);
  const enNodes = parseArticleFlowNodes(flowEn);
  const useZhAsPrimary = zhNodes.length > 0 || enNodes.length === 0;
  const primaryNodes = useZhAsPrimary ? zhNodes : enNodes;
  const enParagraphs = enNodes.filter((node): node is Extract<ArticleFlowNode, { type: "paragraph" }> => node.type === "paragraph");
  const enImages = enNodes.filter((node): node is Extract<ArticleFlowNode, { type: "image" }> => node.type === "image");

  let paragraphCursor = 0;
  let imageCursor = 0;

  return primaryNodes.map((node) => {
    if (node.type === "paragraph") {
      const enText = enParagraphs[paragraphCursor]?.text ?? "";
      paragraphCursor += 1;
      return {
        type: "paragraph" as const,
        content: {
          zh: useZhAsPrimary ? node.text : "",
          en: useZhAsPrimary ? enText : node.text,
        },
      };
    }

    const enCaption = enImages[imageCursor]?.caption ?? "";
    imageCursor += 1;

    return {
      type: "image" as const,
      image: node.image,
      layout: node.layout,
      caption: {
        zh: useZhAsPrimary ? node.caption : "",
        en: useZhAsPrimary ? enCaption : node.caption,
      },
    };
  });
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

export type ArticleImageReference = {
  key: string;
  image: string;
  caption: BilingualText;
  layout: "wide" | "inline";
};

function getArticleSourceBlocks(source: Article | ArticleContentBlock[] | undefined, fallbackBody: BilingualText[] = []) {
  if (!source) {
    return normalizeArticleContentBlocks([], fallbackBody);
  }

  if (Array.isArray(source)) {
    return normalizeArticleContentBlocks(source, fallbackBody);
  }

  return normalizeArticleContentBlocks(source.contentBlocks, source.body);
}

function trimExcerptText(value: string, limit: number) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "";
  }

  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit).trim()}...`;
}

export function getArticleImageReferences(
  source: Article | ArticleContentBlock[] | undefined,
  fallbackBody: BilingualText[] = [],
) {
  const blocks = getArticleSourceBlocks(source, fallbackBody);
  const references: ArticleImageReference[] = [];

  blocks.forEach((block, blockIndex) => {
    if (block.type === "image") {
      if (!block.image.trim()) {
        return;
      }

      references.push({
        key: `image-${blockIndex}`,
        image: block.image,
        caption: block.caption,
        layout: block.layout === "inline" ? "inline" : "wide",
      });
      return;
    }

    if (block.type === "imagePair") {
      block.items.forEach((item, itemIndex) => {
        if (!item.image.trim()) {
          return;
        }

        references.push({
          key: `image-pair-${blockIndex}-${itemIndex}`,
          image: item.image,
          caption: item.caption,
          layout: "inline",
        });
      });
    }
  });

  return references;
}

export function getArticleAutoExcerpt(
  source: Article | ArticleContentBlock[] | undefined,
  fallbackBody: BilingualText[] = [],
  limits: { zh?: number; en?: number } = {},
) {
  const blocks = getArticleSourceBlocks(source, fallbackBody);
  const zhParagraph = blocks.find((block) => block.type === "paragraph" && block.content.zh.trim());
  const enParagraph = blocks.find((block) => block.type === "paragraph" && block.content.en.trim());

  return {
    zh: trimExcerptText(zhParagraph?.type === "paragraph" ? zhParagraph.content.zh : "", limits.zh ?? 88),
    en: trimExcerptText(enParagraph?.type === "paragraph" ? enParagraph.content.en : "", limits.en ?? 160),
  };
}

export function getArticleFallbackCover(
  source: Article | ArticleContentBlock[] | undefined,
  fallbackBody: BilingualText[] = [],
) {
  return getArticleImageReferences(source, fallbackBody)[0]?.image ?? "";
}

export function articleHasBodyContent(article: Article) {
  return getRenderableArticleContentBlocks(article).some((block) => block.type === "paragraph");
}
