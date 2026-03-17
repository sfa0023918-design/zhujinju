"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  articleBlocksToFlowText,
  articleFlowTextToBlocks,
  createArticleImageBlock,
  createArticleImagePairBlock,
  createArticleParagraphBlock,
  getArticleAutoExcerpt,
  getArticleBodyParagraphs,
  getArticleFallbackCover,
  getArticleImageReferences,
  normalizeArticleContentBlocks,
} from "@/lib/article-content";
import type {
  Article,
  ArticleContentBlock,
  Artwork,
  ArtworkStatus,
  BilingualText,
  EditableSectionKey,
  EditableSectionValueMap,
  Exhibition,
  ProvenanceEntry,
  PublicationReference,
  PublicationStatus,
  SiteContent,
} from "@/lib/site-data";
import type { ValidationIssue } from "@/lib/publication-validation";
import { getArticlePublicationIssues, getArtworkPublicationIssues, getExhibitionPublicationIssues } from "@/lib/publication-validation";

import { AdminMediaField, prepareAdminImageUpload, readAdminUploadResponse } from "./admin-media-field";
import { getLocalizedText, getParagraphsByLocale, type ReadingLocale } from "./bilingual-prose";

type AdminCmsEditorProps = {
  section: EditableSectionKey;
  title: string;
  description: string;
  initialValue: EditableSectionValueMap[EditableSectionKey];
  content: SiteContent;
  autoCreate?: boolean;
  initialSearch?: string;
  initialStatusFilter?: string;
  initialFocus?: string;
};

type SavePhase = "idle" | "saving" | "saved" | "error" | "creating";

type SaveState = {
  phase: SavePhase;
  message?: string;
};

class AdminValidationError extends Error {
  issues: ValidationIssue[];

  constructor(message: string, issues: ValidationIssue[]) {
    super(message);
    this.name = "AdminValidationError";
    this.issues = issues;
  }
}

type SyncPhase = "waiting" | "publishing" | "live" | "error";

type SyncTarget =
  | { section: "artworks"; id: string }
  | { section: "exhibitions" }
  | { section: "articles" };

type SyncState = {
  phase: SyncPhase;
  message?: string;
  lastSavedAt?: number;
  lastLiveAt?: number;
  hasPendingChanges: boolean;
  publicImpact?: boolean;
};

const ARTICLE_INLINE_RECOMMENDED_LIMIT = "2.8MB";
const ARTICLE_INLINE_HARD_LIMIT = "4MB";

type ArticleImageOrientation = "portrait" | "landscape";
type ArticleEditorLocale = "zh" | "en";

const ARTICLE_IMAGE_PRESETS: Record<ArticleImageOrientation, { label: string; ratio: string; width: number; height: number }> = {
  portrait: {
    label: "竖构图",
    ratio: "3:4",
    width: 1200,
    height: 1600,
  },
  landscape: {
    label: "横构图",
    ratio: "4:3",
    width: 1600,
    height: 1200,
  },
};

type AutosaveOptions<T> = {
  validate?: (value: T) => string | null;
  prepare?: (value: T) => T;
};

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

let translationQueue: Promise<void> = Promise.resolve();
let lastQueuedTranslationAt = 0;

async function runQueuedTranslation<T>(task: () => Promise<T>) {
  const previous = translationQueue;
  let release!: () => void;
  translationQueue = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previous.catch(() => {});

  const minGapMs = 900;
  const elapsed = Date.now() - lastQueuedTranslationAt;
  if (elapsed < minGapMs) {
    await sleep(minGapMs - elapsed);
  }

  lastQueuedTranslationAt = Date.now();

  try {
    return await task();
  } finally {
    release();
  }
}

function emptyBilingual(): BilingualText {
  return { zh: "", en: "" };
}

function getArtworkId(artwork: Artwork) {
  return artwork.id ?? artwork.slug;
}

function updateArrayItem<T>(items: T[], index: number, updater: (item: T) => void) {
  const next = [...items];
  next[index] = cloneValue(next[index]);
  updater(next[index]);
  return next;
}

