import { articleHasBodyContent } from "./article-content";
import { KNOWN_ZH_COPY_TYPO_FIXES } from "./copy-quality";
import type { Article, Artwork, BilingualText, Exhibition } from "./data/types";

const UNTITLED_ARTWORK_TITLES = new Set(["未命名藏品", "Untitled Artwork"]);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type ValidationSection =
  | "basic"
  | "images"
  | "scholarly"
  | "references"
  | "catalogue"
  | "body";

export type ValidationIssue = {
  field: string;
  section: ValidationSection;
  message: string;
  level: "error" | "warning";
};

function getPrimaryText(text: BilingualText | undefined) {
  return text?.zh.trim() || text?.en.trim() || "";
}

function hasMeaningfulArtworkTitle(text: BilingualText | undefined) {
  const primary = getPrimaryText(text);
  return Boolean(primary) && !UNTITLED_ARTWORK_TITLES.has(primary);
}

function addIssue(issues: ValidationIssue[], issue: ValidationIssue) {
  issues.push(issue);
}

function addBilingualCompletenessWarnings(
  issues: ValidationIssue[],
  section: ValidationSection,
  fieldBase: string,
  label: string,
  value: BilingualText | undefined,
) {
  const zh = value?.zh.trim() ?? "";
  const en = value?.en.trim() ?? "";

  if (zh && !en) {
    addIssue(issues, {
      field: `${fieldBase}.en`,
      section,
      message: `建议补充${label}英文，保证双语一致。`,
      level: "warning",
    });
  }

  if (en && !zh) {
    addIssue(issues, {
      field: `${fieldBase}.zh`,
      section,
      message: `建议补充${label}中文，保证双语一致。`,
      level: "warning",
    });
  }
}

function addBilingualLengthGapWarning(
  issues: ValidationIssue[],
  section: ValidationSection,
  fieldBase: string,
  label: string,
  value: BilingualText | undefined,
) {
  const zh = value?.zh.trim() ?? "";
  const en = value?.en.trim() ?? "";

  if (!zh || !en) {
    return;
  }

  const longSide = Math.max(zh.length, en.length);
  const shortSide = Math.max(1, Math.min(zh.length, en.length));
  const ratio = longSide / shortSide;

  if (longSide >= 600 && ratio >= 4.5) {
    addIssue(issues, {
      field: `${fieldBase}.en`,
      section,
      message: `${label}中英文篇幅差异较大，建议确认英文是否为完整版本。`,
      level: "warning",
    });
  }
}

function addZhTypoWarnings(
  issues: ValidationIssue[],
  section: ValidationSection,
  field: string,
  value: string,
) {
  const text = value.trim();

  if (!text) {
    return;
  }

  for (const item of KNOWN_ZH_COPY_TYPO_FIXES) {
    if (!text.includes(item.wrong)) {
      continue;
    }

    addIssue(issues, {
      field,
      section,
      message: `检测到“${item.wrong}”，建议改为“${item.correct}”。`,
      level: "warning",
    });
  }
}

function validateSlugValue(
  slug: string,
  section: ValidationSection,
  duplicateCount: number,
  label = "slug",
) {
  if (!slug.trim()) {
    return {
      field: "slug",
      section,
      message: `请填写${label}。`,
      level: "error" as const,
    };
  }

  if (!SLUG_PATTERN.test(slug.trim())) {
    return {
      field: "slug",
      section,
      message: `${label} 只能使用小写字母、数字和连字符。`,
      level: "error" as const,
    };
  }

  if (duplicateCount > 1) {
    return {
      field: "slug",
      section,
      message: `${label} 不能重复，请换一个更明确的地址。`,
      level: "error" as const,
    };
  }

  return null;
}