function moveArrayItem<T>(items: T[], from: number, to: number) {
  if (from === to) {
    return items;
  }

  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function removeArrayItem<T>(items: T[], index: number) {
  return items.filter((_, currentIndex) => currentIndex !== index);
}

function normalizeLineText(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

function normalizeLongText(value: string) {
  const normalized = normalizeLineText(value);

  if (!normalized) {
    return "";
  }

  const paragraphDelimiter = /\n\s*\n+/.test(normalized) ? /\n\s*\n+/ : /\n+/;

  return normalized
    .split(paragraphDelimiter)
    .map((paragraph) => paragraph.replace(/[ \t]{2,}/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
}

function normalizeMultilineTextPreserve(value: string) {
  return value.replace(/\r\n/g, "\n");
}

function normalizeBilingualText(value: BilingualText, mode: "line" | "long" = "line"): BilingualText {
  return {
    zh: mode === "long" ? normalizeLongText(value.zh) : normalizeLineText(value.zh),
    en: mode === "long" ? normalizeLongText(value.en) : normalizeLineText(value.en),
  };
}

function normalizeArtworkDraft(value: Artwork) {
  const next = cloneValue(value);
  next.title = normalizeBilingualText(next.title);
  next.subtitle = normalizeBilingualText(next.subtitle, "long");
  next.slug = normalizeLineText(next.slug);
  next.period = normalizeBilingualText(next.period);
  next.region = normalizeBilingualText(next.region);
  next.origin = normalizeBilingualText(next.origin);
  next.material = normalizeBilingualText(next.material);
  next.category = normalizeBilingualText(next.category);
  next.dimensions = normalizeBilingualText(next.dimensions);
  next.image = normalizeLineText(next.image);
  next.gallery = (next.gallery ?? []).map((item) => normalizeLineText(item)).filter(Boolean);
  next.excerpt = normalizeBilingualText(next.excerpt, "long");
  next.viewingNote = {
    zh: normalizeMultilineTextPreserve(next.viewingNote.zh),
    en: normalizeMultilineTextPreserve(next.viewingNote.en),
  };
  next.comparisonNote = normalizeBilingualText(next.comparisonNote, "long");
  next.provenance = (next.provenance ?? []).map((item) => ({
    ...item,
    label: normalizeBilingualText(item.label),
    note: item.note ? normalizeBilingualText(item.note, "long") : item.note,
  }));
  next.exhibitions = (next.exhibitions ?? []).map((item) => ({
    ...item,
    title: normalizeBilingualText(item.title),
    venue: normalizeBilingualText(item.venue),
    year: normalizeLineText(item.year),
  }));
  next.publications = (next.publications ?? []).map((item) => ({
    ...item,
    title: normalizeBilingualText(item.title),
    year: normalizeLineText(item.year),
    pages: normalizeBilingualText(item.pages),
    note: item.note ? normalizeBilingualText(item.note, "long") : item.note,
  }));
  next.inquirySupport = (next.inquirySupport ?? []).map((item) => normalizeBilingualText(item));
  return next;
}

function normalizeExhibitionDraft(value: Exhibition) {
  const next = cloneValue(value);
  next.title = normalizeBilingualText(next.title);
  next.subtitle = normalizeBilingualText(next.subtitle);
  next.slug = normalizeLineText(next.slug);
  next.period = normalizeBilingualText(next.period);
  next.venue = normalizeBilingualText(next.venue);
  next.cover = normalizeLineText(next.cover);
  next.intro = normalizeBilingualText(next.intro, "long");
  const curatorialNote = normalizeBilingualText(next.curatorialNote ?? next.curatorialLead, "long");
  next.curatorialLead = curatorialNote;
  next.curatorialNote = curatorialNote;
  next.description = (next.description ?? []).map((item) => normalizeBilingualText(item, "long"));
  next.catalogueTitle = normalizeBilingualText(next.catalogueTitle);
  const catalogueNote = normalizeBilingualText(next.catalogueNote ?? next.catalogueIntro, "long");
  next.catalogueIntro = catalogueNote;
  next.catalogueNote = catalogueNote;
  next.cataloguePageImages = (next.cataloguePageImages ?? []).map((item) => normalizeLineText(item)).filter(Boolean);
  next.featuredWorksCount = Number((next.featuredWorksCount ?? next.highlightCount ?? next.highlightArtworkSlugs.length) || 0);
  next.highlightCount = next.featuredWorksCount;
  next.cataloguePageCount = Number(next.cataloguePageCount ?? next.cataloguePages ?? 0);
  next.cataloguePages = next.cataloguePageCount;
  return next;
}

function normalizeArticleDraft(value: Article) {
  const next = cloneValue(value);
  next.title = normalizeBilingualText(next.title);
  next.slug = normalizeLineText(next.slug);
  next.date = normalizeLineText(next.date);
  next.category = normalizeBilingualText(next.category);
  next.column = normalizeBilingualText(next.column);
  next.author = normalizeBilingualText(next.author);
  next.cover = normalizeLineText(next.cover);
  next.excerpt = normalizeBilingualText(next.excerpt, "long");
  next.contentBlocks = normalizeArticleContentBlocks(next.contentBlocks, next.body);
  next.body = getArticleBodyParagraphs(next.contentBlocks, next.body);
  const autoExcerpt = getArticleAutoExcerpt(next);
  next.excerpt = {
    zh: next.excerpt.zh || autoExcerpt.zh,
    en: next.excerpt.en || autoExcerpt.en,
  };
  const autoCover = getArticleFallbackCover(next);
  if (!next.cover && autoCover) {
    next.cover = autoCover;
    next.coverAsset = undefined;
  }
  next.keywords = (next.keywords ?? []).map((item) => normalizeBilingualText(item));
  return next;
}

const WARNING_SECTION_PRIORITY: Record<ValidationIssue["section"], number> = {
  basic: 1,
  scholarly: 2,
  images: 3,
  references: 4,
  catalogue: 5,
  body: 6,
};

function issueSummaryLabel(issue: ValidationIssue) {
  const raw = issue.message.replace(/。$/, "");
  return issue.level === "error" ? raw.replace(/^请/, "") : raw.replace(/^建议/, "");
}

function warningPriority(issue: ValidationIssue) {
  if (issue.level !== "warning") {
    return 99;
  }

  const message = issue.message;

  if (message.includes("双语一致") || message.includes("补充")) {
    return 1;
  }

  if (message.includes("篇幅差异")) {
    return 2;
  }

  if (message.includes("检测到")) {
    return 3;
  }

  return 4;
}

function getPrioritizedWarnings(issues: ValidationIssue[]) {
  return issues
    .filter((issue) => issue.level === "warning")
    .sort((a, b) => {
      const warningRank = warningPriority(a) - warningPriority(b);

      if (warningRank !== 0) {
        return warningRank;
      }

      const sectionRank = WARNING_SECTION_PRIORITY[a.section] - WARNING_SECTION_PRIORITY[b.section];

      if (sectionRank !== 0) {
        return sectionRank;
      }

      return issueSummaryLabel(a).localeCompare(issueSummaryLabel(b), "zh-Hans-CN");
    });
}

function summarizeIssueBadges(issues: ValidationIssue[], limit = 2) {
  const blockingBadges = issues
    .filter((issue) => issue.level === "error")
    .slice(0, limit)
    .map((issue) => issueSummaryLabel(issue));

  if (blockingBadges.length) {
    return blockingBadges;
  }

  return getPrioritizedWarnings(issues)
    .slice(0, limit)
    .map((issue) => `提醒：${issueSummaryLabel(issue)}`);
}

async function requestJson<T>(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  const raw = await response.text();

  try {
    const payload = JSON.parse(raw) as T & { error?: string; issues?: ValidationIssue[] };

    if (!response.ok) {
      if (Array.isArray(payload.issues) && payload.issues.length) {
        throw new AdminValidationError(payload.error ?? "当前内容尚不能发布。", payload.issues);
      }

      throw new Error(payload.error ?? "请求失败。");
    }

    return payload;
  } catch (error) {
    if (error instanceof Error && error.message !== "Unexpected end of JSON input") {
      throw error;
    }

    throw new Error(raw.trim() || "请求失败。");
  }
}

function useLeavePageProtection(shouldWarn: boolean) {
  useEffect(() => {
    if (!shouldWarn) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (window.__zhujinjuAdminNavBypass) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [shouldWarn]);
}

function findFieldTarget(fieldKey: string) {
  if (typeof window === "undefined") {
    return null;
  }

  return document.querySelector<HTMLElement>(`[data-field-key="${CSS.escape(fieldKey)}"]`);
}

function highlightFieldTarget(target: HTMLElement) {
  target.classList.remove("admin-field-highlight");
  void target.offsetWidth;
  target.classList.add("admin-field-highlight");
  window.setTimeout(() => {
    target.classList.remove("admin-field-highlight");
  }, 1800);
}

function locateFieldTarget(fieldKey: string, section?: string) {
  const directTarget = findFieldTarget(fieldKey);

  if (directTarget) {
    directTarget.scrollIntoView({ behavior: "smooth", block: "center" });
    const focusable =
      directTarget.matches("input, textarea, select, button, [tabindex]:not([tabindex='-1'])")
        ? directTarget
        : directTarget.querySelector<HTMLElement>("input, textarea, select, button, [tabindex]:not([tabindex='-1'])");

    focusable?.focus({ preventScroll: true });
    highlightFieldTarget(directTarget);
    return;
  }

  const arrayMatch = fieldKey.match(/^([a-zA-Z0-9_-]+)\.(\d+)(?:\.[a-zA-Z0-9_-]+)?$/);

  if (arrayMatch) {
    const baseKey = arrayMatch[1];
    const addTarget = findFieldTarget(`${baseKey}.add`);

    if (addTarget) {
      addTarget.scrollIntoView({ behavior: "smooth", block: "center" });
      const focusable =
        addTarget.matches("input, textarea, select, button, [tabindex]:not([tabindex='-1'])")
          ? addTarget
          : addTarget.querySelector<HTMLElement>("input, textarea, select, button, [tabindex]:not([tabindex='-1'])");

      focusable?.focus({ preventScroll: true });
      highlightFieldTarget(addTarget);
      return;
    }

    const baseTarget = findFieldTarget(baseKey);

    if (baseTarget) {
      baseTarget.scrollIntoView({ behavior: "smooth", block: "center" });
      highlightFieldTarget(baseTarget);
      return;
    }
  }

  if (!section) {
    return;
  }

  const sectionTarget = document.getElementById(`section-${section}`);
  if (!sectionTarget) {
    return;
  }

  sectionTarget.scrollIntoView({ behavior: "smooth", block: "start" });
  highlightFieldTarget(sectionTarget);
}

function useInitialFieldFocus(initialFocus?: string, section?: string) {
  useEffect(() => {
    if (!initialFocus) {
      return;
    }

    const timer = window.setTimeout(() => {
      locateFieldTarget(initialFocus, section);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [initialFocus, section]);
}

function formatStatusTime(timestamp?: number) {
  if (!timestamp) {
    return "尚无记录";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function buildSyncStatusUrl(target: SyncTarget) {
  const params = new URLSearchParams({ section: target.section });

  if (target.section === "artworks") {
    params.set("id", target.id);
  }

  return `/api/admin/sync-status?${params.toString()}`;
}

function useWebsiteSyncStatus({
  target,
  changeToken,
  hasPendingChanges,
}: {
  target: SyncTarget | null;
  changeToken: string;
  hasPendingChanges: boolean;
}) {
  const [syncState, setSyncState] = useState<SyncState>({
    phase: "live",
    message: "当前网站内容已同步。",
    hasPendingChanges: false,
    publicImpact: true,
  });
  const initialTokenRef = useRef(changeToken);
  const pollTimerRef = useRef<number | null>(null);

  const clearPolling = useCallback(() => {
    if (pollTimerRef.current) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const pollSyncStatus = useCallback(
    async (nextTarget: SyncTarget, attempt = 0) => {
      setSyncState((current) => ({
        ...current,
        phase: attempt === 0 ? "waiting" : "publishing",
        message:
          attempt === 0
            ? "内容已保存，正在等待正式站同步。若本次包含新上传图片，系统会继续触发正式站部署。"
            : "正式站正在同步最新内容。若刚上传图片，请等待自动部署完成后再刷新前台。",
        hasPendingChanges: true,
        publicImpact: true,
      }));

      try {
        const response = await fetch(buildSyncStatusUrl(nextTarget), { cache: "no-store" });
        const payload = (await response.json()) as {
          sync?: {
            ready: boolean;
            publicImpact: boolean;
            message: string;
          };
          error?: string;
        };

        if (!response.ok || !payload.sync) {
          throw new Error(payload.error ?? "网站状态读取失败。");
        }

        const syncPayload = payload.sync;

        if (!syncPayload.publicImpact) {
          setSyncState((current) => ({
            ...current,
            phase: "waiting",
            message: syncPayload.message,
            hasPendingChanges: false,
            publicImpact: false,
          }));
          clearPolling();
          return;
        }

        if (syncPayload.ready) {
          setSyncState((current) => ({
            ...current,
            phase: "live",
            message: syncPayload.message,
            hasPendingChanges: false,
            lastLiveAt: Date.now(),
            publicImpact: true,
          }));
          clearPolling();
          return;
        }

        if (attempt >= 7) {
          setSyncState((current) => ({
            ...current,
            phase: "error",
            message: "内容已保存，但正式站暂未完成同步。通常是部署仍在排队，请稍后刷新前台，不必重复上传。",
            hasPendingChanges: true,
            publicImpact: true,
          }));
          clearPolling();
          return;
        }

        pollTimerRef.current = window.setTimeout(() => {
          void pollSyncStatus(nextTarget, attempt + 1);
        }, 2000);
      } catch (error) {
        setSyncState((current) => ({
          ...current,
          phase: "error",
          message: error instanceof Error ? error.message : "网站状态读取失败。",
          hasPendingChanges: true,
          publicImpact: current.publicImpact,
        }));
        clearPolling();
      }
    },
    [clearPolling],
  );

  useEffect(() => {
    if (!target) {
      setSyncState({
        phase: "live",
        message: "当前网站内容已同步。",
        hasPendingChanges,
        publicImpact: true,
      });
      return;
    }

    if (changeToken === initialTokenRef.current) {
      setSyncState((current) => ({ ...current, hasPendingChanges }));
      return;
    }

    initialTokenRef.current = changeToken;
    setSyncState((current) => ({
      ...current,
      lastSavedAt: Date.now(),
      hasPendingChanges: true,
    }));
    void pollSyncStatus(target);

    return clearPolling;
  }, [changeToken, clearPolling, hasPendingChanges, pollSyncStatus, target]);

  useEffect(() => clearPolling, [clearPolling]);

  useEffect(() => {
    setSyncState((current) => ({
      ...current,
      hasPendingChanges: hasPendingChanges || current.phase === "waiting" || current.phase === "publishing",
    }));
  }, [hasPendingChanges]);

  return syncState;
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[0.72rem] tracking-[0.18em] text-[var(--accent)]">{children}</p>;
}

function SectionBlock({
  title,
  description,
  children,
  id,
  issues,
  reminders,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  id?: string;
  issues?: ValidationIssue[];
  reminders?: string[];
}) {
  const blockingIssues = issues?.filter((issue) => issue.level === "error") ?? [];
  const warningIssues = issues?.filter((issue) => issue.level === "warning") ?? [];

  return (
    <section id={id} className="space-y-4 border border-[var(--line)] bg-[var(--surface)] p-5 md:p-6 scroll-mt-28">
      <div className="space-y-2 border-b border-[var(--line)] pb-4">
        <Label>{title}</Label>
        {description ? <p className="text-sm leading-7 text-[var(--muted)]">{description}</p> : null}
        {reminders?.length ? (
          <p className="text-sm leading-7 text-[var(--accent)]/88">{reminders.join("、")}</p>
        ) : null}
        {blockingIssues.length ? (
          <p className="text-sm leading-7 text-[#8e4e3b]">
            {blockingIssues.map((issue) => issue.message).join("、")}
          </p>
        ) : null}
        {warningIssues.length ? (
          <p className="text-sm leading-7 text-[#8b7867]">{`提醒：${warningIssues.map((issue) => issue.message).join("、")}`}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function ValidationSummary({
  issues,
  sectionLabels,
}: {
  issues: ValidationIssue[];
  sectionLabels: Record<string, string>;
}) {
  const blocking = issues.filter((issue) => ("level" in issue ? issue.level === "error" : true));
  const warnings = getPrioritizedWarnings(issues);
  const firstWarning = warnings[0];

  if (!blocking.length && !warnings.length) {
    return null;
  }

  return (
    <div className={`space-y-3 border p-4 ${blocking.length ? "border-[#d8c1b5] bg-[#fbf5f1]" : "border-[#d8cec2] bg-[#f7f4ef]"}`}>
      {blocking.length ? (
        <>
          <p className="text-sm leading-7 text-[#8e4e3b]">
            当前内容尚不能发布，请先完成以下字段：
            {blocking.map((issue) => issue.message.replace(/^请/, "").replace(/。$/, "")).join("、")}
          </p>
          <div className="flex flex-wrap gap-2">
            {blocking.map((issue, index) => {
              return (
                <button
                  key={`${issue.field}-error-${index}`}
                  type="button"
                  onClick={() => {
                    locateFieldTarget(issue.field, issue.section);
                  }}
                  className="border border-[#d8c1b5] px-3 py-1.5 text-xs leading-5 text-[#8e4e3b] transition-colors hover:bg-[#f7ede7]"
                >
                  {`${sectionLabels[issue.section] ?? issue.section} · ${issue.message.replace(/^请/, "").replace(/。$/, "")}`}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <p className="text-sm leading-7 text-[#736659]">当前内容可发布，以下为建议优化项：</p>
      )}
      {warnings.length ? (
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs tracking-[0.12em] text-[#736659]">建议按以下顺序修复：</p>
            {firstWarning ? (
              <button
                type="button"
                onClick={() => {
                  locateFieldTarget(firstWarning.field, firstWarning.section);
                }}
                className="border border-[#d8cec2] px-3 py-1.5 text-xs leading-5 text-[#736659] transition-colors hover:bg-[#f0ece5]"
              >
                一键从第 1 项开始修复
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
          {warnings.map((issue, index) => {
            return (
              <button
                key={`${issue.field}-warning-${index}`}
                type="button"
                onClick={() => {
                  locateFieldTarget(issue.field, issue.section);
                }}
                className="border border-[#d8cec2] px-3 py-1.5 text-xs leading-5 text-[#736659] transition-colors hover:bg-[#f0ece5]"
              >
                {`#${index + 1} ${sectionLabels[issue.section] ?? issue.section} · ${issueSummaryLabel(issue)}`}
              </button>
            );
          })}
        </div>
        </div>
      ) : null}
    </div>
  );
}

function StatusBar({
  title,
  state,
  sync,
  actions,
  isDirty = false,
}: {
  title: string;
  state: SaveState;
  sync?: SyncState;
  actions?: React.ReactNode;
  isDirty?: boolean;
}) {
  const statusLabel =
    state.phase === "error"
      ? "保存失败"
      : isDirty
        ? "未保存"
      : state.phase === "saved"
        ? "已保存"
        : state.phase === "saving" || state.phase === "creating"
          ? "正在保存"
          : "未修改";
  const tone =
    state.phase === "error"
      ? "text-[#8e4e3b]"
      : isDirty
        ? "text-[var(--muted)]"
      : state.phase === "saved"
        ? "text-[var(--ink)]"
        : "text-[var(--muted)]";
  const syncLabel = sync
    ? !sync.publicImpact
      ? "等待同步"
      : sync.phase === "waiting"
        ? "等待同步"
        : sync.phase === "publishing"
          ? "正在发布"
          : sync.phase === "live"
            ? "已上线"
            : "发布失败"
    : null;

  return (
    <div className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--bg)]/96 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4 px-1 py-4 md:px-0">
        <div className="space-y-3">
          <p className="text-[0.72rem] tracking-[0.2em] text-[var(--accent)]">内容状态</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-[1.9rem] leading-none tracking-[-0.04em] text-[var(--ink)] md:text-[2.6rem]">
              {title}
            </h1>
            <span className={`text-sm ${tone}`}>{statusLabel}</span>
            {state.message ? <span className="text-xs leading-6 text-[var(--muted)]">{state.message}</span> : null}
          </div>
          {sync ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--line)] pt-3 text-xs leading-6 text-[var(--muted)]">
              <span className="tracking-[0.14em] text-[var(--accent)]">网站状态</span>
              <span>{syncLabel}</span>
              <span>{`最近保存：${formatStatusTime(sync.lastSavedAt)}`}</span>
              <span>{`最近上线：${sync.publicImpact ? formatStatusTime(sync.lastLiveAt) : "尚未上线"}`}</span>
              <span>{`待同步更改：${sync.hasPendingChanges ? "有" : "无"}`}</span>
              {sync.message ? <span>{sync.message}</span> : null}
            </div>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  fieldKey,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "url" | "date" | "number";
  placeholder?: string;
  fieldKey?: string;
}) {
  return (
    <label className="grid gap-2">
      <Label>{label}</Label>
      <input
        data-field-key={fieldKey}
        data-ime-active="false"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onCompositionStart={(event) => {
          event.currentTarget.dataset.imeActive = "true";
        }}
        onCompositionEnd={(event) => {
          event.currentTarget.dataset.imeActive = "false";
        }}
        placeholder={placeholder}
        className="min-h-11 border border-[var(--line)] bg-white/60 px-3 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
  fieldKey,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  fieldKey?: string;
}) {
  return (
    <label className="grid gap-2">
      <Label>{label}</Label>
      <textarea
        data-field-key={fieldKey}
        data-ime-active="false"
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onCompositionStart={(event) => {
          event.currentTarget.dataset.imeActive = "true";
        }}
        onCompositionEnd={(event) => {
          event.currentTarget.dataset.imeActive = "false";
        }}
        className="w-full border border-[var(--line)] bg-white/60 px-3 py-3 text-sm leading-7 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
      />
    </label>
  );
}

function BilingualInput({
  label,
  value,
  onChange,
  fieldKeys,
}: {
  label: string;
  value: BilingualText;
  onChange: (value: BilingualText) => void;
  fieldKeys?: {
    zh?: string;
    en?: string;
  };
}) {
  const [translationPhase, setTranslationPhase] = useState<"idle" | "queued" | "running">("idle");
  const [translateError, setTranslateError] = useState<string | null>(null);
  const translating = translationPhase !== "idle";

  async function translate(force = false) {
    const zh = value.zh.trim();

    if (!zh || (!force && value.en.trim())) {
      return;
    }

    setTranslationPhase("queued");
    setTranslateError(null);

    try {
      const payload = await runQueuedTranslation(async () => {
        setTranslationPhase("running");
        return requestJson<{ translation?: string; error?: string }>("/api/admin/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: zh,
            label,
          }),
        });
      });

      if (!payload.translation) {
        throw new Error("英文翻译失败。");
      }

      onChange({
        zh: value.zh,
        en: payload.translation,
      });
    } catch (error) {
      setTranslateError(error instanceof Error ? error.message : "英文翻译失败。");
    } finally {
      setTranslationPhase("idle");
    }
  }

  return (
    <div className="grid gap-3 border border-[var(--line)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between gap-4">
        <Label>{label}</Label>
        <button
          type="button"
          onClick={() => void translate(true)}
          disabled={translating || !value.zh.trim()}
          className="text-xs tracking-[0.14em] text-[var(--accent)] transition-colors hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {translationPhase === "queued" ? "排队中..." : translationPhase === "running" ? "翻译中..." : "根据中文生成英文"}
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <TextField
          label="中文"
          value={value.zh}
          onChange={(zh) => onChange({ ...value, zh })}
          fieldKey={fieldKeys?.zh}
        />
        <TextField
          label="英文"
          value={value.en}
          onChange={(en) => onChange({ ...value, en })}
          fieldKey={fieldKeys?.en}
        />
      </div>
      {translateError ? <p className="text-sm leading-7 text-[#8e4e3b]">{translateError}</p> : null}
    </div>
  );
}

function BilingualTextarea({
  label,
  value,
  onChange,
  rows = 4,
  fieldKeys,
}: {
  label: string;
  value: BilingualText;
  onChange: (value: BilingualText) => void;
  rows?: number;
  fieldKeys?: {
    zh?: string;
    en?: string;
  };
}) {
  const [translationPhase, setTranslationPhase] = useState<"idle" | "queued" | "running">("idle");
  const [translateError, setTranslateError] = useState<string | null>(null);
  const translating = translationPhase !== "idle";

  async function translate(force = false) {
    const zh = value.zh.trim();

    if (!zh || (!force && value.en.trim())) {
      return;
    }

    setTranslationPhase("queued");
    setTranslateError(null);

    try {
      const payload = await runQueuedTranslation(async () => {
        setTranslationPhase("running");
        return requestJson<{ translation?: string; error?: string }>("/api/admin/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: zh,
            label,
          }),
        });
      });

      if (!payload.translation) {
        throw new Error("英文翻译失败。");
      }

      onChange({
        zh: value.zh,
        en: payload.translation,
      });
    } catch (error) {
      setTranslateError(error instanceof Error ? error.message : "英文翻译失败。");
    } finally {
      setTranslationPhase("idle");
    }
  }

  return (
    <div className="grid gap-3 border border-[var(--line)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between gap-4">
        <Label>{label}</Label>
        <button
          type="button"
          onClick={() => void translate(true)}
          disabled={translating || !value.zh.trim()}
          className="text-xs tracking-[0.14em] text-[var(--accent)] transition-colors hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {translationPhase === "queued" ? "排队中..." : translationPhase === "running" ? "翻译中..." : "根据中文生成英文"}
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <TextAreaField
          label="中文"
          rows={rows}
          value={value.zh}
          onChange={(zh) => onChange({ ...value, zh })}
          fieldKey={fieldKeys?.zh}
        />
        <TextAreaField
          label="英文"
          rows={rows}
          value={value.en}
          onChange={(en) => onChange({ ...value, en })}
          fieldKey={fieldKeys?.en}
        />
      </div>
      {translateError ? <p className="text-sm leading-7 text-[#8e4e3b]">{translateError}</p> : null}
    </div>
  );
}

function insertImageMarkdownAtCursor(
  currentText: string,
  textarea: HTMLTextAreaElement | null,
  markdownLine: string,
) {
  const safeText = currentText ?? "";

  if (!textarea) {
    return `${safeText}${safeText.trim() ? "\n\n" : ""}${markdownLine}\n\n`;
  }

  const start = textarea.selectionStart ?? safeText.length;
  const end = textarea.selectionEnd ?? safeText.length;
  const before = safeText.slice(0, start);
  const after = safeText.slice(end);
  const prefix = before.trimEnd().length ? "\n\n" : "";
  const suffix = after.trimStart().length ? "\n\n" : "\n";

  return `${before}${prefix}${markdownLine}${suffix}${after}`;
}

function updateBilingualLocaleValue(
  value: BilingualText,
  locale: ArticleEditorLocale,
  nextLocaleValue: string,
) {
  return locale === "zh"
    ? { ...value, zh: nextLocaleValue }
    : { ...value, en: nextLocaleValue };
}

function countFlowImages(value: string) {
  return (value.match(/!\[[^\]]*\]\([^)]+\)(?:\{layout=(?:wide|inline)\})?/g) ?? []).length;
}

function countVisibleFlowCharacters(value: string) {
  return value
    .replace(/^!\[[^\]]*\]\([^)]+\)(?:\{layout=(?:wide|inline)\})?$/gm, "")
    .replace(/\s+/g, "")
    .trim().length;
}

function summarizeArticleStructure(blocks: ArticleContentBlock[]) {
  const summary = blocks.reduce(
    (current, block) => {
      if (block.type === "paragraph") {
        current.paragraphs += 1;
      } else if (block.type === "image") {
        current.images += 1;
      } else {
        current.imagePairs += 1;
      }

      return current;
    },
    { paragraphs: 0, images: 0, imagePairs: 0 },
  );

  const parts = [`${blocks.length} 个内容块`];

  if (summary.paragraphs) {
    parts.push(`${summary.paragraphs} 段文字`);
  }

  if (summary.images) {
    parts.push(`${summary.images} 张单图`);
  }

  if (summary.imagePairs) {
    parts.push(`${summary.imagePairs} 组双图`);
  }

  return parts.join(" · ");
}

function ArticleBodyFlowPreview({
  value,
  locale,
  previewMap,
}: {
  value: BilingualText;
  locale: ReadingLocale;
  previewMap?: Record<string, string>;
}) {
  const blocks = useMemo(
    () =>
      normalizeArticleContentBlocks(articleFlowTextToBlocks(value.zh, value.en)).filter((block) => {
        if (block.type === "paragraph") {
          return Boolean(block.content.zh.trim() || block.content.en.trim());
        }

        if (block.type === "image") {
          return Boolean(block.image.trim());
        }

        return block.items.some((item) => item.image.trim());
      }),
    [value.en, value.zh],
  );

  if (!blocks.length) {
    return (
      <div className="border border-dashed border-[var(--line)]/70 bg-white/55 px-4 py-8 text-center text-sm leading-7 text-[var(--muted)]">
        写入正文或插入图片后，这里会立即显示排版预览。
      </div>
    );
  }

  return (
    <div className="space-y-8 border border-[var(--line)]/70 bg-white/70 px-4 py-6 md:px-6">
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          const paragraphs = getParagraphsByLocale(block.content, locale);

          if (!paragraphs.length) {
            return null;
          }

          return (
            <div key={`body-flow-preview-paragraph-${index}`} className="space-y-5">
              {paragraphs.map((paragraph, paragraphIndex) => (
                <p
                  key={`body-flow-preview-paragraph-${index}-${paragraphIndex}`}
                  lang={locale === "en" ? "en" : "zh-CN"}
                  className={`mx-auto max-w-[42rem] text-[1rem] leading-[2.02] text-[var(--ink)] ${
                    locale === "zh" ? "indent-[2em]" : ""
                  }`}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          );
        }

        if (block.type === "image") {
          const caption = getLocalizedText(block.caption, locale);

          return (
            <figure
              key={`body-flow-preview-image-${index}`}
              className={`mx-auto space-y-3 ${block.layout === "inline" ? "max-w-[26rem]" : "max-w-[42rem]"}`}
            >
              <Image
                src={previewMap?.[block.image] ?? block.image}
                alt={caption || `Article body preview ${index + 1}`}
                width={1600}
                height={1200}
                unoptimized
                className={`mx-auto h-auto max-w-full bg-[var(--surface-strong)] object-contain ${
                  block.layout === "inline" ? "w-auto" : "w-full"
                }`}
              />
              {caption ? (
                <figcaption
                  lang={locale === "en" ? "en" : "zh-CN"}
                  className="text-center text-[0.78rem] leading-[1.8] text-[var(--accent)]/78"
                >
                  {caption}
                </figcaption>
              ) : null}
            </figure>
          );
        }

        const visibleItems = block.items.filter((item) => item.image.trim());

        if (!visibleItems.length) {
          return null;
        }

        return (
          <div
            key={`body-flow-preview-image-pair-${index}`}
            className={`mx-auto grid max-w-[42rem] gap-4 md:gap-5 ${visibleItems.length > 1 ? "md:grid-cols-2" : ""}`}
          >
            {visibleItems.map((item, itemIndex) => {
              const caption = getLocalizedText(item.caption, locale);

              return (
                <figure key={`body-flow-preview-image-pair-${index}-${itemIndex}`} className="space-y-3">
                  <Image
                    src={previewMap?.[item.image] ?? item.image}
                    alt={caption || `Article body preview ${index + 1}-${itemIndex + 1}`}
                    width={1200}
                    height={900}
                    unoptimized
                    className="h-auto w-full bg-[var(--surface-strong)] object-contain"
                  />
                  {caption ? (
                    <figcaption
                      lang={locale === "en" ? "en" : "zh-CN"}
                      className="text-center text-[0.78rem] leading-[1.8] text-[var(--accent)]/78"
                    >
                      {caption}
                    </figcaption>
                  ) : null}
                </figure>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function ArticleBodyFlowEditor({
  value,
  onChange,
  activeLocale,
  onActiveLocaleChange,
  previewMap,
  onPreviewResolve,
}: {
  value: BilingualText;
  onChange: (value: BilingualText) => void;
  activeLocale: ArticleEditorLocale;
  onActiveLocaleChange: (locale: ArticleEditorLocale) => void;
  previewMap?: Record<string, string>;
  onPreviewResolve?: (imageUrl: string, previewUrl: string | null) => void;
}) {
  const [draft, setDraft] = useState<BilingualText>(value);
  const draftRef = useRef<BilingualText>(value);
  const [orientation, setOrientation] = useState<ArticleImageOrientation>("portrait");
  const [layout, setLayout] = useState<"wide" | "inline">("wide");
  const [uploadingLocale, setUploadingLocale] = useState<"zh" | "en" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const zhTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const enTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const zhFileInputRef = useRef<HTMLInputElement | null>(null);
  const enFileInputRef = useRef<HTMLInputElement | null>(null);
  const preset = ARTICLE_IMAGE_PRESETS[orientation];
  const activeValue = activeLocale === "zh" ? draft.zh : draft.en;
  const activeLabel = activeLocale === "zh" ? "中文正文" : "English Body";
  const activeInsertLabel = activeLocale === "zh" ? "插入图片" : "Insert Image";
  const activeUploadingLabel = activeLocale === "zh" ? "上传中..." : "Uploading...";
  const activeBodyCount = countVisibleFlowCharacters(activeValue);
  const activeImageCount = countFlowImages(activeValue);

  useEffect(() => {
    setDraft((current) => {
      if (current.zh === value.zh && current.en === value.en) {
        return current;
      }

      return {
        zh: value.zh,
        en: value.en,
      };
    });
    draftRef.current = {
      zh: value.zh,
      en: value.en,
    };
  }, [value.en, value.zh]);

  function update(next: BilingualText) {
    draftRef.current = next;
    setDraft(next);
    onChange(next);
  }

  async function uploadImageAndInsert(locale: "zh" | "en", file: File) {
    setUploadingLocale(locale);
    setMessage(null);
    setError(null);

    try {
      const prepared = await prepareAdminImageUpload(file, { width: preset.width, height: preset.height });
      const formData = new FormData();
      formData.append("file", prepared.file);
      formData.append("folder", "articles/references");
      formData.append("assetWidth", String(prepared.width));
      formData.append("assetHeight", String(prepared.height));

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const { payload, raw } = await readAdminUploadResponse(response);

      if (!response.ok || !payload.url) {
        if (
          response.status === 413 ||
          /request entity too large/i.test(raw) ||
          /function_payload_too_large/i.test(raw)
        ) {
          throw new Error(
            `图片过大，系统已自动压缩。建议上传前控制在 ${ARTICLE_INLINE_RECOMMENDED_LIMIT} 内（服务器硬上限 ${ARTICLE_INLINE_HARD_LIMIT}）。`,
          );
        }
        throw new Error(payload.error ?? (raw.trim() || "图片上传失败。"));
      }

      const markdown = `![${locale === "zh" ? "图注" : "Caption"}](${payload.url})${layout === "inline" ? "{layout=inline}" : ""}`;
      const targetTextarea = locale === "zh" ? zhTextareaRef.current : enTextareaRef.current;
      const currentValue = draftRef.current;
      const currentLocaleValue = locale === "zh" ? currentValue.zh : currentValue.en;
      const nextLocaleValue = insertImageMarkdownAtCursor(currentLocaleValue, targetTextarea, markdown);
      const nextValue = updateBilingualLocaleValue(currentValue, locale, nextLocaleValue);

      update(nextValue);
      onPreviewResolve?.(payload.url, prepared.previewUrl);
      setMessage(payload.message ?? "图片已插入当前光标位置。前台会自动按正文宽度排版，不需要再手动调整。");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "图片上传失败。");
    } finally {
      setUploadingLocale(null);
    }
  }

  function getClipboardImage(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = event.clipboardData?.items;

    if (!items?.length) {
      return null;
    }

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        return item.getAsFile();
      }
    }

    return null;
  }

  function handleTextareaPaste(locale: "zh" | "en", event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const file = getClipboardImage(event);

    if (!file) {
      return;
    }

    event.preventDefault();
    void uploadImageAndInsert(locale, file);
  }

  return (
    <div className="grid gap-4 border-t border-[var(--line)]/70 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center rounded-full border border-[var(--line)] bg-white/70 p-1">
          {(["zh", "en"] as const).map((locale) => {
            const active = activeLocale === locale;
            return (
              <button
                key={locale}
                type="button"
                onClick={() => onActiveLocaleChange(locale)}
                className={`min-w-14 rounded-full px-3 py-1.5 text-[0.68rem] tracking-[0.14em] transition-colors ${
                  active
                    ? "bg-[var(--ink)] text-white"
                    : "text-[var(--accent)] hover:text-[var(--ink)]"
                }`}
              >
                {locale === "zh" ? "中文" : "EN"}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs tracking-[0.12em] text-[var(--accent)]">
          <label className="flex items-center gap-2">
            <span>构图</span>
            <select
              value={orientation}
              onChange={(event) => setOrientation(event.target.value === "landscape" ? "landscape" : "portrait")}
              className="border border-[var(--line)] bg-white/70 px-2 py-1 text-xs text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
            >
              <option value="portrait">竖图（3:4）</option>
              <option value="landscape">横图（4:3）</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span>版式</span>
            <select
              value={layout}
              onChange={(event) => setLayout(event.target.value === "inline" ? "inline" : "wide")}
              className="border border-[var(--line)] bg-white/70 px-2 py-1 text-xs text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
            >
              <option value="wide">正文同宽</option>
              <option value="inline">窄图</option>
            </select>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.72rem] tracking-[0.18em] text-[var(--accent)]">{activeLabel}</p>
          <p className="mt-1 text-sm leading-7 text-[var(--muted)]">
            直接写正文，把光标放到目标位置后插图即可。系统会自动限制图片宽度，不会溢出正文。
          </p>
        </div>
        <button
          type="button"
          onClick={() => (activeLocale === "zh" ? zhFileInputRef.current?.click() : enFileInputRef.current?.click())}
          disabled={uploadingLocale !== null}
          className="inline-flex min-h-11 items-center justify-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {uploadingLocale === activeLocale ? activeUploadingLabel : activeInsertLabel}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs leading-6 text-[var(--muted)]">
        <span>{`正文 ${activeBodyCount} 字`}</span>
        <span>{`图片 ${activeImageCount} 张`}</span>
        <span>{`建议尺寸 ${preset.width} x ${preset.height}`}</span>
        <span>{`建议单张 ${ARTICLE_INLINE_RECOMMENDED_LIMIT} 内`}</span>
      </div>

      <textarea
        ref={activeLocale === "zh" ? zhTextareaRef : enTextareaRef}
        data-field-key={`body.flow.${activeLocale}`}
        rows={18}
        value={activeValue}
        onChange={(event) => update(updateBilingualLocaleValue(draft, activeLocale, event.target.value))}
        onPaste={(event) => handleTextareaPaste(activeLocale, event)}
        placeholder={
          activeLocale === "zh"
            ? "从这里开始写正文。回车分段，Cmd/Ctrl + V 可直接粘贴图片。"
            : "Write the English version here. You can also paste screenshots directly."
        }
        className="min-h-[460px] w-full border border-[var(--line)] bg-white/68 px-4 py-4 text-[1rem] leading-8 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
      />
      <div className="grid gap-3">
        <div className="space-y-1">
          <p className="text-[0.72rem] tracking-[0.18em] text-[var(--accent)]">
            {activeLocale === "zh" ? "即时预览" : "LIVE PREVIEW"}
          </p>
          <p className="text-sm leading-7 text-[var(--muted)]">
            这里会按前台排版方式显示当前正文，所以插入图片后不会在输入框里直接渲染，而会在这里立即看到效果。
          </p>
        </div>
        <ArticleBodyFlowPreview value={draft} locale={activeLocale} previewMap={previewMap} />
      </div>
      <input
        ref={zhFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            void uploadImageAndInsert("zh", file);
          }

          event.target.value = "";
        }}
      />
      <input
        ref={enFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            void uploadImageAndInsert("en", file);
          }

          event.target.value = "";
        }}
      />

      <p className="text-xs leading-6 text-[var(--muted)]/88">
        图片标记格式：<code>![图注](图片地址)</code>，窄图可用 <code>{`{layout=inline}`}</code>。
      </p>
      <p className="text-xs leading-6 text-[var(--muted)]/88">支持直接粘贴截图（Ctrl/Cmd + V）到正文中自动上传并插入。</p>
      {message ? <p className="text-sm leading-7 text-[var(--muted)]">{message}</p> : null}
      {error ? <p className="text-sm leading-7 text-[#8e4e3b]">{error}</p> : null}
    </div>
  );
}

function ArticleInlineImageField({
  label,
  value,
  onChange,
  defaultOrientation = "portrait",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  defaultOrientation?: ArticleImageOrientation;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [orientation, setOrientation] = useState<ArticleImageOrientation>(defaultOrientation);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const preset = ARTICLE_IMAGE_PRESETS[orientation];

  useEffect(() => {
    setOrientation(defaultOrientation);
  }, [defaultOrientation]);

  useEffect(
    () => () => {
      if (localPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(localPreview);
      }
    },
    [localPreview],
  );

  function replaceLocalPreview(nextPreview: string | null) {
    setLocalPreview((current) => {
      if (current?.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }
      return nextPreview;
    });
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploading(true);
    setMessage(null);
    setError(null);

    try {
      const prepared = await prepareAdminImageUpload(file, { width: preset.width, height: preset.height });
      const formData = new FormData();
      formData.append("file", prepared.file);
      formData.append("folder", "articles/references");
      formData.append("assetWidth", String(prepared.width));
      formData.append("assetHeight", String(prepared.height));

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const { payload, raw } = await readAdminUploadResponse(response);

      if (!response.ok || !payload.url) {
        if (
          response.status === 413 ||
          /request entity too large/i.test(raw) ||
          /function_payload_too_large/i.test(raw)
        ) {
          throw new Error(
            `图片过大，系统已自动压缩。建议上传前控制在 ${ARTICLE_INLINE_RECOMMENDED_LIMIT} 内（服务器硬上限 ${ARTICLE_INLINE_HARD_LIMIT}）。`,
          );
        }
        throw new Error(payload.error ?? (raw.trim() || "图片上传失败。"));
      }

      onChange(payload.url);
      replaceLocalPreview(prepared.previewUrl);
      setMessage(
        prepared.transformed
          ? "插图已自动裁切并压缩。保存当前文章后前台会显示。"
          : "插图已上传。保存当前文章后前台会显示。",
      );
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "图片上传失败。");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="grid gap-3 border border-[var(--line)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between gap-4">
        <Label>{label}</Label>
        <div className="flex flex-wrap items-center justify-end gap-3 text-xs tracking-[0.12em] text-[var(--accent)]">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center border border-[var(--line)] px-3 py-2 text-xs tracking-[0.12em] text-[var(--accent)] transition-colors hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {uploading ? "上传中..." : "导入图片"}
          </button>
          {value.trim() ? (
            <button
              type="button"
              onClick={() => {
                onChange("");
                replaceLocalPreview(null);
                setMessage("插图已移除。");
                setError(null);
              }}
              className="transition-colors hover:text-[var(--ink)]"
            >
              移除
            </button>
          ) : null}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.14em] text-[var(--accent)]">构图</span>
          <select
            value={orientation}
            onChange={(event) => setOrientation(event.target.value === "landscape" ? "landscape" : "portrait")}
            className="w-full border border-[var(--line)] bg-white/60 px-3 py-3 text-sm leading-7 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
          >
            <option value="portrait">竖构图（3:4）</option>
            <option value="landscape">横构图（4:3）</option>
          </select>
        </label>
        <p className="text-xs leading-6 text-[var(--muted)]">
          当前：{preset.label}，建议尺寸 {preset.width} x {preset.height}（{preset.ratio}）。系统会自动裁切压缩，建议单张 {ARTICLE_INLINE_RECOMMENDED_LIMIT} 内（硬上限 {ARTICLE_INLINE_HARD_LIMIT}）。
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void handleFileChange(event)}
      />
      <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
        <div className="relative overflow-hidden border border-[var(--line)]/60 bg-[var(--surface-strong)]">
          {localPreview || value.trim() ? (
            <Image
              src={localPreview ?? value}
              alt={label}
              width={1200}
              height={900}
              unoptimized
              className="aspect-[4/3] h-full w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center text-[0.68rem] tracking-[0.14em] text-[var(--accent)]/56">
              暂无插图
            </div>
          )}
        </div>
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.14em] text-[var(--accent)]">Image Path</span>
          <input
            type="text"
            value={value}
            onChange={(event) => {
              replaceLocalPreview(null);
              onChange(event.target.value);
            }}
            className="w-full border border-[var(--line)] bg-white/60 px-3 py-3 text-sm leading-7 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
          />
        </label>
      </div>
      {message ? <p className="text-sm leading-7 text-[var(--muted)]">{message}</p> : null}
      {error ? <p className="text-sm leading-7 text-[#8e4e3b]">{error}</p> : null}
    </div>
  );
}

function ArticleContentBlockEditor({
  block,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  block: ArticleContentBlock;
  index: number;
  total: number;
  onChange: (updater: (block: ArticleContentBlock) => ArticleContentBlock) => void;
  onMove: (direction: "up" | "down") => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-4 border border-[var(--line)]/68 bg-white/32 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm tracking-[0.04em] text-[var(--ink)]">
          {block.type === "paragraph" ? `正文段落 ${index + 1}` : block.type === "image" ? `插图 ${index + 1}` : `双图组 ${index + 1}`}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs tracking-[0.12em] text-[var(--accent)]">
          <button type="button" onClick={() => onMove("up")} disabled={index === 0} className="transition-colors hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-35">上移</button>
          <button type="button" onClick={() => onMove("down")} disabled={index === total - 1} className="transition-colors hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-35">下移</button>
          <button type="button" onClick={onRemove} className="transition-colors hover:text-[var(--ink)]">删除</button>
        </div>
      </div>

      {block.type === "paragraph" ? (
        <BilingualTextarea
          label="正文"
          value={block.content}
          onChange={(next) =>
            onChange((current) => ({
              ...(current as typeof block),
              content: next,
            }))
          }
          rows={5}
        />
      ) : null}

      {block.type === "image" ? (
        <div className="grid gap-4">
          <ArticleInlineImageField
            label="插图"
            value={block.image}
            defaultOrientation="portrait"
            onChange={(next) =>
              onChange((current) => ({
                ...(current as typeof block),
                image: next,
              }))
            }
          />
          <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-[0.14em] text-[var(--accent)]">Layout</span>
              <select
                value={block.layout ?? "wide"}
                onChange={(event) =>
                  onChange((current) => ({
                    ...(current as typeof block),
                    layout: event.target.value === "inline" ? "inline" : "wide",
                  }))
                }
                className="w-full border border-[var(--line)] bg-white/60 px-3 py-3 text-sm leading-7 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
              >
                <option value="wide">宽图</option>
                <option value="inline">窄图</option>
              </select>
            </label>
          </div>
          <BilingualTextarea
            label="图注"
            value={block.caption}
            onChange={(next) =>
              onChange((current) => ({
                ...(current as typeof block),
                caption: next,
              }))
            }
            rows={3}
          />
        </div>
      ) : null}

      {block.type === "imagePair" ? (
        <div className="grid gap-4">
          {block.items.map((item, itemIndex) => (
            <div key={`pair-item-${itemIndex}`} className="grid gap-4 border border-[var(--line)]/54 bg-[var(--surface)]/46 p-4">
              <ArticleInlineImageField
                label={`图片 ${itemIndex + 1}`}
                value={item.image}
                defaultOrientation="portrait"
                onChange={(next) =>
                  onChange((current) => {
                    const currentBlock = current as typeof block;
                    const items = cloneValue(currentBlock.items);
                    items[itemIndex].image = next;
                    return {
                      ...currentBlock,
                      items,
                    };
                  })
                }
              />
              <BilingualTextarea
                label={`图注 ${itemIndex + 1}`}
                value={item.caption}
                onChange={(next) =>
                  onChange((current) => {
                    const currentBlock = current as typeof block;
                    const items = cloneValue(currentBlock.items);
                    items[itemIndex].caption = next;
                    return {
                      ...currentBlock,
                      items,
                    };
                  })
                }
                rows={3}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RelationChecklist({
  label,
  options,
  selected,
  onToggle,
  fieldKey,
}: {
  label: string;
  options: Array<{ value: string; title: string; note?: string }>;
  selected: string[];
  onToggle: (value: string) => void;
  fieldKey?: string;
}) {
  return (
    <div data-field-key={fieldKey} className="space-y-3 border border-[var(--line)] bg-[var(--surface)] p-4">
      <Label>{label}</Label>
      <div className="grid gap-3 md:grid-cols-2">
        {options.map((option, index) => {
          const checked = selected.includes(option.value);

          return (
            <label
              key={option.value}
              data-field-key={fieldKey ? `${fieldKey}.${index}` : undefined}
              className={`grid gap-1 border px-4 py-3 ${
                checked
                  ? "border-[var(--line-strong)] bg-[var(--surface-strong)]"
                  : "border-[var(--line)] bg-white/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm leading-6 text-[var(--ink)]">{option.title}</p>
                  {option.note ? <p className="text-xs leading-5 text-[var(--muted)]">{option.note}</p> : null}
                </div>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(option.value)}
                  className="mt-1 h-4 w-4 accent-[var(--ink)]"
                />
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function ListSidebar<T>({
  items,
  selectedIndex,
  onSelect,
  renderTitle,
  renderMeta,
  renderWarnings,
  onAdd,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  heading,
  summary,
  getItemKey,
  listClassName,
  onReorder,
  draggedIndex,
  onDragIndexChange,
}: {
  items: T[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  renderTitle: (item: T, index: number) => string;
  renderMeta?: (item: T, index: number) => string;
  renderWarnings?: (item: T, index: number) => string[];
  onAdd: () => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  heading?: string;
  summary?: string;
  getItemKey?: (item: T, index: number) => string;
  listClassName?: string;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  draggedIndex?: number | null;
  onDragIndexChange?: (index: number | null) => void;
}) {
  const listRef = useRef<HTMLDivElement | null>(null);

  return (
    <div data-field-key="gallery" className="space-y-4">
      {heading || summary ? (
        <div className="space-y-1">
          {heading ? <p className="text-sm tracking-[0.04em] text-[var(--ink)]">{heading}</p> : null}
          {summary ? <p className="text-sm leading-7 text-[var(--muted)]">{summary}</p> : null}
        </div>
      ) : null}
      <div className="grid gap-3 border border-[var(--line)] bg-[var(--surface)] p-4">
        {onSearchChange ? (
          <input
            value={search ?? ""}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="搜索"
            className="min-h-11 border border-[var(--line)] bg-white/60 px-3 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
          />
        ) : null}
        {onStatusFilterChange ? (
          <select
            value={statusFilter ?? "all"}
            onChange={(event) => onStatusFilterChange(event.target.value)}
            className="min-h-11 border border-[var(--line)] bg-white/60 px-3 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
          >
            <option value="all">全部状态</option>
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
          </select>
        ) : null}
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex min-h-11 items-center justify-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)]"
        >
          新增
        </button>
      </div>
      <div
        ref={listRef}
        className={`grid gap-2 border border-[var(--line)] bg-[var(--surface)] p-3 ${listClassName ?? ""}`}
        onDragOver={(event) => {
          if (!onReorder || !listRef.current) {
            return;
          }

          event.preventDefault();

          const rect = listRef.current.getBoundingClientRect();
          const edgeThreshold = 72;
          const scrollStep = 28;

          if (event.clientY < rect.top + edgeThreshold) {
            listRef.current.scrollTop -= scrollStep;
          } else if (event.clientY > rect.bottom - edgeThreshold) {
            listRef.current.scrollTop += scrollStep;
          }
        }}
      >
        {items.length ? (
          items.map((item, index) => (
            <button
              key={getItemKey ? getItemKey(item, index) : `${renderTitle(item, index)}-${index}`}
              type="button"
              onClick={() => onSelect(index)}
              draggable={Boolean(onReorder && onDragIndexChange)}
              onDragStart={() => onDragIndexChange?.(index)}
              onDragEnd={() => onDragIndexChange?.(null)}
              onDragOver={(event) => {
                if (onReorder) {
                  event.preventDefault();
                }
              }}
              onDrop={() => {
                const nextDraggedIndex = draggedIndex;

                if (onReorder && typeof nextDraggedIndex === "number" && nextDraggedIndex !== index) {
                  onReorder(nextDraggedIndex, index);
                }
                onDragIndexChange?.(null);
              }}
              className={`grid gap-1 border px-4 py-3 text-left ${
                index === selectedIndex
                  ? "border-[var(--line-strong)] bg-[var(--surface-strong)]"
                  : "border-[var(--line)] bg-white/40"
              } ${draggedIndex === index ? "opacity-55" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm leading-6 text-[var(--ink)]">{renderTitle(item, index)}</p>
                {onReorder ? (
                  <span className="text-[11px] tracking-[0.14em] text-[var(--accent)]/72">拖动排序</span>
                ) : null}
              </div>
              {renderMeta ? <p className="text-xs leading-5 text-[var(--muted)]">{renderMeta(item, index)}</p> : null}
              {renderWarnings ? (
                <div className="flex flex-wrap gap-1 pt-1">
                  {renderWarnings(item, index).map((warning) => (
                    <span key={warning} className="border border-[#d8c1b5] px-2 py-0.5 text-[11px] leading-5 text-[#8e4e3b]">
                      {warning}
                    </span>
                  ))}
                </div>
              ) : null}
            </button>
          ))
        ) : (
          <p className="px-2 py-4 text-sm leading-7 text-[var(--muted)]">当前还没有内容。</p>
        )}
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  tone = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 items-center border px-4 text-sm transition-colors ${
        tone === "danger"
          ? "border-[var(--line)] text-[#8e4e3b] hover:border-[#8e4e3b]"
          : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
      }`}
    >
      {children}
    </button>
  );
}

function RecordStatusActions({
  publicationStatus,
  hasPendingChanges,
  onSaveCurrent,
  onSaveDraft,
  onSavePublish,
}: {
  publicationStatus: PublicationStatus;
  hasPendingChanges: boolean;
  onSaveCurrent: () => void;
  onSaveDraft: () => void;
  onSavePublish: () => void;
}) {
  return (
    <>
      <span className="text-sm text-[var(--muted)]">{publicationStatus === "published" ? "已发布" : "草稿"}</span>
      <button
        type="button"
        onClick={onSaveCurrent}
        className="inline-flex min-h-11 items-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)]"
      >
        {hasPendingChanges ? "保存当前修改" : "重新保存"}
      </button>
      <button
        type="button"
        onClick={onSaveDraft}
        className="inline-flex min-h-11 items-center border border-[var(--line)] px-4 text-sm text-[var(--muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
      >
        保存草稿
      </button>
      <button
        type="button"
        onClick={onSavePublish}
        className="inline-flex min-h-11 items-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)]"
      >
        保存并发布
      </button>
    </>
  );
}

function useAutosaveSection<T>(
  section: Exclude<EditableSectionKey, "artworks">,
  initialValue: T,
  options?: AutosaveOptions<T>,
) {
  const [draft, setDraft] = useState<T>(() => cloneValue(initialValue));
  const [persisted, setPersisted] = useState<T>(() => cloneValue(initialValue));
  const [saveState, setSaveState] = useState<SaveState>({ phase: "idle" });
  const requestRef = useRef(0);

  useEffect(() => {
    setDraft(cloneValue(initialValue));
    setPersisted(cloneValue(initialValue));
    setSaveState({ phase: "idle" });
  }, [initialValue, section]);

  const saveValue = useCallback(
    async (nextValue: T, _reason: "manual" = "manual", throwOnError = false) => {
      const requestId = requestRef.current + 1;
      const preparedValue = options?.prepare ? options.prepare(cloneValue(nextValue)) : cloneValue(nextValue);
      const validationError = options?.validate?.(preparedValue) ?? null;

      if (validationError) {
        setSaveState({ phase: "error", message: validationError });
        if (throwOnError) {
          throw new Error(validationError);
        }
        return;
      }

      requestRef.current = requestId;
      setSaveState({
        phase: "saving",
        message: "正在写入最新修改。",
      });

      try {
        const payload = await requestJson<{ value: T; message?: string }>(`/api/admin/sections/${section}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            value: preparedValue,
            baseValue: persisted,
          }),
        });

        if (requestRef.current !== requestId) {
          return;
        }

        setDraft(payload.value);
        setPersisted(payload.value);
        setSaveState({ phase: "saved", message: payload.message ?? "刚刚已保存。" });
      } catch (error) {
        if (requestRef.current !== requestId) {
          return;
        }

        setSaveState({
          phase: "error",
          message: error instanceof Error ? error.message : "保存失败。",
        });

        if (throwOnError) {
          throw error;
        }
      }
    },
    [options, persisted, section],
  );

  const serializedDraft = useMemo(() => JSON.stringify(draft), [draft]);
  const serializedPersisted = useMemo(() => JSON.stringify(persisted), [persisted]);
  const isDirty = serializedDraft !== serializedPersisted;

  useLeavePageProtection(isDirty || saveState.phase === "saving" || saveState.phase === "creating");

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    setSaveState((current) =>
      current.phase === "saving" || current.phase === "creating" || current.phase === "error" ? current : { phase: "idle" },
    );
  }, [isDirty]);

  return {
    draft,
    persisted,
    setDraft,
    setPersisted,
    isDirty,
    saveState,
    setSaveState,
    saveNow: saveValue,
  };
}

function ArtworkDetailGalleryGrid({
  artwork,
  onChangeGallery,
  onPersistGallery,
  onSaveStateChange,
  onSaveArtwork,
}: {
  artwork: Artwork;
  onChangeGallery: (gallery: string[]) => void;
  onPersistGallery: (gallery: string[], message: string) => void;
  onSaveStateChange: (state: SaveState) => void;
  onSaveArtwork: (artwork: Artwork) => Promise<void>;
}) {
  const gallery = artwork.gallery ?? [];
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<number | "append" | null>(null);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [previewMap, setPreviewMap] = useState<Record<string, string>>({});

  useEffect(() => {
    return () => {
      Object.values(previewMap).forEach((preview) => {
        if (preview.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [previewMap]);

  function setPreview(imageUrl: string, previewUrl: string | null) {
    setPreviewMap((current) => {
      const next = { ...current };
      const existing = current[imageUrl];

      if (existing?.startsWith("blob:") && existing !== previewUrl) {
        URL.revokeObjectURL(existing);
      }

      if (previewUrl) {
        next[imageUrl] = previewUrl;
      } else {
        delete next[imageUrl];
      }

      return next;
    });
  }

  async function handleUpload(file: File, index?: number) {
    if (!artwork.id?.trim()) {
      const message = "当前藏品还没有真实记录，暂时不能上传细节图。";
      setGalleryError(message);
      onSaveStateChange({ phase: "error", message });
      return;
    }

    const targetIndex = typeof index === "number" ? index : gallery.length;
    setUploadingSlot(typeof index === "number" ? index : "append");
    setGalleryError(null);
    onSaveStateChange({ phase: "saving", message: "正在上传并保存细节图。" });

    try {
      const prepared = await prepareAdminImageUpload(file, { width: 1200, height: 1500 });
      const formData = new FormData();
      formData.append("file", prepared.file);
      formData.append("folder", "artworks");
      formData.append("targetSection", "artworks");
      formData.append("targetId", artwork.id);
      formData.append("targetField", "gallery");
      formData.append("targetIndex", String(targetIndex));

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const { payload, raw } = await readAdminUploadResponse(response);

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? (raw.trim() || "细节图上传失败。"));
      }

      const nextGallery = [...gallery];
      nextGallery[targetIndex] = payload.url;
      onChangeGallery(nextGallery);
      onPersistGallery(nextGallery, "细节图已保存。");
      setPreview(payload.url, prepared.previewUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "细节图上传失败。";
      setGalleryError(message);
      onSaveStateChange({ phase: "error", message });
    } finally {
      setUploadingSlot(null);
    }
  }

  async function handleRemove(index: number) {
    if (!artwork.id?.trim()) {
      const message = "当前藏品还没有真实记录，暂时不能删除细节图。";
      setGalleryError(message);
      onSaveStateChange({ phase: "error", message });
      return;
    }

    const previousGallery = [...gallery];
    const removedImage = previousGallery[index];
    const nextGallery = removeArrayItem(previousGallery, index).filter((item) => item.trim());
    onChangeGallery(nextGallery);
    setGalleryError(null);
    onSaveStateChange({ phase: "saving", message: "正在删除细节图。" });

    try {
      const response = await fetch("/api/admin/media-field", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetSection: "artworks",
          targetId: artwork.id,
          targetField: "gallery",
          targetIndex: index,
          value: "",
        }),
      });
      const payload = (await response.json()) as { saved?: boolean; error?: string };

      if (!response.ok || !payload.saved) {
        throw new Error(payload.error ?? "细节图删除失败。");
      }

      onPersistGallery(nextGallery, "细节图已删除。");
      if (removedImage) {
        setPreview(removedImage, null);
      }
    } catch (error) {
      onChangeGallery(previousGallery);
      const message = error instanceof Error ? error.message : "细节图删除失败。";
      setGalleryError(message);
      onSaveStateChange({ phase: "error", message });
    }
  }

  async function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }

    const previousGallery = [...gallery];
    const nextGallery = moveArrayItem(previousGallery, dragIndex, targetIndex).filter((item) => item.trim());
    onChangeGallery(nextGallery);
    setGalleryError(null);
    onSaveStateChange({ phase: "saving", message: "正在保存细节图顺序。" });

    try {
      await onSaveArtwork({
        ...artwork,
        gallery: nextGallery,
      });
      onPersistGallery(nextGallery, "细节图顺序已保存。");
    } catch (error) {
      onChangeGallery(previousGallery);
      const message = error instanceof Error ? error.message : "细节图顺序保存失败。";
      setGalleryError(message);
      onSaveStateChange({ phase: "error", message });
    } finally {
      setDragIndex(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Label>细节图</Label>
          <p className="text-sm leading-7 text-[var(--muted)]">拖动卡片可调整前台显示顺序。新增图片会自动追加到最后，删除后顺序会自动收拢。</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {gallery.map((image, index) => (
          <div
            key={`${image}-${index}`}
            data-field-key={`gallery.${index}`}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => void handleDrop(index)}
            className={`space-y-3 border bg-white/40 p-3 transition-colors ${
              dragIndex === index ? "border-[var(--line-strong)] bg-[var(--surface-strong)]" : "border-[var(--line)]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs tracking-[0.14em] text-[var(--accent)]">{`细节图 ${index + 1}`}</span>
              <button
                type="button"
                className="cursor-grab text-xs tracking-[0.14em] text-[var(--muted)]"
                aria-label={`拖动排序 细节图 ${index + 1}`}
              >
                拖动排序
              </button>
            </div>
            <div className="relative overflow-hidden bg-[var(--surface-strong)]" style={{ aspectRatio: "4 / 5" }}>
              <Image
                src={previewMap[image] ?? image}
                alt={`细节图 ${index + 1}`}
                width={1200}
                height={1500}
                unoptimized
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex gap-2">
              <label className="inline-flex min-h-10 flex-1 cursor-pointer items-center justify-center border border-[var(--line-strong)] px-3 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)]">
                {uploadingSlot === index ? "处理中..." : "替换图片"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={uploadingSlot !== null}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void handleUpload(file, index);
                    }
                    event.target.value = "";
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => void handleRemove(index)}
                className="inline-flex min-h-10 items-center justify-center border border-[var(--line)] px-3 text-sm text-[var(--muted)] transition-colors hover:border-[#8e4e3b] hover:text-[#8e4e3b]"
              >
                删除
              </button>
            </div>
          </div>
        ))}
        {gallery.length < 8 ? (
          <label data-field-key="gallery.add" className="flex min-h-[260px] cursor-pointer flex-col items-center justify-center gap-3 border border-dashed border-[var(--line-strong)] bg-white/20 p-4 text-center transition-colors hover:bg-[var(--surface-strong)]">
            <span className="text-sm text-[var(--ink)]">{uploadingSlot === "append" ? "处理中..." : "新增细节图"}</span>
            <span className="text-xs leading-6 text-[var(--muted)]">系统会自动裁切并压缩为前台适用尺寸。</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploadingSlot !== null}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleUpload(file);
                }
                event.target.value = "";
              }}
            />
          </label>
        ) : null}
      </div>
      {galleryError ? <p className="text-sm leading-7 text-[#8e4e3b]">{galleryError}</p> : null}
    </div>
  );
}


function ArtworkEditor({
  title,
  description,
  initialValue,
  content,
  autoCreate,
  initialSearch,
  initialStatusFilter,
  initialFocus,
}: {
  title: string;
  description: string;
  initialValue: Artwork[];
  content: SiteContent;
  autoCreate?: boolean;
  initialSearch?: string;
  initialStatusFilter?: string;
  initialFocus?: string;
}) {
  const [artworks, setArtworks] = useState<Artwork[]>(() => cloneValue(initialValue));
  const [persisted, setPersisted] = useState<Artwork[]>(() => cloneValue(initialValue));
  const [selectedId, setSelectedId] = useState<string | null>(initialValue[0] ? getArtworkId(initialValue[0]) : null);
  const [search, setSearch] = useState(initialSearch ?? "");
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter ?? "all");
  const [saveState, setSaveState] = useState<SaveState>({ phase: "idle" });
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [draggedArtworkIndex, setDraggedArtworkIndex] = useState<number | null>(null);
  const requestRef = useRef(0);
  const sectionLabels = {
    basic: "基础信息",
    images: "图片",
    scholarly: "学术说明",
    references: "来源与记录",
  } satisfies Record<string, string>;

  useEffect(() => {
    setArtworks(cloneValue(initialValue));
    setPersisted(cloneValue(initialValue));
    setSelectedId(initialValue[0] ? getArtworkId(initialValue[0]) : null);
    setSearch(initialSearch ?? "");
    setStatusFilter(initialStatusFilter ?? "all");
    setSaveState({ phase: "idle" });
    setValidationIssues([]);
  }, [initialSearch, initialStatusFilter, initialValue]);

  const serializedArtworks = useMemo(() => JSON.stringify(artworks), [artworks]);
  const serializedPersisted = useMemo(() => JSON.stringify(persisted), [persisted]);
  const hasPendingChanges = serializedArtworks !== serializedPersisted;

  useLeavePageProtection(hasPendingChanges || saveState.phase === "saving" || saveState.phase === "creating");

  const createArtwork = useCallback(async () => {
    setSaveState({ phase: "creating", message: "正在创建草稿藏品..." });

    try {
      const payload = await requestJson<{ artwork: Artwork; artworks: Artwork[]; message?: string }>("/api/admin/artworks", {
        method: "POST",
      });

      setArtworks(payload.artworks);
      setPersisted(payload.artworks);
      setSelectedId(getArtworkId(payload.artwork));
      setValidationIssues([]);
      setSaveState({ phase: "saved", message: payload.message ?? "草稿已创建，现在可以直接上传图片。" });
    } catch (error) {
      setSaveState({
        phase: "error",
        message: error instanceof Error ? error.message : "新增藏品失败。",
      });
    }
  }, []);

  useEffect(() => {
    if (autoCreate && !initialValue.length) {
      void createArtwork();
    }
  }, [autoCreate, createArtwork, initialValue.length]);

  const filteredArtworks = useMemo(() => {
    return artworks.filter((artwork) => {
      const matchesSearch =
        !search.trim() ||
        artwork.title.zh.toLowerCase().includes(search.trim().toLowerCase()) ||
        artwork.slug.toLowerCase().includes(search.trim().toLowerCase());
      const matchesStatus =
        statusFilter === "all" || (artwork.publicationStatus ?? "draft") === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [artworks, search, statusFilter]);

  const selectedArtwork =
    artworks.find((artwork) => getArtworkId(artwork) === selectedId) ??
    filteredArtworks[0] ??
    artworks[0] ??
    null;
  const selectedPersistedArtwork =
    persisted.find((artwork) => getArtworkId(artwork) === selectedId) ??
    (selectedArtwork ? persisted.find((artwork) => getArtworkId(artwork) === getArtworkId(selectedArtwork)) : null) ??
    null;
  const selectedIndex = selectedArtwork
    ? artworks.findIndex((artwork) => getArtworkId(artwork) === getArtworkId(selectedArtwork))
    : -1;
  const duplicateArtwork = useCallback(async () => {
    if (!selectedArtwork) {
      return;
    }

    setSaveState({ phase: "creating", message: "正在复制当前藏品..." });

    try {
      const payload = await requestJson<{ artwork: Artwork; artworks: Artwork[]; message?: string }>("/api/admin/artworks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceId: getArtworkId(selectedArtwork),
        }),
      });

      setArtworks(payload.artworks);
      setPersisted(payload.artworks);
      setSelectedId(getArtworkId(payload.artwork));
      setValidationIssues([]);
      setSaveState({ phase: "saved", message: payload.message ?? "已复制当前藏品。" });
    } catch (error) {
      setSaveState({
        phase: "error",
        message: error instanceof Error ? error.message : "复制藏品失败。",
      });
    }
  }, [selectedArtwork]);

  const syncState = useWebsiteSyncStatus({
    target: selectedArtwork ? { section: "artworks", id: getArtworkId(selectedArtwork) } : null,
    changeToken: JSON.stringify(selectedPersistedArtwork ?? null),
    hasPendingChanges: hasPendingChanges || saveState.phase === "saving" || saveState.phase === "creating",
  });

  useInitialFieldFocus(initialFocus, "basic");

  useEffect(() => {
    if (!selectedArtwork && filteredArtworks[0]) {
      setSelectedId(getArtworkId(filteredArtworks[0]));
    }
  }, [filteredArtworks, selectedArtwork]);

  const articleOptions = content.articles.map((article) => ({
    value: article.slug,
    title: article.title.zh || article.slug,
    note: article.column.zh || article.author.zh,
  }));
  const exhibitionOptions = content.exhibitions.map((exhibition) => ({
    value: exhibition.slug,
    title: exhibition.title.zh || exhibition.slug,
    note: exhibition.period.zh || exhibition.venue.zh,
  }));
  const sectionIssues = {
    basic: validationIssues.filter((issue) => issue.section === "basic"),
    images: validationIssues.filter((issue) => issue.section === "images"),
    scholarly: validationIssues.filter((issue) => issue.section === "scholarly"),
    references: validationIssues.filter((issue) => issue.section === "references"),
  };

  function updateSelected(recipe: (artwork: Artwork) => void) {
    if (!selectedArtwork) {
      return;
    }

    setArtworks((current) => {
      const next = [...current];
      const index = next.findIndex((item) => getArtworkId(item) === getArtworkId(selectedArtwork));

      if (index < 0) {
        return current;
      }

      next[index] = cloneValue(next[index]);
      recipe(next[index]);
      setValidationIssues([]);
      return next;
    });
  }

  function updatePersistedSelected(recipe: (artwork: Artwork) => void, message = "藏品已保存。") {
    if (!selectedArtwork) {
      return;
    }

    setPersisted((current) => {
      const next = [...current];
      const index = next.findIndex((item) => getArtworkId(item) === getArtworkId(selectedArtwork));

      if (index < 0) {
        return current;
      }

      next[index] = cloneValue(next[index]);
      recipe(next[index]);
      return next;
    });
    setSaveState({ phase: "saved", message });
    setValidationIssues([]);
  }

  const saveArtwork = useCallback(
    async (artwork: Artwork, reason: "manual" = "manual") => {
      const artworkId = getArtworkId(artwork);
      const requestId = requestRef.current + 1;
      const preparedArtwork = normalizeArtworkDraft(artwork);
      const baseArtwork = persisted.find((item) => getArtworkId(item) === artworkId);

      requestRef.current = requestId;
      setSaveState({
        phase: "saving",
        message: "正在写入这件藏品的最新修改。",
      });

      try {
        const payload = await requestJson<{ artwork: Artwork; artworks: Artwork[]; message?: string }>(
          `/api/admin/artworks/${artworkId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              artwork: preparedArtwork,
              baseArtwork,
            }),
          },
        );

        if (requestRef.current !== requestId) {
          return;
        }

        setArtworks(payload.artworks);
        setPersisted(payload.artworks);
        setSelectedId(artworkId);
        setSaveState({ phase: "saved", message: payload.message ?? "藏品已保存。" });
        setValidationIssues([]);
      } catch (error) {
        if (requestRef.current !== requestId) {
          return;
        }

        if (error instanceof AdminValidationError) {
          setValidationIssues(error.issues);
        }
        setSaveState({
          phase: "error",
          message: error instanceof Error ? error.message : "保存藏品失败。",
        });
        throw error;
      }
    },
    [persisted],
  );

  useEffect(() => {
    if (!hasPendingChanges) {
      return;
    }

    setSaveState((current) =>
      current.phase === "saving" || current.phase === "creating" || current.phase === "error"
        ? current
        : { phase: "idle" },
    );
  }, [hasPendingChanges]);

  async function deleteSelectedArtwork() {
    if (!selectedArtwork) {
      return;
    }

    setSaveState({ phase: "saving", message: "正在删除藏品..." });

    try {
      const artworkId = getArtworkId(selectedArtwork);
      const payload = await requestJson<{ artworks: Artwork[]; message?: string }>(`/api/admin/artworks/${artworkId}`, {
        method: "DELETE",
      });

      setArtworks(payload.artworks);
      setPersisted(payload.artworks);
      setSelectedId(payload.artworks[0] ? getArtworkId(payload.artworks[0]) : null);
      setSaveState({ phase: "saved", message: payload.message ?? "藏品已删除。" });
    } catch (error) {
      setSaveState({
        phase: "error",
        message: error instanceof Error ? error.message : "删除藏品失败。",
      });
    }
  }

  async function reorderCurrentArtwork(direction: "up" | "down") {
    if (!selectedArtwork) {
      return;
    }

    const currentIndex = artworks.findIndex((artwork) => getArtworkId(artwork) === getArtworkId(selectedArtwork));
    const nextIndex = direction === "up" ? Math.max(0, currentIndex - 1) : Math.min(artworks.length - 1, currentIndex + 1);

    if (currentIndex === nextIndex) {
      return;
    }

    const nextArtworks = moveArrayItem(artworks, currentIndex, nextIndex);
    const orderedIds = nextArtworks.map((artwork) => getArtworkId(artwork));

    setArtworks(nextArtworks);
    setSelectedId(getArtworkId(selectedArtwork));
    setSaveState({ phase: "saving", message: "正在更新排序..." });

    try {
      const payload = await requestJson<{ artworks: Artwork[]; message?: string }>("/api/admin/artworks/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ artworkIds: orderedIds }),
      });

      setArtworks(payload.artworks);
      setPersisted(payload.artworks);
      setSaveState({ phase: "saved", message: payload.message ?? "排序已更新。" });
    } catch (error) {
      setSaveState({
        phase: "error",
        message: error instanceof Error ? error.message : "更新排序失败。",
      });
    }
  }

  async function reorderArtworkByFilteredIndex(fromFilteredIndex: number, toFilteredIndex: number) {
    const fromArtwork = filteredArtworks[fromFilteredIndex];
    const toArtwork = filteredArtworks[toFilteredIndex];

    if (!fromArtwork || !toArtwork) {
      setDraggedArtworkIndex(null);
      return;
    }

    const fromIndex = artworks.findIndex((artwork) => getArtworkId(artwork) === getArtworkId(fromArtwork));
    const toIndex = artworks.findIndex((artwork) => getArtworkId(artwork) === getArtworkId(toArtwork));

    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
      setDraggedArtworkIndex(null);
      return;
    }

    const previousArtworks = cloneValue(artworks);
    const nextArtworks = moveArrayItem(artworks, fromIndex, toIndex);
    const orderedIds = nextArtworks.map((artwork) => getArtworkId(artwork));

    setArtworks(nextArtworks);
    setSelectedId(getArtworkId(fromArtwork));
    setDraggedArtworkIndex(null);
    setSaveState({ phase: "saving", message: "正在更新排序..." });

    try {
      const payload = await requestJson<{ artworks: Artwork[]; message?: string }>("/api/admin/artworks/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ artworkIds: orderedIds }),
      });

      setArtworks(payload.artworks);
      setPersisted(payload.artworks);
      setSaveState({ phase: "saved", message: payload.message ?? "排序已更新。" });
    } catch (error) {
      setArtworks(previousArtworks);
      setDraggedArtworkIndex(null);
      setSaveState({
        phase: "error",
        message: error instanceof Error ? error.message : "更新排序失败。",
      });
    }
  }

  async function saveCurrentArtwork(nextStatus: PublicationStatus) {
    if (!selectedArtwork) {
      return;
    }

    const previousArtworks = cloneValue(artworks);
    const nextArtwork = normalizeArtworkDraft({
      ...selectedArtwork,
      publicationStatus: nextStatus,
    });

    if (nextStatus === "published") {
      setValidationIssues(getArtworkPublicationIssues(nextArtwork, artworks));
    } else {
      setValidationIssues([]);
    }

    setArtworks((current) =>
      current.map((item) => (getArtworkId(item) === getArtworkId(selectedArtwork) ? nextArtwork : item)),
    );

    try {
      await saveArtwork(nextArtwork, "manual");
    } catch (error) {
      setArtworks(previousArtworks);
      if (error instanceof AdminValidationError) {
        setValidationIssues(error.issues);
      }
    }
  }

  const previewHref = selectedArtwork?.slug
    ? selectedArtwork.publicationStatus === "published"
      ? `/collection/${selectedArtwork.slug}`
      : `/collection/${selectedArtwork.slug}?preview=1`
    : null;

  return (
    <div className="space-y-6">
      <StatusBar
        title={title}
        state={saveState}
        sync={syncState}
        isDirty={hasPendingChanges}
        actions={
          selectedArtwork ? (
            <>
              <RecordStatusActions
                publicationStatus={selectedArtwork.publicationStatus ?? "draft"}
                hasPendingChanges={hasPendingChanges}
                onSaveCurrent={() => void saveCurrentArtwork(selectedArtwork.publicationStatus ?? "draft")}
                onSaveDraft={() => void saveCurrentArtwork("draft")}
                onSavePublish={() => void saveCurrentArtwork("published")}
              />
              <ToolbarButton onClick={() => void duplicateArtwork()}>复制当前藏品</ToolbarButton>
              {previewHref ? (
                <Link
                  href={previewHref}
                  target="_blank"
                  className="inline-flex min-h-11 items-center border border-[var(--line)] px-4 text-sm text-[var(--muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
                >
                  预览
                </Link>
              ) : null}
            </>
          ) : undefined
        }
      />

      <div className="space-y-3 border-b border-[var(--line)] pb-6">
        <p className="text-sm leading-8 text-[var(--muted)]">{description}</p>
      </div>
      <ValidationSummary issues={validationIssues} sectionLabels={sectionLabels} />

      <div className="grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-6 xl:self-start">
          <ListSidebar
            items={filteredArtworks}
            selectedIndex={Math.max(0, filteredArtworks.findIndex((item) => getArtworkId(item) === selectedId))}
            onSelect={(index) => setSelectedId(getArtworkId(filteredArtworks[index]))}
            renderTitle={(artwork) => artwork.title.zh || "未命名藏品"}
            renderMeta={(artwork) => `${artwork.publicationStatus === "published" ? "已发布" : "草稿"} · ${artwork.slug}`}
            renderWarnings={(artwork) => summarizeIssueBadges(getArtworkPublicationIssues(artwork, artworks))}
            onAdd={() => void createArtwork()}
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            heading={`藏品 ${artworks.length}`}
            summary={search.trim() || statusFilter !== "all" ? `当前显示 ${filteredArtworks.length} 件，可直接拖动左侧条目调整排序。` : "左侧列表固定滚动；可直接拖动条目调整前台与后台的显示顺序。"}
            getItemKey={(artwork) => getArtworkId(artwork)}
            listClassName="max-h-[68vh] overflow-y-auto"
            onReorder={(fromIndex, toIndex) => void reorderArtworkByFilteredIndex(fromIndex, toIndex)}
            draggedIndex={draggedArtworkIndex}
            onDragIndexChange={setDraggedArtworkIndex}
          />
        </aside>

        <div className="space-y-6">
          {selectedArtwork ? (
            <>
              <SectionBlock id="section-basic" title="基础信息" description="标题、基本分类与作品参数。" issues={sectionIssues.basic}>
                <div className="grid gap-4">
                  <BilingualInput label="标题" value={selectedArtwork.title} onChange={(next) => updateSelected((artwork) => { artwork.title = next; })} fieldKeys={{ zh: "title.zh", en: "title.en" }} />
                  <BilingualInput label="副标题" value={selectedArtwork.subtitle} onChange={(next) => updateSelected((artwork) => { artwork.subtitle = next; })} fieldKeys={{ zh: "subtitle.zh", en: "subtitle.en" }} />
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <TextField label="Slug" value={selectedArtwork.slug} onChange={(next) => updateSelected((artwork) => { artwork.slug = next; })} fieldKey="slug" />
                    <BilingualInput label="年代" value={selectedArtwork.period} onChange={(next) => updateSelected((artwork) => { artwork.period = next; })} fieldKeys={{ zh: "period.zh", en: "period.en" }} />
                    <BilingualInput label="地区" value={selectedArtwork.region} onChange={(next) => updateSelected((artwork) => { artwork.region = next; })} fieldKeys={{ zh: "region.zh", en: "region.en" }} />
                    <BilingualInput label="产地" value={selectedArtwork.origin} onChange={(next) => updateSelected((artwork) => { artwork.origin = next; })} fieldKeys={{ zh: "origin.zh", en: "origin.en" }} />
                    <BilingualInput label="材质" value={selectedArtwork.material} onChange={(next) => updateSelected((artwork) => { artwork.material = next; })} fieldKeys={{ zh: "material.zh", en: "material.en" }} />
                    <BilingualInput label="品类" value={selectedArtwork.category} onChange={(next) => updateSelected((artwork) => { artwork.category = next; })} fieldKeys={{ zh: "category.zh", en: "category.en" }} />
                    <BilingualInput label="尺寸" value={selectedArtwork.dimensions} onChange={(next) => updateSelected((artwork) => { artwork.dimensions = next; })} fieldKeys={{ zh: "dimensions.zh", en: "dimensions.en" }} />
                  </div>
                  <label className="grid gap-2">
                    <Label>前台状态</Label>
                    <select
                      data-field-key="status"
                      value={selectedArtwork.status}
                      onChange={(event) => updateSelected((artwork) => { artwork.status = event.target.value as ArtworkStatus; })}
                      className="min-h-11 border border-[var(--line)] bg-white/60 px-3 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
                    >
                      <option value="inquiry">可洽询</option>
                      <option value="reserved">暂留</option>
                      <option value="sold">已洽购</option>
                    </select>
                  </label>
                </div>
              </SectionBlock>

              <SectionBlock id="section-images" title="图片" description="主图单独管理，细节图按前台顺序显示，可直接上传、删除与排序。" issues={sectionIssues.images}>
                <div className="grid gap-6">
                  <AdminMediaField
                    fieldKey={`${getArtworkId(selectedArtwork)}:image`}
                    anchorKey="image"
                    label="主图"
                    folder="artworks"
                    value={selectedArtwork.image}
                    recommendedUse="藏品列表与详情页主图"
                    recommendedSize="1200 x 1500 像素以上，竖图 4:5"
                    targetSize={{ width: 1200, height: 1500 }}
                    saveTarget={{
                      section: "artworks",
                      id: getArtworkId(selectedArtwork),
                      field: "image",
                    }}
                    onChange={(next) => updateSelected((artwork) => { artwork.image = next; })}
                    onPersisted={(next) => updatePersistedSelected((artwork) => { artwork.image = next; }, "主图已保存。")}
                    onPersistError={(message) => setSaveState({ phase: "error", message })}
                  />
                  <ArtworkDetailGalleryGrid
                    artwork={selectedArtwork}
                    onChangeGallery={(nextGallery) => updateSelected((artwork) => { artwork.gallery = nextGallery; })}
                    onPersistGallery={(nextGallery, message) => updatePersistedSelected((artwork) => { artwork.gallery = nextGallery; }, message)}
                    onSaveStateChange={setSaveState}
                    onSaveArtwork={async (nextArtwork) => {
                      await saveArtwork(nextArtwork, "manual");
                    }}
                  />
                </div>
              </SectionBlock>

              <SectionBlock id="section-scholarly" title="学术说明" description="用于前台的观看描述、比较判断与列表摘要。" issues={sectionIssues.scholarly}>
                <div className="grid gap-4">
                  <BilingualTextarea label="列表摘要" value={selectedArtwork.excerpt} onChange={(next) => updateSelected((artwork) => { artwork.excerpt = next; })} rows={4} fieldKeys={{ zh: "excerpt.zh", en: "excerpt.en" }} />
                  <BilingualTextarea label="观看描述" value={selectedArtwork.viewingNote} onChange={(next) => updateSelected((artwork) => { artwork.viewingNote = next; })} rows={5} fieldKeys={{ zh: "viewingNote.zh", en: "viewingNote.en" }} />
                  <BilingualTextarea label="比较判断" value={selectedArtwork.comparisonNote} onChange={(next) => updateSelected((artwork) => { artwork.comparisonNote = next; })} rows={5} fieldKeys={{ zh: "comparisonNote.zh", en: "comparisonNote.en" }} />
                </div>
              </SectionBlock>

              <SectionBlock id="section-references" title="来源 / 展览 / 出版" description="按古董商目录习惯维护 provenance、exhibition 和 publication 信息。" issues={sectionIssues.references}>
                <div className="grid gap-6">
                  <div data-field-key="provenance" className="grid gap-4">
                    <div className="flex items-center justify-between gap-3">
                      <Label>来源</Label>
                      <button
                        data-field-key="provenance.add"
                        type="button"
                        onClick={() => updateSelected((artwork) => { artwork.provenance = [...artwork.provenance, { label: emptyBilingual() } as ProvenanceEntry]; })}
                        className="text-xs tracking-[0.14em] text-[var(--accent)] transition-colors hover:text-[var(--ink)]"
                      >
                        新增来源
                      </button>
                    </div>
                    {selectedArtwork.provenance.map((entry, index) => (
                      <div key={`provenance-${index}`} data-field-key={`provenance.${index}`} className="space-y-3 border border-[var(--line)] bg-white/40 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <Label>{`来源 ${index + 1}`}</Label>
                          <button type="button" onClick={() => updateSelected((artwork) => { artwork.provenance = removeArrayItem(artwork.provenance, index); })} className="text-xs tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[#8e4e3b]">删除</button>
                        </div>
                        <BilingualInput label="来源标题" value={entry.label} onChange={(next) => updateSelected((artwork) => { artwork.provenance = updateArrayItem(artwork.provenance, index, (item) => { item.label = next; }); })} fieldKeys={{ zh: `provenance.${index}.zh`, en: `provenance.${index}.en` }} />
                        <BilingualTextarea label="补充说明" value={entry.note ?? emptyBilingual()} onChange={(next) => updateSelected((artwork) => { artwork.provenance = updateArrayItem(artwork.provenance, index, (item) => { item.note = next; }); })} rows={3} fieldKeys={{ zh: `provenance.${index}.note.zh`, en: `provenance.${index}.note.en` }} />
                      </div>
                    ))}
                  </div>

                  <div data-field-key="exhibitions" className="grid gap-4">
                    <div className="flex items-center justify-between gap-3">
                      <Label>展览</Label>
                      <button
                        data-field-key="exhibitions.add"
                        type="button"
                        onClick={() => updateSelected((artwork) => { artwork.exhibitions = [...artwork.exhibitions, { title: emptyBilingual(), venue: emptyBilingual(), year: "" }]; })}
                        className="text-xs tracking-[0.14em] text-[var(--accent)] transition-colors hover:text-[var(--ink)]"
                      >
                        新增展览
                      </button>
                    </div>
                    {selectedArtwork.exhibitions.map((entry, index) => (
                      <div key={`artwork-exhibition-${index}`} data-field-key={`exhibitions.${index}`} className="space-y-3 border border-[var(--line)] bg-white/40 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <Label>{`展览 ${index + 1}`}</Label>
                          <button type="button" onClick={() => updateSelected((artwork) => { artwork.exhibitions = removeArrayItem(artwork.exhibitions, index); })} className="text-xs tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[#8e4e3b]">删除</button>
                        </div>
                        <BilingualInput label="展览标题" value={entry.title} onChange={(next) => updateSelected((artwork) => { artwork.exhibitions = updateArrayItem(artwork.exhibitions, index, (item) => { item.title = next; }); })} fieldKeys={{ zh: `exhibitions.${index}.zh`, en: `exhibitions.${index}.en` }} />
                        <BilingualInput label="场地" value={entry.venue} onChange={(next) => updateSelected((artwork) => { artwork.exhibitions = updateArrayItem(artwork.exhibitions, index, (item) => { item.venue = next; }); })} fieldKeys={{ zh: `exhibitions.${index}.venue.zh`, en: `exhibitions.${index}.venue.en` }} />
                        <TextField label="年份" value={entry.year} onChange={(next) => updateSelected((artwork) => { artwork.exhibitions = updateArrayItem(artwork.exhibitions, index, (item) => { item.year = next; }); })} fieldKey={`exhibitions.${index}.year`} />
                      </div>
                    ))}
                  </div>

                  <div data-field-key="publications" className="grid gap-4">
                    <div className="flex items-center justify-between gap-3">
                      <Label>出版</Label>
                      <button
                        data-field-key="publications.add"
                        type="button"
                        onClick={() => updateSelected((artwork) => { artwork.publications = [...artwork.publications, { title: emptyBilingual(), year: "", pages: emptyBilingual() } as PublicationReference]; })}
                        className="text-xs tracking-[0.14em] text-[var(--accent)] transition-colors hover:text-[var(--ink)]"
                      >
                        新增出版
                      </button>
                    </div>
                    {selectedArtwork.publications.map((entry, index) => (
                      <div key={`publication-${index}`} data-field-key={`publications.${index}`} className="space-y-3 border border-[var(--line)] bg-white/40 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <Label>{`出版 ${index + 1}`}</Label>
                          <button type="button" onClick={() => updateSelected((artwork) => { artwork.publications = removeArrayItem(artwork.publications, index); })} className="text-xs tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[#8e4e3b]">删除</button>
                        </div>
                        <BilingualInput label="图录 / 书名" value={entry.title} onChange={(next) => updateSelected((artwork) => { artwork.publications = updateArrayItem(artwork.publications, index, (item) => { item.title = next; }); })} fieldKeys={{ zh: `publications.${index}.zh`, en: `publications.${index}.en` }} />
                        <div className="grid gap-4 md:grid-cols-2">
                          <TextField label="年份" value={entry.year} onChange={(next) => updateSelected((artwork) => { artwork.publications = updateArrayItem(artwork.publications, index, (item) => { item.year = next; }); })} fieldKey={`publications.${index}.year`} />
                          <BilingualInput label="页码" value={entry.pages} onChange={(next) => updateSelected((artwork) => { artwork.publications = updateArrayItem(artwork.publications, index, (item) => { item.pages = next; }); })} fieldKeys={{ zh: `publications.${index}.pages.zh`, en: `publications.${index}.pages.en` }} />
                        </div>
                        <BilingualTextarea label="补充说明" value={entry.note ?? emptyBilingual()} onChange={(next) => updateSelected((artwork) => { artwork.publications = updateArrayItem(artwork.publications, index, (item) => { item.note = next; }); })} rows={3} fieldKeys={{ zh: `publications.${index}.note.zh`, en: `publications.${index}.note.en` }} />
                      </div>
                    ))}
                  </div>
                </div>
              </SectionBlock>

              <SectionBlock title="询洽与关联" description="维护询洽提示以及和展览、文章的互链。">
                <div className="grid gap-6">
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between gap-3">
                      <Label>询洽提示</Label>
                      <button
                        type="button"
                        onClick={() => updateSelected((artwork) => { artwork.inquirySupport = [...artwork.inquirySupport, emptyBilingual()]; })}
                        className="text-xs tracking-[0.14em] text-[var(--accent)] transition-colors hover:text-[var(--ink)]"
                      >
                        新增提示
                      </button>
                    </div>
                    {selectedArtwork.inquirySupport.map((item, index) => (
                      <div key={`support-${index}`} className="space-y-3 border border-[var(--line)] bg-white/40 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <Label>{`提示 ${index + 1}`}</Label>
                          <button type="button" onClick={() => updateSelected((artwork) => { artwork.inquirySupport = removeArrayItem(artwork.inquirySupport, index); })} className="text-xs tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[#8e4e3b]">删除</button>
                        </div>
                        <BilingualInput label="提示内容" value={item} onChange={(next) => updateSelected((artwork) => { artwork.inquirySupport = updateArrayItem(artwork.inquirySupport, index, (entry) => { entry.zh = next.zh; entry.en = next.en; }); })} />
                      </div>
                    ))}
                  </div>
                  <RelationChecklist label="关联文章" options={articleOptions} selected={selectedArtwork.relatedArticleSlugs} onToggle={(value) => updateSelected((artwork) => { artwork.relatedArticleSlugs = artwork.relatedArticleSlugs.includes(value) ? artwork.relatedArticleSlugs.filter((item) => item !== value) : [...artwork.relatedArticleSlugs, value]; })} />
                  <RelationChecklist label="关联展览" options={exhibitionOptions} selected={selectedArtwork.relatedExhibitionSlugs} onToggle={(value) => updateSelected((artwork) => { artwork.relatedExhibitionSlugs = artwork.relatedExhibitionSlugs.includes(value) ? artwork.relatedExhibitionSlugs.filter((item) => item !== value) : [...artwork.relatedExhibitionSlugs, value]; })} />
                </div>
              </SectionBlock>

              <SectionBlock title="发布设置" description="这里处理预览、发布、下线和删除。">
                <div className="flex flex-wrap items-center gap-3">
                  <RecordStatusActions
                    publicationStatus={selectedArtwork.publicationStatus ?? "draft"}
                    hasPendingChanges={hasPendingChanges}
                    onSaveCurrent={() => void saveCurrentArtwork(selectedArtwork.publicationStatus ?? "draft")}
                    onSaveDraft={() => void saveCurrentArtwork("draft")}
                    onSavePublish={() => void saveCurrentArtwork("published")}
                  />
                  <ToolbarButton onClick={() => void reorderCurrentArtwork("up")}>上移排序</ToolbarButton>
                  <ToolbarButton onClick={() => void reorderCurrentArtwork("down")}>下移排序</ToolbarButton>
                  <ToolbarButton tone="danger" onClick={() => void deleteSelectedArtwork()}>删除藏品</ToolbarButton>
                </div>
              </SectionBlock>
            </>
          ) : (
            <SectionBlock title="藏品" description="左侧点击“新增”即可创建新藏品。">
              <p className="text-sm leading-7 text-[var(--muted)]">当前还没有藏品，先新增一件即可开始录入。</p>
            </SectionBlock>
          )}
        </div>
      </div>
    </div>
  );
}


function ExhibitionsEditor({
  title,
  description,
  initialValue,
  content,
  initialFocus,
}: {
  title: string;
  description: string;
  initialValue: Exhibition[];
  content: SiteContent;
  initialFocus?: string;
}) {
  const { draft, persisted, setDraft, setPersisted, saveNow, saveState, setSaveState, isDirty } = useAutosaveSection("exhibitions", initialValue, {
    prepare: (items) => items.map((item) => normalizeExhibitionDraft(item)),
    validate: (items) => {
      const invalid = items.find((item) => (item.publicationStatus ?? "draft") === "published" && getExhibitionPublicationIssues(item, items).some((issue) => issue.level === "error"));
      return invalid ? getExhibitionPublicationIssues(invalid, items).find((issue) => issue.level === "error")?.message ?? null : null;
    },
  });
  const syncState = useWebsiteSyncStatus({
    target: { section: "exhibitions" },
    changeToken: JSON.stringify(persisted),
    hasPendingChanges: isDirty || saveState.phase === "saving" || saveState.phase === "creating",
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const sectionLabels = {
    basic: "展览信息",
    catalogue: "图录与关联",
  } satisfies Record<string, string>;

  useEffect(() => {
    setSelectedIndex(0);
    setValidationIssues([]);
  }, [initialValue]);

  useInitialFieldFocus(initialFocus, "basic");

  const exhibition = draft[selectedIndex];
  const persistedExhibition = persisted[selectedIndex] ?? null;
  const persistedExhibitionSlug = persistedExhibition?.slug ?? exhibition?.slug ?? "";
  const articleOptions = content.articles.map((article) => ({
    value: article.slug,
    title: article.title.zh || article.slug,
    note: article.author.zh || article.column.zh,
  }));
  const artworkOptions = content.artworks.map((artwork) => ({
    value: artwork.slug,
    title: artwork.title.zh || artwork.slug,
    note: artwork.period.zh || artwork.category.zh,
  }));

  function update(recipe: (value: Exhibition[]) => void) {
    setDraft((current) => {
      const next = cloneValue(current);
      recipe(next);
      setValidationIssues([]);
      return next;
    });
  }

  async function createExhibitionDraftRemote() {
    setSaveState({ phase: "creating", message: "正在创建展览草稿..." });

    try {
      const payload = await requestJson<{ item: Exhibition; value: Exhibition[]; message?: string }>("/api/admin/sections/exhibitions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "create" }),
      });

      setDraft(payload.value);
      setPersisted(payload.value);
      setSelectedIndex(Math.max(0, payload.value.findIndex((item) => item.slug === payload.item.slug)));
      setValidationIssues([]);
      setSaveState({ phase: "saved", message: payload.message ?? "新展览草稿已创建。" });
    } catch (error) {
      setSaveState({
        phase: "error",
        message: error instanceof Error ? error.message : "新增展览失败。",
      });
    }
  }

  async function duplicateCurrentExhibition() {
    if (!exhibition) {
      return;
    }

    setSaveState({ phase: "creating", message: "正在复制当前展览..." });

    try {
      const payload = await requestJson<{ item: Exhibition; value: Exhibition[]; message?: string }>("/api/admin/sections/exhibitions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "duplicate", slug: exhibition.slug }),
      });

      setDraft(payload.value);
      setPersisted(payload.value);
      setSelectedIndex(Math.max(0, payload.value.findIndex((item) => item.slug === payload.item.slug)));
      setValidationIssues([]);
      setSaveState({ phase: "saved", message: payload.message ?? "已复制当前展览。" });
    } catch (error) {
      setSaveState({
        phase: "error",
        message: error instanceof Error ? error.message : "复制展览失败。",
      });
    }
  }

  async function deleteCurrentExhibition() {
    if (!exhibition) {
      return;
    }

    const isPublished = (exhibition.publicationStatus ?? "draft") === "published";
    const baseMessage = isPublished
      ? "这条展览已发布。删除后前台详情页将无法继续访问，是否继续？"
      : "确认删除这条展览草稿吗？";
    const secondMessage = "请再次确认删除这条已发布展览。此操作不可撤销。";

    if (!window.confirm(baseMessage)) {
      return;
    }

    if (isPublished && !window.confirm(secondMessage)) {
      return;
    }

    setSaveState({ phase: "saving", message: "正在删除展览..." });

    try {
      const payload = await requestJson<{ value: Exhibition[]; message?: string }>("/api/admin/sections/exhibitions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slug: exhibition.slug }),
      });

      setDraft(payload.value);
      setPersisted(payload.value);
      setSelectedIndex(Math.min(selectedIndex, Math.max(0, payload.value.length - 1)));
      setValidationIssues([]);
      setSaveState({ phase: "saved", message: payload.message ?? "展览已删除。" });
    } catch (error) {
      setSaveState({
        phase: "error",
        message: error instanceof Error ? error.message : "删除展览失败。",
      });
    }
  }

  async function saveCurrentExhibition(nextStatus: PublicationStatus) {
    if (!exhibition) {
      return;
    }

    const previousDraft = cloneValue(draft);
    const nextDraft = cloneValue(draft);
    nextDraft[selectedIndex].publicationStatus = nextStatus;
    if (nextStatus === "published") {
      setValidationIssues(getExhibitionPublicationIssues(nextDraft[selectedIndex], nextDraft));
    } else {
      setValidationIssues([]);
    }

    setDraft(nextDraft);
    try {
      await saveNow(nextDraft, "manual", true);
      setValidationIssues([]);
    } catch (error) {
      setDraft(previousDraft);
      if (error instanceof AdminValidationError) {
        setValidationIssues(error.issues);
      }
    }
  }

  const sectionIssues = {
    basic: validationIssues.filter((issue) => issue.section === "basic"),
    catalogue: validationIssues.filter((issue) => issue.section === "catalogue"),
  };

  return (
    <div className="space-y-6">
      <StatusBar
        title={title}
        state={saveState}
        sync={syncState}
        isDirty={isDirty}
        actions={
          exhibition ? (
            <>
              <RecordStatusActions
                publicationStatus={exhibition.publicationStatus ?? "draft"}
                hasPendingChanges={isDirty}
                onSaveCurrent={() => void saveCurrentExhibition(exhibition.publicationStatus ?? "draft")}
                onSaveDraft={() => void saveCurrentExhibition("draft")}
                onSavePublish={() => void saveCurrentExhibition("published")}
              />
              <ToolbarButton onClick={() => void duplicateCurrentExhibition()}>复制当前展览</ToolbarButton>
              <ToolbarButton tone="danger" onClick={() => void deleteCurrentExhibition()}>删除展览</ToolbarButton>
            </>
          ) : undefined
        }
      />
      <div className="space-y-3 border-b border-[var(--line)] pb-6">
        <p className="text-sm leading-8 text-[var(--muted)]">{description}</p>
        <p className="text-xs leading-6 text-[var(--muted)]/82">
          修改内容后，请点击“保存当前修改”或“保存并发布”，前台才会同步更新。
        </p>
      </div>
      <ValidationSummary issues={validationIssues} sectionLabels={sectionLabels} />
      <div className="grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside>
          <ListSidebar
            items={draft}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            renderTitle={(item) => item.title.zh || "未命名展览"}
            renderMeta={(item) => `${item.publicationStatus === "published" ? "已发布" : "草稿"} · ${item.slug}`}
            renderWarnings={(item) => summarizeIssueBadges(getExhibitionPublicationIssues(item, draft))}
            onAdd={() => void createExhibitionDraftRemote()}
          />
        </aside>
        {exhibition ? (
          <div className="space-y-6">
            <SectionBlock id="section-basic" title="基础信息" issues={sectionIssues.basic}>
              <div className="grid gap-4">
                <AdminMediaField
                  anchorKey="cover"
                  label="展览封面"
                  folder="exhibitions"
                  value={exhibition.cover}
                  previewRatio="landscape"
                  targetSize={{ width: 1600, height: 1000 }}
                  recommendedUse="展览列表与详情封面"
                  recommendedSize="1600 x 1000 像素以上"
                  autoSaveAfterUpload={false}
                  saveTarget={{
                    section: "exhibitions",
                    id: persistedExhibitionSlug,
                    field: "cover",
                  }}
                  onChange={(next) => update((items) => { items[selectedIndex].cover = next; })}
                  onPersisted={(next) => {
                    setPersisted((current) => {
                      const nextItems = cloneValue(current);
                      const recordIndex = nextItems.findIndex((item) => item.slug === persistedExhibitionSlug);

                      if (recordIndex < 0) {
                        return current;
                      }

                      nextItems[recordIndex].cover = next;
                      return nextItems;
                    });
                    setSaveState({ phase: "saved", message: next ? "展览封面已保存。" : "展览封面已移除。" });
                  }}
                  onPersistError={(message) => setSaveState({ phase: "error", message })}
                />
                <BilingualInput label="标题" value={exhibition.title} onChange={(next) => update((items) => { items[selectedIndex].title = next; })} fieldKeys={{ zh: "title.zh", en: "title.en" }} />
                <BilingualInput label="副标题" value={exhibition.subtitle} onChange={(next) => update((items) => { items[selectedIndex].subtitle = next; })} />
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="Slug" value={exhibition.slug} onChange={(next) => update((items) => { items[selectedIndex].slug = next; })} fieldKey="slug" />
                  <TextField label="图录页数" type="number" value={String(exhibition.cataloguePageCount ?? exhibition.cataloguePages ?? 0)} onChange={(next) => update((items) => { items[selectedIndex].cataloguePageCount = Number(next || 0); items[selectedIndex].cataloguePages = Number(next || 0); })} />
                </div>
                <TextField label="重点作品数量" type="number" value={String(exhibition.featuredWorksCount ?? exhibition.highlightCount ?? exhibition.highlightArtworkSlugs.length)} onChange={(next) => update((items) => { items[selectedIndex].featuredWorksCount = Number(next || 0); items[selectedIndex].highlightCount = Number(next || 0); })} />
                <BilingualInput label="时间" value={exhibition.period} onChange={(next) => update((items) => { items[selectedIndex].period = next; })} fieldKeys={{ zh: "period.zh", en: "period.en" }} />
                <BilingualInput label="地点" value={exhibition.venue} onChange={(next) => update((items) => { items[selectedIndex].venue = next; })} fieldKeys={{ zh: "venue.zh", en: "venue.en" }} />
                <BilingualTextarea label="简介" value={exhibition.intro} onChange={(next) => update((items) => { items[selectedIndex].intro = next; })} rows={4} fieldKeys={{ zh: "intro.zh", en: "intro.en" }} />
                <div className="grid gap-4">
                  {exhibition.description.map((paragraph, index) => (
                    <BilingualTextarea key={`exhibition-paragraph-${index}`} label={`正文 ${index + 1}`} value={paragraph} onChange={(next) => update((items) => { items[selectedIndex].description = updateArrayItem(items[selectedIndex].description, index, (item) => { item.zh = next.zh; item.en = next.en; }); })} rows={4} />
                  ))}
                  <button type="button" onClick={() => update((items) => { items[selectedIndex].description = [...items[selectedIndex].description, emptyBilingual()]; })} className="inline-flex min-h-11 items-center justify-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)]">新增正文段落</button>
                </div>
              </div>
            </SectionBlock>
            <SectionBlock id="section-catalogue" title="图录与关联" issues={sectionIssues.catalogue}>
              <div className="grid gap-4">
                <BilingualInput label="图录标题" value={exhibition.catalogueTitle} onChange={(next) => update((items) => { items[selectedIndex].catalogueTitle = next; })} />
                <BilingualTextarea label="图录说明" value={exhibition.catalogueNote ?? exhibition.catalogueIntro} onChange={(next) => update((items) => { items[selectedIndex].catalogueNote = next; items[selectedIndex].catalogueIntro = next; })} rows={4} />
                <TextAreaField
                  label="图录页图片"
                  value={(exhibition.cataloguePageImages ?? []).join("\n")}
                  onChange={(next) => update((items) => {
                    items[selectedIndex].cataloguePageImages = next
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean);
                  })}
                  rows={6}
                  fieldKey="cataloguePageImages"
                />
                <BilingualTextarea label="策展说明" value={exhibition.curatorialNote ?? exhibition.curatorialLead} onChange={(next) => update((items) => { items[selectedIndex].curatorialNote = next; items[selectedIndex].curatorialLead = next; })} rows={4} />
                <RelationChecklist
                  fieldKey="highlightArtworkSlugs"
                  label="重点作品"
                  options={artworkOptions}
                  selected={exhibition.highlightArtworkSlugs}
                  onToggle={(value) =>
                    update((items) => {
                      const list = items[selectedIndex].highlightArtworkSlugs;
                      const nextList = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
                      items[selectedIndex].highlightArtworkSlugs = nextList;
                      // Keep summary counts aligned with current highlighted selections.
                      items[selectedIndex].featuredWorksCount = nextList.length;
                      items[selectedIndex].highlightCount = nextList.length;
                    })
                  }
                />
                <RelationChecklist label="相关文章" options={articleOptions} selected={exhibition.relatedArticleSlugs} onToggle={(value) => update((items) => { const list = items[selectedIndex].relatedArticleSlugs; items[selectedIndex].relatedArticleSlugs = list.includes(value) ? list.filter((item) => item !== value) : [...list, value]; })} />
              </div>
            </SectionBlock>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ArticlesEditor({
  title,
  description,
  initialValue,
  content,
  initialFocus,
}: {
  title: string;
  description: string;
  initialValue: Article[];
  content: SiteContent;
  initialFocus?: string;
}) {
  const { draft, persisted, setDraft, setPersisted, saveNow, saveState, setSaveState, isDirty } = useAutosaveSection("articles", initialValue, {
    prepare: (items) => items.map((item) => normalizeArticleDraft(item)),
    validate: (items) => {
      const invalid = items.find((item) => (item.publicationStatus ?? "draft") === "published" && getArticlePublicationIssues(item, items).some((issue) => issue.level === "error"));
      return invalid ? getArticlePublicationIssues(invalid, items).find((issue) => issue.level === "error")?.message ?? null : null;
    },
  });
  const syncState = useWebsiteSyncStatus({
    target: { section: "articles" },
    changeToken: JSON.stringify(persisted),
    hasPendingChanges: isDirty || saveState.phase === "saving" || saveState.phase === "creating",
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editorLocale, setEditorLocale] = useState<ArticleEditorLocale>("zh");
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [articleImagePreviewMap, setArticleImagePreviewMap] = useState<Record<string, string>>({});
  const sectionLabels = {
    basic: "文章设置",
    body: "正文画布",
  } satisfies Record<string, string>;

  useEffect(() => {
    setSelectedIndex(0);
    setEditorLocale("zh");
    setValidationIssues([]);
    setArticleImagePreviewMap((current) => {
      Object.values(current).forEach((preview) => {
        if (preview.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }
      });

      return {};
    });
  }, [initialValue]);

  useEffect(() => {
    setEditorLocale("zh");
    setArticleImagePreviewMap((current) => {
      Object.values(current).forEach((preview) => {
        if (preview.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }
      });

      return {};
    });
  }, [selectedIndex]);

  useEffect(() => {
    return () => {
      Object.values(articleImagePreviewMap).forEach((preview) => {
        if (preview.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [articleImagePreviewMap]);

  useInitialFieldFocus(initialFocus, "basic");

  const article = draft[selectedIndex];
  const persistedArticle = persisted[selectedIndex] ?? null;
  const persistedArticleSlug = persistedArticle?.slug ?? article?.slug ?? "";
  const artworkOptions = content.artworks.map((artwork) => ({
    value: artwork.slug,
    title: artwork.title.zh || artwork.slug,
    note: artwork.category.zh || artwork.period.zh,
  }));
  const exhibitionOptions = content.exhibitions.map((exhibition) => ({
    value: exhibition.slug,
    title: exhibition.title.zh || exhibition.slug,
    note: exhibition.venue.zh || exhibition.period.zh,
  }));

  function update(recipe: (value: Article[]) => void) {
    setDraft((current) => {
      const next = cloneValue(current);
      recipe(next);
      setValidationIssues([]);
      return next;
    });
  }

  function updateContentBlocks(recipe: (blocks: ArticleContentBlock[]) => ArticleContentBlock[]) {
    update((items) => {
      const currentBlocks = normalizeArticleContentBlocks(items[selectedIndex].contentBlocks, items[selectedIndex].body);
      const nextBlocks = normalizeArticleContentBlocks(recipe(currentBlocks), items[selectedIndex].body);
      items[selectedIndex].contentBlocks = nextBlocks;
      items[selectedIndex].body = getArticleBodyParagraphs(nextBlocks, items[selectedIndex].body);
    });
  }

  async function createArticleDraftRemote() {
    setSaveState({ phase: "creating", message: "正在创建文章草稿..." });

    try {
      const payload = await requestJson<{ item: Article; value: Article[]; message?: string }>("/api/admin/sections/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "create" }),
      });

      setDraft(payload.value);
      setPersisted(payload.value);
      setSelectedIndex(Math.max(0, payload.value.findIndex((item) => item.slug === payload.item.slug)));
      setValidationIssues([]);
      setSaveState({ phase: "saved", message: payload.message ?? "新文章草稿已创建。" });
    } catch (error) {
      setSaveState({
        phase: "error",
        message: error instanceof Error ? error.message : "新增文章失败。",
      });
    }
  }

  async function duplicateCurrentArticle() {
    if (!article) {
      return;
    }

    setSaveState({ phase: "creating", message: "正在复制当前文章..." });

    try {
      const payload = await requestJson<{ item: Article; value: Article[]; message?: string }>("/api/admin/sections/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "duplicate", slug: article.slug }),
      });

      setDraft(payload.value);
      setPersisted(payload.value);
      setSelectedIndex(Math.max(0, payload.value.findIndex((item) => item.slug === payload.item.slug)));
      setValidationIssues([]);
      setSaveState({ phase: "saved", message: payload.message ?? "已复制当前文章。" });
    } catch (error) {
      setSaveState({
        phase: "error",
        message: error instanceof Error ? error.message : "复制文章失败。",
      });
    }
  }

  async function deleteCurrentArticle() {
    if (!article) {
      return;
    }

    const isPublished = (article.publicationStatus ?? "draft") === "published";
    const baseMessage = isPublished
      ? "这篇文章已发布。删除后前台详情页将无法继续访问，是否继续？"
      : "确认删除这篇文章草稿吗？";
    const secondMessage = "请再次确认删除这篇已发布文章。此操作不可撤销。";

    if (!window.confirm(baseMessage)) {
      return;
    }

    if (isPublished && !window.confirm(secondMessage)) {
      return;
    }

    setSaveState({ phase: "saving", message: "正在删除文章..." });

    try {
      const payload = await requestJson<{ value: Article[]; message?: string }>("/api/admin/sections/articles", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slug: article.slug }),
      });

      setDraft(payload.value);
      setPersisted(payload.value);
      setSelectedIndex(Math.min(selectedIndex, Math.max(0, payload.value.length - 1)));
      setValidationIssues([]);
      setSaveState({ phase: "saved", message: payload.message ?? "文章已删除。" });
    } catch (error) {
      setSaveState({
        phase: "error",
        message: error instanceof Error ? error.message : "删除文章失败。",
      });
    }
  }

  async function saveCurrentArticle(nextStatus: PublicationStatus) {
    if (!article) {
      return;
    }

    const previousDraft = cloneValue(draft);
    const nextDraft = cloneValue(draft);
    nextDraft[selectedIndex].publicationStatus = nextStatus;
    const preparedNextDraft = nextDraft.map((item) => normalizeArticleDraft(item));
    if (nextStatus === "published") {
      setValidationIssues(getArticlePublicationIssues(preparedNextDraft[selectedIndex], preparedNextDraft));
    } else {
      setValidationIssues([]);
    }

    setDraft(preparedNextDraft);
    try {
      await saveNow(preparedNextDraft, "manual", true);
      setValidationIssues([]);
    } catch (error) {
      setDraft(previousDraft);
      if (error instanceof AdminValidationError) {
        setValidationIssues(error.issues);
      }
    }
  }

  const sectionIssues = {
    basic: validationIssues.filter((issue) => issue.section === "basic"),
    body: validationIssues.filter((issue) => issue.section === "body"),
  };
  const basicBlockingIssues = sectionIssues.basic.filter((issue) => issue.level === "error");
  const basicWarningIssues = sectionIssues.basic.filter((issue) => issue.level === "warning");
  const bodyBlockingIssues = sectionIssues.body.filter((issue) => issue.level === "error");
  const bodyWarningIssues = sectionIssues.body.filter((issue) => issue.level === "warning");
  const normalizedBodyBlocks = article
    ? normalizeArticleContentBlocks(article.contentBlocks, article.body)
    : [];
  const bodyFlowValue: BilingualText = article
    ? {
        zh: articleBlocksToFlowText(normalizedBodyBlocks, article.body, "zh"),
        en: articleBlocksToFlowText(normalizedBodyBlocks, article.body, "en"),
      }
    : emptyBilingual();
  const articleImageReferences = article ? getArticleImageReferences(normalizedBodyBlocks, article.body) : [];
  const autoExcerpt = article ? getArticleAutoExcerpt(normalizedBodyBlocks, article.body) : emptyBilingual();
  const effectiveCover = article ? article.cover.trim() || getArticleFallbackCover(normalizedBodyBlocks, article.body) : "";
  const effectiveCoverPreview = effectiveCover ? (articleImagePreviewMap[effectiveCover] ?? effectiveCover) : "";
  const currentLocaleTitle = article ? (editorLocale === "zh" ? article.title.zh : article.title.en) : "";
  const currentLocaleAuthor = article ? (editorLocale === "zh" ? article.author.zh : article.author.en) : "";
  const structuredEditorSummary = summarizeArticleStructure(normalizedBodyBlocks);

  function updateBodyByFlow(nextFlow: BilingualText) {
    update((items) => {
      const nextBlocks = normalizeArticleContentBlocks(
        articleFlowTextToBlocks(nextFlow.zh, nextFlow.en),
        items[selectedIndex].body,
      );
      items[selectedIndex].contentBlocks = nextBlocks;
      items[selectedIndex].body = getArticleBodyParagraphs(nextBlocks, items[selectedIndex].body);
    });
  }

  function applyAutoExcerpt() {
    update((items) => {
      items[selectedIndex].excerpt = {
        zh: autoExcerpt.zh,
        en: autoExcerpt.en,
      };
    });
  }

  function selectCoverFromBody(image: string) {
    update((items) => {
      items[selectedIndex].cover = image;
      items[selectedIndex].coverAsset = undefined;
    });
  }

  function setArticleImagePreview(imageUrl: string, previewUrl: string | null) {
    setArticleImagePreviewMap((current) => {
      const next = { ...current };
      const existing = current[imageUrl];

      if (existing?.startsWith("blob:") && existing !== previewUrl) {
        URL.revokeObjectURL(existing);
      }

      if (previewUrl) {
        next[imageUrl] = previewUrl;
      } else {
        delete next[imageUrl];
      }

      return next;
    });
  }

  return (
    <div className="space-y-6">
      <StatusBar
        title={title}
        state={saveState}
        sync={syncState}
        isDirty={isDirty}
        actions={
          article ? (
            <>
              <RecordStatusActions
                publicationStatus={article.publicationStatus ?? "draft"}
                hasPendingChanges={isDirty}
                onSaveCurrent={() => void saveCurrentArticle(article.publicationStatus ?? "draft")}
                onSaveDraft={() => void saveCurrentArticle("draft")}
                onSavePublish={() => void saveCurrentArticle("published")}
              />
              <ToolbarButton onClick={() => void duplicateCurrentArticle()}>复制当前文章</ToolbarButton>
              <ToolbarButton tone="danger" onClick={() => void deleteCurrentArticle()}>删除文章</ToolbarButton>
            </>
          ) : undefined
        }
      />
      <div className="space-y-3 border-b border-[var(--line)] pb-6">
        <p className="text-sm leading-8 text-[var(--muted)]">{description}</p>
        <p className="text-xs leading-6 text-[var(--muted)]/82">
          修改内容后，请点击“保存当前修改”或“保存并发布”，前台才会同步更新。
        </p>
      </div>
      <ValidationSummary issues={validationIssues} sectionLabels={sectionLabels} />
      <div className="grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside>
          <ListSidebar
            items={draft}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            renderTitle={(item) => item.title.zh || "未命名文章"}
            renderMeta={(item) => `${item.publicationStatus === "published" ? "已发布" : "草稿"} · ${item.slug}`}
            renderWarnings={(item) => summarizeIssueBadges(getArticlePublicationIssues(item, draft))}
            onAdd={() => void createArticleDraftRemote()}
          />
        </aside>
        {article ? (
          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
            <section id="section-body" className="scroll-mt-28 border border-[var(--line)] bg-[var(--surface)]">
              <div className="border-b border-[var(--line)] px-5 py-5 md:px-8">
                <div className="space-y-2">
                  <Label>正文画布</Label>
                  <p className="text-sm leading-7 text-[var(--muted)]">
                    先写文章，再处理设置。图片会跟着正文自动排版，不需要手动调宽度。
                  </p>
                  {bodyBlockingIssues.length ? (
                    <p className="text-sm leading-7 text-[#8e4e3b]">
                      {bodyBlockingIssues.map((issue) => issue.message).join("、")}
                    </p>
                  ) : null}
                  {bodyWarningIssues.length ? (
                    <p className="text-sm leading-7 text-[#8b7867]">
                      {`提醒：${bodyWarningIssues.map((issue) => issue.message).join("、")}`}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mx-auto max-w-[48rem] space-y-6 px-5 py-6 md:px-8 md:py-8">
                <div className="space-y-3">
                  <p className="text-[0.72rem] tracking-[0.18em] text-[var(--accent)]">
                    {editorLocale === "zh" ? "当前编辑中文" : "CURRENTLY EDITING ENGLISH"}
                  </p>
                  <textarea
                    data-field-key={`title.${editorLocale}`}
                    rows={2}
                    value={currentLocaleTitle}
                    onChange={(event) =>
                      update((items) => {
                        items[selectedIndex].title = updateBilingualLocaleValue(items[selectedIndex].title, editorLocale, event.target.value);
                      })
                    }
                    placeholder={editorLocale === "zh" ? "请输入文章标题" : "Article title"}
                    className="w-full resize-none border-0 bg-transparent p-0 font-serif text-[2.1rem] leading-[1.15] tracking-[-0.04em] text-[var(--ink)] outline-none placeholder:text-[var(--accent)]/42 md:text-[2.8rem]"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
                  <label className="grid gap-2">
                    <span className="text-[0.72rem] tracking-[0.18em] text-[var(--accent)]">
                      {editorLocale === "zh" ? "作者" : "AUTHOR"}
                    </span>
                    <input
                      data-field-key={`author.${editorLocale}`}
                      value={currentLocaleAuthor}
                      onChange={(event) =>
                        update((items) => {
                          items[selectedIndex].author = updateBilingualLocaleValue(items[selectedIndex].author, editorLocale, event.target.value);
                        })
                      }
                      placeholder={editorLocale === "zh" ? "请输入作者" : "Author"}
                      className="min-h-11 border border-[var(--line)] bg-white/60 px-3 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
                    />
                  </label>
                  <TextField
                    label="日期"
                    type="date"
                    value={article.date}
                    onChange={(next) => update((items) => { items[selectedIndex].date = next; })}
                    fieldKey="date"
                  />
                </div>

                <ArticleBodyFlowEditor
                  value={bodyFlowValue}
                  onChange={updateBodyByFlow}
                  activeLocale={editorLocale}
                  onActiveLocaleChange={setEditorLocale}
                  previewMap={articleImagePreviewMap}
                  onPreviewResolve={setArticleImagePreview}
                />
              </div>
            </section>

            <aside id="section-basic" className="space-y-4 self-start 2xl:sticky 2xl:top-28">
              <section className="space-y-4 border border-[var(--line)] bg-[var(--surface)] p-5 md:p-6">
                <div className="space-y-2 border-b border-[var(--line)] pb-4">
                  <Label>文章设置</Label>
                  <p className="text-sm leading-7 text-[var(--muted)]">
                    摘要和封面都可以让系统先帮你兜底。写完正文后，再决定要不要手动微调。
                  </p>
                  {basicBlockingIssues.length ? (
                    <p className="text-sm leading-7 text-[#8e4e3b]">
                      {basicBlockingIssues.map((issue) => issue.message).join("、")}
                    </p>
                  ) : null}
                  {basicWarningIssues.length ? (
                    <p className="text-sm leading-7 text-[#8b7867]">
                      {`提醒：${basicWarningIssues.map((issue) => issue.message).join("、")}`}
                    </p>
                  ) : null}
                </div>

                <div data-field-key="cover" className="grid gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <Label>封面</Label>
                      <p className="text-sm leading-7 text-[var(--muted)]">
                        留空时，发布会自动使用正文第一张图片。
                      </p>
                    </div>
                    {articleImageReferences.length && article.cover.trim() !== effectiveCover ? (
                      <button
                        type="button"
                        onClick={() => selectCoverFromBody(effectiveCover)}
                        className="text-xs tracking-[0.12em] text-[var(--accent)] transition-colors hover:text-[var(--ink)]"
                      >
                        使用正文首图
                      </button>
                    ) : null}
                  </div>

                  <div className="overflow-hidden border border-[var(--line)]/60 bg-[var(--surface-strong)]">
                    {effectiveCover ? (
                      <Image
                        src={effectiveCoverPreview}
                        alt={article.title.zh || article.slug}
                        width={1400}
                        height={900}
                        unoptimized
                        className="aspect-[1.85/1] h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[1.85/1] items-center justify-center text-[0.68rem] tracking-[0.14em] text-[var(--accent)]/56">
                        暂无封面
                      </div>
                    )}
                  </div>

                  {articleImageReferences.length ? (
                    <div className="grid gap-2">
                      <p className="text-xs leading-6 text-[var(--muted)]/84">可直接从正文已插入图片中选择：</p>
                      <div className="grid grid-cols-3 gap-2">
                        {articleImageReferences.slice(0, 6).map((item) => {
                          const selected = article.cover.trim() === item.image;

                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => selectCoverFromBody(item.image)}
                              className={`overflow-hidden border transition-colors ${
                                selected
                                  ? "border-[var(--line-strong)]"
                                  : "border-[var(--line)]/60 hover:border-[var(--line-strong)]"
                              }`}
                            >
                              <Image
                                src={articleImagePreviewMap[item.image] ?? item.image}
                                alt={item.caption.zh || item.caption.en || "Article cover option"}
                                width={600}
                                height={420}
                                unoptimized
                                className="aspect-[4/3] h-full w-full object-cover"
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <details className="border border-[var(--line)]/70 bg-white/34 p-4">
                    <summary className="cursor-pointer text-xs tracking-[0.14em] text-[var(--accent)]">
                      手动上传或替换封面
                    </summary>
                    <div className="mt-4">
                      <AdminMediaField
                        anchorKey="cover"
                        label="文章封面"
                        folder="articles"
                        value={article.cover}
                        previewRatio="landscape"
                        targetSize={{ width: 1400, height: 900 }}
                        recommendedUse="文章列表与详情封面"
                        recommendedSize="1400 x 900 像素以上"
                        autoSaveAfterUpload={false}
                        saveTarget={{
                          section: "articles",
                          id: persistedArticleSlug,
                          field: "cover",
                        }}
                        onChange={(next) => update((items) => {
                          items[selectedIndex].cover = next;
                          items[selectedIndex].coverAsset = undefined;
                        })}
                        onPersisted={(next) => {
                          setPersisted((current) => {
                            const nextItems = cloneValue(current);
                            const recordIndex = nextItems.findIndex((item) => item.slug === persistedArticleSlug);

                            if (recordIndex < 0) {
                              return current;
                            }

                            nextItems[recordIndex].cover = next;
                            return nextItems;
                          });
                          setSaveState({ phase: "saved", message: next ? "文章封面已保存。" : "文章封面已移除。" });
                        }}
                        onPersistError={(message) => setSaveState({ phase: "error", message })}
                      />
                    </div>
                  </details>
                </div>

                <div data-field-key="excerpt.zh" className="grid gap-3 border border-[var(--line)]/70 bg-white/34 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <Label>摘要</Label>
                      <p className="text-sm leading-7 text-[var(--muted)]">
                        留空时默认使用正文首段。需要精修时再手动填写。
                      </p>
                    </div>
                    {(autoExcerpt.zh || autoExcerpt.en) ? (
                      <button
                        type="button"
                        onClick={applyAutoExcerpt}
                        className="text-xs tracking-[0.12em] text-[var(--accent)] transition-colors hover:text-[var(--ink)]"
                      >
                        使用正文首段
                      </button>
                    ) : null}
                  </div>

                  <div className="grid gap-3">
                    <div className="border border-[var(--line)]/60 bg-white/60 p-3">
                      <p className="text-[0.68rem] tracking-[0.14em] text-[var(--accent)]">中文摘要预览</p>
                      <p className="mt-2 text-sm leading-7 text-[var(--ink)]">
                        {article.excerpt.zh || autoExcerpt.zh || "系统会在你写完首段后自动生成。"}
                      </p>
                    </div>
                    <div className="border border-[var(--line)]/60 bg-white/60 p-3">
                      <p className="text-[0.68rem] tracking-[0.14em] text-[var(--accent)]">English Excerpt Preview</p>
                      <p className="mt-2 text-sm leading-7 text-[var(--ink)]">
                        {article.excerpt.en || autoExcerpt.en || "The first English paragraph will be used automatically."}
                      </p>
                    </div>
                  </div>

                  <details className="border border-[var(--line)]/60 bg-white/60 p-4">
                    <summary className="cursor-pointer text-xs tracking-[0.14em] text-[var(--accent)]">
                      手动编辑摘要
                    </summary>
                    <div className="mt-4">
                      <BilingualTextarea
                        label="摘要"
                        value={article.excerpt}
                        onChange={(next) => update((items) => { items[selectedIndex].excerpt = next; })}
                        rows={4}
                        fieldKeys={{ zh: "excerpt.zh", en: "excerpt.en" }}
                      />
                    </div>
                  </details>
                </div>

                <details open className="border border-[var(--line)]/70 bg-white/34 p-4">
                  <summary className="cursor-pointer text-xs tracking-[0.14em] text-[var(--accent)]">基础设置</summary>
                  <div className="mt-4 grid gap-4">
                    <TextField
                      label="Slug"
                      value={article.slug}
                      onChange={(next) => update((items) => { items[selectedIndex].slug = next; })}
                      fieldKey="slug"
                    />
                    <BilingualInput
                      label="分类"
                      value={article.category}
                      onChange={(next) => update((items) => { items[selectedIndex].category = next; })}
                      fieldKeys={{ zh: "category.zh", en: "category.en" }}
                    />
                    <BilingualInput
                      label="栏目"
                      value={article.column}
                      onChange={(next) => update((items) => { items[selectedIndex].column = next; })}
                      fieldKeys={{ zh: "column.zh", en: "column.en" }}
                    />
                  </div>
                </details>

                <details className="border border-[var(--line)]/70 bg-white/34 p-4">
                  <summary className="cursor-pointer text-xs tracking-[0.14em] text-[var(--accent)]">关键词</summary>
                  <div className="mt-4 grid gap-4">
                    {article.keywords.map((keyword, index) => (
                      <BilingualInput
                        key={`article-keyword-${index}`}
                        label={`关键词 ${index + 1}`}
                        value={keyword}
                        onChange={(next) => update((items) => {
                          items[selectedIndex].keywords = updateArrayItem(items[selectedIndex].keywords, index, (item) => {
                            item.zh = next.zh;
                            item.en = next.en;
                          });
                        })}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => update((items) => { items[selectedIndex].keywords = [...items[selectedIndex].keywords, emptyBilingual()]; })}
                      className="inline-flex min-h-11 items-center justify-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)]"
                    >
                      新增关键词
                    </button>
                  </div>
                </details>

                <details className="border border-[var(--line)]/70 bg-white/34 p-4">
                  <summary className="cursor-pointer text-xs tracking-[0.14em] text-[var(--accent)]">关联内容</summary>
                  <div className="mt-4 grid gap-4">
                    <RelationChecklist
                      label="关联藏品"
                      options={artworkOptions}
                      selected={article.relatedArtworkSlugs}
                      onToggle={(value) =>
                        update((items) => {
                          const list = items[selectedIndex].relatedArtworkSlugs;
                          items[selectedIndex].relatedArtworkSlugs = list.includes(value)
                            ? list.filter((item) => item !== value)
                            : [...list, value];
                        })
                      }
                    />
                    <RelationChecklist
                      label="关联展览"
                      options={exhibitionOptions}
                      selected={article.relatedExhibitionSlugs}
                      onToggle={(value) =>
                        update((items) => {
                          const list = items[selectedIndex].relatedExhibitionSlugs;
                          items[selectedIndex].relatedExhibitionSlugs = list.includes(value)
                            ? list.filter((item) => item !== value)
                            : [...list, value];
                        })
                      }
                    />
                  </div>
                </details>

                <details className="border border-dashed border-[var(--line)]/70 bg-[var(--surface-strong)]/36 p-4">
                  <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-xs tracking-[0.14em] text-[var(--accent)]">高级调整（仅特殊排版时使用）</p>
                        <p className="text-xs leading-6 text-[var(--muted)]/84">
                          平时直接在“正文画布”里写就够了。只有需要逐块排序、做双图组或精修图片版式时再打开。
                        </p>
                      </div>
                      <span className="text-xs leading-6 text-[var(--accent)]/84">{structuredEditorSummary}</span>
                    </div>
                  </summary>
                  <div data-field-key="body" className="mt-4 grid gap-4">
                    <p className="text-xs leading-6 text-[var(--muted)]/84">
                      这里的修改会同步回上面的正文画布，适合做最后一步精修，不建议作为日常主编辑方式。
                    </p>
                    {normalizedBodyBlocks.map((block, index, blocks) => (
                      <ArticleContentBlockEditor
                        key={`article-content-block-${index}`}
                        block={block}
                        index={index}
                        total={blocks.length}
                        onChange={(updater) =>
                          updateContentBlocks((currentBlocks) =>
                            updateArrayItem(currentBlocks, index, (currentBlock) => Object.assign(currentBlock, updater(currentBlock))),
                          )
                        }
                        onMove={(direction) =>
                          updateContentBlocks((currentBlocks) =>
                            moveArrayItem(currentBlocks, index, direction === "up" ? index - 1 : index + 1),
                          )
                        }
                        onRemove={() =>
                          updateContentBlocks((currentBlocks) => {
                            const nextBlocks = removeArrayItem(currentBlocks, index);
                            return nextBlocks.length ? nextBlocks : [createArticleParagraphBlock()];
                          })
                        }
                      />
                    ))}
                    <div className="flex flex-wrap gap-3">
                      <button
                        data-field-key="body.addParagraph"
                        type="button"
                        onClick={() => updateContentBlocks((currentBlocks) => [...currentBlocks, createArticleParagraphBlock()])}
                        className="inline-flex min-h-11 items-center justify-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)]"
                      >
                        新增正文段落
                      </button>
                      <button
                        data-field-key="body.addImage"
                        type="button"
                        onClick={() => updateContentBlocks((currentBlocks) => [...currentBlocks, createArticleImageBlock()])}
                        className="inline-flex min-h-11 items-center justify-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)]"
                      >
                        新增单图
                      </button>
                      <button
                        data-field-key="body.addImagePair"
                        type="button"
                        onClick={() => updateContentBlocks((currentBlocks) => [...currentBlocks, createArticleImagePairBlock()])}
                        className="inline-flex min-h-11 items-center justify-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)]"
                      >
                        新增双图
                      </button>
                    </div>
                  </div>
                </details>
              </section>
            </aside>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AdminCmsEditor(props: AdminCmsEditorProps) {
  if (props.section === "artworks") {
    return <ArtworkEditor title={props.title} description={props.description} initialValue={props.initialValue as Artwork[]} content={props.content} autoCreate={props.autoCreate} initialSearch={props.initialSearch} initialStatusFilter={props.initialStatusFilter} initialFocus={props.initialFocus} />;
  }

  if (props.section === "exhibitions") {
    return <ExhibitionsEditor title={props.title} description={props.description} initialValue={props.initialValue as Exhibition[]} content={props.content} initialFocus={props.initialFocus} />;
  }

  return <ArticlesEditor title={props.title} description={props.description} initialValue={props.initialValue as Article[]} content={props.content} initialFocus={props.initialFocus} />;
}