export function getArtworkPublicationIssues(artwork: Artwork, artworks: Artwork[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const duplicateSlugCount = artworks.filter((item) => item.slug.trim() === artwork.slug.trim()).length;
  const slugIssue = validateSlugValue(artwork.slug, "basic", duplicateSlugCount, "slug");

  if (slugIssue) {
    addIssue(issues, slugIssue);
  }

  if (!artwork.title.zh.trim() || UNTITLED_ARTWORK_TITLES.has(artwork.title.zh.trim())) {
    addIssue(issues, { field: "title.zh", section: "basic", message: "请填写中文标题。", level: "error" });
  }

  if (!artwork.title.en.trim() || UNTITLED_ARTWORK_TITLES.has(artwork.title.en.trim())) {
    addIssue(issues, { field: "title.en", section: "basic", message: "请填写英文标题。", level: "error" });
  }

  if (!getPrimaryText(artwork.category)) {
    addIssue(issues, { field: "category.zh", section: "basic", message: "请填写作品门类。", level: "error" });
  }

  if (!artwork.status) {
    addIssue(issues, { field: "status", section: "basic", message: "请确认前台状态。", level: "error" });
  }

  if (!getPrimaryText(artwork.period)) {
    addIssue(issues, { field: "period.zh", section: "basic", message: "请填写年代。", level: "error" });
  }

  if (!getPrimaryText(artwork.region) && !getPrimaryText(artwork.origin)) {
    addIssue(issues, { field: "region.zh", section: "basic", message: "请填写地区或产地。", level: "error" });
  }

  if (!getPrimaryText(artwork.material)) {
    addIssue(issues, { field: "material.zh", section: "basic", message: "请填写材质。", level: "error" });
  }

  if (!getPrimaryText(artwork.dimensions)) {
    addIssue(issues, { field: "dimensions.zh", section: "basic", message: "请填写尺寸。", level: "error" });
  }

  if (!getPrimaryText(artwork.excerpt)) {
    addIssue(issues, { field: "excerpt.zh", section: "scholarly", message: "请填写简述。", level: "error" });
  }

  if (!getPrimaryText(artwork.viewingNote) && !getPrimaryText(artwork.comparisonNote)) {
    addIssue(issues, { field: "viewingNote.zh", section: "scholarly", message: "请至少填写一项学术说明。", level: "error" });
  }

  addBilingualCompletenessWarnings(issues, "scholarly", "excerpt", "简述", artwork.excerpt);
  addBilingualCompletenessWarnings(issues, "scholarly", "viewingNote", "观看描述", artwork.viewingNote);
  addBilingualCompletenessWarnings(issues, "scholarly", "comparisonNote", "比较判断", artwork.comparisonNote);
  addBilingualLengthGapWarning(issues, "scholarly", "viewingNote", "观看描述", artwork.viewingNote);
  addZhTypoWarnings(issues, "scholarly", "excerpt.zh", artwork.excerpt?.zh ?? "");
  addZhTypoWarnings(issues, "scholarly", "viewingNote.zh", artwork.viewingNote?.zh ?? "");
  addZhTypoWarnings(issues, "scholarly", "comparisonNote.zh", artwork.comparisonNote?.zh ?? "");

  if (!artwork.image.trim()) {
    addIssue(issues, { field: "image", section: "images", message: "请上传主图。", level: "error" });
  }

  if (!artwork.gallery?.some((item) => item.trim())) {
    addIssue(issues, { field: "gallery", section: "images", message: "建议至少补充一张细节图。", level: "warning" });
  }

  if (!artwork.provenance.length && !artwork.exhibitions.length && !artwork.publications.length) {
    addIssue(issues, { field: "provenance", section: "references", message: "建议补充来源、展览或出版记录。", level: "warning" });
  }

  return issues;
}

export function getExhibitionPublicationIssues(exhibition: Exhibition, exhibitions: Exhibition[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const duplicateSlugCount = exhibitions.filter((item) => item.slug.trim() === exhibition.slug.trim()).length;
  const slugIssue = validateSlugValue(exhibition.slug, "basic", duplicateSlugCount, "slug");

  if (slugIssue) {
    addIssue(issues, slugIssue);
  }

  if (!exhibition.title.zh.trim()) {
    addIssue(issues, { field: "title.zh", section: "basic", message: "请填写中文标题。", level: "error" });
  }

  if (!exhibition.title.en.trim()) {
    addIssue(issues, { field: "title.en", section: "basic", message: "请填写英文标题。", level: "error" });
  }

  if (!getPrimaryText(exhibition.period)) {
    addIssue(issues, { field: "period.zh", section: "basic", message: "请填写展览日期。", level: "error" });
  }

  if (!getPrimaryText(exhibition.venue)) {
    addIssue(issues, { field: "venue.zh", section: "basic", message: "请填写地点。", level: "error" });
  }

  if (!exhibition.cover.trim()) {
    addIssue(issues, { field: "cover", section: "basic", message: "请上传封面图。", level: "error" });
  }

  if (!getPrimaryText(exhibition.intro)) {
    addIssue(issues, { field: "intro.zh", section: "basic", message: "请填写展览简介。", level: "error" });
  }

  if (!exhibition.highlightArtworkSlugs.length) {
    addIssue(issues, { field: "highlightArtworkSlugs", section: "catalogue", message: "建议至少关联一件重点作品。", level: "warning" });
  }

  if (!getPrimaryText(exhibition.catalogueTitle) && !exhibition.cataloguePages && !getPrimaryText(exhibition.catalogueIntro)) {
    addIssue(issues, { field: "catalogue", section: "catalogue", message: "建议补充图录信息。", level: "warning" });
  }

  return issues;
}

export function getArticlePublicationIssues(article: Article, articles: Article[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const duplicateSlugCount = articles.filter((item) => item.slug.trim() === article.slug.trim()).length;
  const slugIssue = validateSlugValue(article.slug, "basic", duplicateSlugCount, "slug");

  if (slugIssue) {
    addIssue(issues, slugIssue);
  }

  if (!article.title.zh.trim()) {
    addIssue(issues, { field: "title.zh", section: "basic", message: "请填写中文标题。", level: "error" });
  }

  if (!article.title.en.trim()) {
    addIssue(issues, { field: "title.en", section: "basic", message: "请填写英文标题。", level: "error" });
  }

  if (!getPrimaryText(article.category) && !getPrimaryText(article.column)) {
    addIssue(issues, { field: "category.zh", section: "basic", message: "请填写分类或栏目。", level: "error" });
  }

  if (!article.date.trim()) {
    addIssue(issues, { field: "date", section: "basic", message: "请填写发布时间。", level: "error" });
  }

  if (!getPrimaryText(article.excerpt)) {
    addIssue(issues, { field: "excerpt.zh", section: "basic", message: "请填写摘要。", level: "error" });
  }

  if (!articleHasBodyContent(article)) {
    addIssue(issues, { field: "body.0.zh", section: "body", message: "请填写正文主体。", level: "error" });
  }

  if (!article.cover.trim()) {
    addIssue(issues, { field: "cover", section: "basic", message: "请上传封面图。", level: "error" });
  }

  return issues;
}
