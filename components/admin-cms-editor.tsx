"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  Article,
  Artwork,
  ArtworkStatus,
  BilingualText,
  CollectingDirection,
  EditableSectionKey,
  EditableSectionValueMap,
  Exhibition,
  HomeContentEditorValue,
  OperationalFact,
  ProvenanceEntry,
  PublicationReference,
  PublicationStatus,
  SiteConfigContent,
  SiteContent,
} from "@/lib/site-data";
import type { ValidationIssue } from "@/lib/publication-validation";
import { getArticlePublicationIssues, getArtworkPublicationIssues, getExhibitionPublicationIssues } from "@/lib/publication-validation";
import { getHomeContentReminders, getSiteConfigReminders, type EditorReminder } from "@/lib/admin-reminders";

import { AdminMediaField, prepareAdminImageUpload, readAdminUploadResponse } from "./admin-media-field";

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
  | { section: "siteConfig" }
  | { section: "homeContent" }
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

  return normalized
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.replace(/\s*\n+\s*/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
}

function normalizeBilingualText(value: BilingualText, mode: "line" | "long" = "line"): BilingualText {
  return {
    zh: mode === "long" ? normalizeLongText(value.zh) : normalizeLineText(value.zh),
    en: mode === "long" ? normalizeLongText(value.en) : normalizeLineText(value.en),
  };
}

function normalizeSiteConfigDraft(value: SiteConfigContent) {
  const next = cloneValue(value);
  next.siteName = normalizeBilingualText(next.siteName);
  next.homeIntro = normalizeBilingualText(next.homeIntro, "long");
  next.title = normalizeBilingualText(next.title);
  next.description = normalizeBilingualText(next.description, "long");
  next.about.eyebrow = normalizeBilingualText(next.about.eyebrow);
  next.about.title = normalizeBilingualText(next.about.title);
  next.about.subtitle = normalizeBilingualText(next.about.subtitle, "long");
  next.about.body = next.about.body.map((paragraph) => normalizeBilingualText(paragraph, "long"));
  next.contact.address = normalizeBilingualText(next.contact.address);
  next.contact.appointmentNote = normalizeBilingualText(next.contact.appointmentNote, "long");
  next.contact.replyWindow = normalizeBilingualText(next.contact.replyWindow, "long");
  next.contact.collaborationNote = normalizeBilingualText(next.contact.collaborationNote, "long");
  next.contactPage.eyebrow = normalizeBilingualText(next.contactPage.eyebrow);
  next.contactPage.title = normalizeBilingualText(next.contactPage.title);
  next.contactPage.description = normalizeBilingualText(next.contactPage.description, "long");
  next.contactPage.aside = normalizeBilingualText(next.contactPage.aside, "long");
  next.footer.intro = normalizeBilingualText(next.footer.intro, "long");
  next.footer.appointment = normalizeBilingualText(next.footer.appointment);
  next.defaultDomain = normalizeLineText(next.defaultDomain);
  next.ogImagePath = normalizeLineText(next.ogImagePath);
  next.protocol = normalizeLineText(next.protocol) as SiteConfigContent["protocol"];
  next.locale = normalizeLineText(next.locale);
  next.contact.email = normalizeLineText(next.contact.email);
  next.contact.phone = normalizeLineText(next.contact.phone);
  next.contact.whatsapp = normalizeLineText(next.contact.whatsapp);
  next.contact.wechat = normalizeLineText(next.contact.wechat);
  next.contact.instagram = normalizeLineText(next.contact.instagram);
  next.contact.pdfRequest = normalizeLineText(next.contact.pdfRequest);
  return next;
}

function normalizeHomeContentDraft(value: HomeContentEditorValue) {
  const next = cloneValue(value);
  next.intro = normalizeBilingualText(next.intro, "long");
  next.homeContent.heroEyebrow = normalizeBilingualText(next.homeContent.heroEyebrow);
  next.homeContent.heroTitle = normalizeBilingualText(next.homeContent.heroTitle);
  next.homeContent.heroSubtitle = normalizeBilingualText(next.homeContent.heroSubtitle, "long");
  next.homeContent.heroPrimaryAction = normalizeBilingualText(next.homeContent.heroPrimaryAction);
  next.homeContent.heroSecondaryAction = normalizeBilingualText(next.homeContent.heroSecondaryAction);
  next.homeContent.focusCurrent.eyebrow = normalizeBilingualText(next.homeContent.focusCurrent.eyebrow, "long");
  next.homeContent.focusRecent.eyebrow = normalizeBilingualText(next.homeContent.focusRecent.eyebrow, "long");
  next.homeContent.focusCurrent.description = normalizeBilingualText(next.homeContent.focusCurrent.description, "long");
  next.homeContent.focusRecent.description = normalizeBilingualText(next.homeContent.focusRecent.description, "long");
  next.homeContent.focusSummaryLine.highlightUnit = normalizeBilingualText(next.homeContent.focusSummaryLine.highlightUnit);
  next.homeContent.focusSummaryLine.catalogueUnit = normalizeBilingualText(next.homeContent.focusSummaryLine.catalogueUnit);
  next.homeContent.focusAction = normalizeBilingualText(next.homeContent.focusAction);
  next.homeContent.selectedWorks.eyebrow = normalizeBilingualText(next.homeContent.selectedWorks.eyebrow);
  next.homeContent.selectedWorks.title = normalizeBilingualText(next.homeContent.selectedWorks.title);
  next.homeContent.selectedWorks.description = normalizeBilingualText(next.homeContent.selectedWorks.description, "long");
  next.homeContent.collectingDirections.eyebrow = normalizeBilingualText(next.homeContent.collectingDirections.eyebrow);
  next.homeContent.collectingDirections.title = normalizeBilingualText(next.homeContent.collectingDirections.title);
  next.homeContent.collectingDirections.description = normalizeBilingualText(next.homeContent.collectingDirections.description, "long");
  next.homeContent.operationalFacts.eyebrow = normalizeBilingualText(next.homeContent.operationalFacts.eyebrow);
  next.homeContent.operationalFacts.title = normalizeBilingualText(next.homeContent.operationalFacts.title);
  next.homeContent.operationalFacts.description = normalizeBilingualText(next.homeContent.operationalFacts.description, "long");
  next.collectingDirections = next.collectingDirections.map((item) => ({
    ...item,
    name: normalizeBilingualText(item.name),
    description: normalizeBilingualText(item.description, "long"),
  }));
  next.operationalFacts = next.operationalFacts.map((item) => ({
    ...item,
    title: normalizeBilingualText(item.title),
    value: normalizeBilingualText(item.value),
    description: normalizeBilingualText(item.description, "long"),
  }));
  return next;
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
  next.viewingNote = normalizeBilingualText(next.viewingNote, "long");
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
  next.curatorialLead = normalizeBilingualText(next.curatorialLead, "long");
  next.description = (next.description ?? []).map((item) => normalizeBilingualText(item, "long"));
  next.catalogueTitle = normalizeBilingualText(next.catalogueTitle);
  next.catalogueIntro = normalizeBilingualText(next.catalogueIntro, "long");
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
  next.body = (next.body ?? []).map((item) => normalizeBilingualText(item, "long"));
  next.keywords = (next.keywords ?? []).map((item) => normalizeBilingualText(item));
  return next;
}

function summarizeIssueBadges(issues: ValidationIssue[], limit = 2) {
  return issues
    .filter((issue) => issue.level === "error")
    .slice(0, limit)
    .map((issue) => issue.message.replace(/^请/, "").replace(/。$/, ""));
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
        message: attempt === 0 ? "内容已保存，正在等待网站同步。" : "网站正在同步最新内容。",
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
            message: "内容已保存，但网站暂未完成同步。",
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
  return (
    <section id={id} className="space-y-4 border border-[var(--line)] bg-[var(--surface)] p-5 md:p-6 scroll-mt-28">
      <div className="space-y-2 border-b border-[var(--line)] pb-4">
        <Label>{title}</Label>
        {description ? <p className="text-sm leading-7 text-[var(--muted)]">{description}</p> : null}
        {reminders?.length ? (
          <p className="text-sm leading-7 text-[var(--accent)]/88">{reminders.join("、")}</p>
        ) : null}
        {issues?.length ? (
          <p className="text-sm leading-7 text-[#8e4e3b]">
            {issues
              .filter((issue) => issue.level === "error")
              .map((issue) => issue.message)
              .join("、")}
          </p>
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
  issues: Array<ValidationIssue | EditorReminder>;
  sectionLabels: Record<string, string>;
}) {
  const blocking = issues.filter((issue) => ("level" in issue ? issue.level === "error" : true));

  if (!blocking.length) {
    return null;
  }

  return (
    <div className="space-y-3 border border-[#d8c1b5] bg-[#fbf5f1] p-4">
      <p className="text-sm leading-7 text-[#8e4e3b]">
        当前内容尚不能发布，请先完成以下字段：
        {blocking.map((issue) => issue.message.replace(/^请/, "").replace(/。$/, "")).join("、")}
      </p>
      <div className="flex flex-wrap gap-2">
        {blocking.map((issue, index) => {
          return (
            <button
              key={`${issue.field}-${index}`}
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
    </div>
  );
}

function ReminderSummary({
  title,
  reminders,
  sectionLabels,
}: {
  title: string;
  reminders: EditorReminder[];
  sectionLabels: Record<string, string>;
}) {
  if (!reminders.length) {
    return null;
  }

  return (
    <div className="space-y-3 border border-[var(--line)] bg-white/30 p-4">
      <p className="text-sm leading-7 text-[var(--muted)]">
        {`${title}：当前还有 ${reminders.length} 项建议补充内容。`}
      </p>
      <div className="flex flex-wrap gap-2">
        {reminders.map((reminder) => (
          <button
            key={`${reminder.section}-${reminder.field}`}
            type="button"
            onClick={() => {
              locateFieldTarget(reminder.field, reminder.section);
            }}
            className="border border-[var(--line)] px-3 py-1.5 text-xs leading-5 text-[var(--accent)] transition-colors hover:bg-[var(--surface-strong)]"
          >
            {`${sectionLabels[reminder.section] ?? reminder.section} · ${reminder.message}`}
          </button>
        ))}
      </div>
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
}) {
  return (
    <div data-field-key="gallery" className="space-y-4">
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
      <div className="grid gap-2 border border-[var(--line)] bg-[var(--surface)] p-3">
        {items.length ? (
          items.map((item, index) => (
            <button
              key={`${renderTitle(item, index)}-${index}`}
              type="button"
              onClick={() => onSelect(index)}
              className={`grid gap-1 border px-4 py-3 text-left ${
                index === selectedIndex
                  ? "border-[var(--line-strong)] bg-[var(--surface-strong)]"
                  : "border-[var(--line)] bg-white/40"
              }`}
            >
              <p className="text-sm leading-6 text-[var(--ink)]">{renderTitle(item, index)}</p>
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
  onSaveDraft,
  onSavePublish,
}: {
  publicationStatus: PublicationStatus;
  onSaveDraft: () => void;
  onSavePublish: () => void;
}) {
  return (
    <>
      <span className="text-sm text-[var(--muted)]">{publicationStatus === "published" ? "已发布" : "草稿"}</span>
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
    [options, section],
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

function SiteSettingsEditor({
  title,
  description,
  initialValue,
  initialFocus,
}: {
  title: string;
  description: string;
  initialValue: SiteConfigContent;
  initialFocus?: string;
}) {
  const { draft, persisted, setDraft, saveNow, saveState, isDirty } = useAutosaveSection("siteConfig", initialValue, {
    prepare: normalizeSiteConfigDraft,
  });
  const reminders = useMemo(() => getSiteConfigReminders(draft), [draft]);
  const sectionLabels = {
    branding: "品牌与 SEO",
    about: "关于页面",
    contact: "联系方式",
    contactPage: "联系页文案",
    footer: "页脚",
  } satisfies Record<string, string>;
  const sectionReminders = {
    branding: reminders.filter((item) => item.section === "branding").map((item) => item.message),
    about: reminders.filter((item) => item.section === "about").map((item) => item.message),
    contact: reminders.filter((item) => item.section === "contact").map((item) => item.message),
    contactPage: reminders.filter((item) => item.section === "contactPage").map((item) => item.message),
    footer: reminders.filter((item) => item.section === "footer").map((item) => item.message),
  };
  const syncState = useWebsiteSyncStatus({
    target: { section: "siteConfig" },
    changeToken: JSON.stringify(persisted),
    hasPendingChanges: isDirty || saveState.phase === "saving" || saveState.phase === "creating",
  });

  useInitialFieldFocus(initialFocus);

  function update(recipe: (value: SiteConfigContent) => void) {
    setDraft((current) => {
      const next = cloneValue(current);
      recipe(next);
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
        actions={<ToolbarButton onClick={() => void saveNow(draft, "manual")}>保存更改</ToolbarButton>}
      />
      <div className="space-y-3 border-b border-[var(--line)] pb-6">
        <p className="text-sm leading-8 text-[var(--muted)]">{description}</p>
      </div>
      <ReminderSummary title="当前还有一些建议补充项" reminders={reminders} sectionLabels={sectionLabels} />
      <div className="grid gap-6">
        <SectionBlock id="section-branding" title="品牌与 SEO" description="网站名称、首页短介绍与搜索展示信息共用这一组内容。" reminders={sectionReminders.branding}>
          <div className="grid gap-4">
            <BilingualInput label="品牌名称" value={draft.siteName} onChange={(next) => update((value) => { value.siteName = next; })} fieldKeys={{ zh: "siteName.zh", en: "siteName.en" }} />
            <BilingualTextarea label="首页短介绍" value={draft.homeIntro} onChange={(next) => update((value) => { value.homeIntro = next; })} rows={4} fieldKeys={{ zh: "homeIntro.zh", en: "homeIntro.en" }} />
            <BilingualInput label="浏览器标题" value={draft.title} onChange={(next) => update((value) => { value.title = next; })} fieldKeys={{ zh: "title.zh", en: "title.en" }} />
            <BilingualTextarea label="站点描述" value={draft.description} onChange={(next) => update((value) => { value.description = next; })} rows={4} fieldKeys={{ zh: "description.zh", en: "description.en" }} />
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="主域名" value={draft.defaultDomain} onChange={(next) => update((value) => { value.defaultDomain = next; })} fieldKey="defaultDomain" />
              <TextField label="Open Graph 图片路径" value={draft.ogImagePath} onChange={(next) => update((value) => { value.ogImagePath = next; })} />
              <TextField label="协议" value={draft.protocol} onChange={(next) => update((value) => { value.protocol = next as SiteConfigContent["protocol"]; })} />
              <TextField label="语言地区" value={draft.locale} onChange={(next) => update((value) => { value.locale = next; })} />
            </div>
          </div>
        </SectionBlock>

        <SectionBlock id="section-about" title="关于页面" description="关于页主标题、副标题和正文统一在这里维护。" reminders={sectionReminders.about}>
          <div className="grid gap-4">
            <BilingualInput label="页眉标签" value={draft.about.eyebrow} onChange={(next) => update((value) => { value.about.eyebrow = next; })} />
            <BilingualInput label="About 标题" value={draft.about.title} onChange={(next) => update((value) => { value.about.title = next; })} fieldKeys={{ zh: "about.title.zh", en: "about.title.en" }} />
            <BilingualTextarea label="About 副标题" value={draft.about.subtitle} onChange={(next) => update((value) => { value.about.subtitle = next; })} rows={3} fieldKeys={{ zh: "about.subtitle.zh", en: "about.subtitle.en" }} />
            <div data-field-key="collectingDirections" className="grid gap-4">
              {draft.about.body.map((paragraph, index) => (
                <div key={`about-body-${index}`} className="space-y-3 border border-[var(--line)] bg-white/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Label>{`正文 ${index + 1}`}</Label>
                    {draft.about.body.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => update((value) => { value.about.body = removeArrayItem(value.about.body, index); })}
                        className="text-xs tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[#8e4e3b]"
                      >
                        删除
                      </button>
                    ) : null}
                  </div>
                  <BilingualTextarea
                    label={`段落 ${index + 1}`}
                    value={paragraph}
                    onChange={(next) => update((value) => { value.about.body = updateArrayItem(value.about.body, index, (item) => { item.zh = next.zh; item.en = next.en; }); })}
                    rows={5}
                    fieldKeys={{ zh: `about.body.${index}.zh`, en: `about.body.${index}.en` }}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => update((value) => { value.about.body = [...value.about.body, emptyBilingual()]; })}
                className="inline-flex min-h-11 items-center justify-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)]"
              >
                新增正文段落
              </button>
            </div>
          </div>
        </SectionBlock>

        <SectionBlock id="section-contact" title="联系方式" description="联系页、页脚和网站联系入口共用这里的联系方式。" reminders={sectionReminders.contact}>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="邮箱" type="email" value={draft.contact.email} onChange={(next) => update((value) => { value.contact.email = next; })} fieldKey="contact.email" />
            <TextField label="电话" value={draft.contact.phone} onChange={(next) => update((value) => { value.contact.phone = next; })} fieldKey="contact.phone" />
            <TextField label="WhatsApp" value={draft.contact.whatsapp} onChange={(next) => update((value) => { value.contact.whatsapp = next; })} fieldKey="contact.whatsapp" />
            <TextField label="微信" value={draft.contact.wechat} onChange={(next) => update((value) => { value.contact.wechat = next; })} fieldKey="contact.wechat" />
            <TextField label="Instagram" value={draft.contact.instagram} onChange={(next) => update((value) => { value.contact.instagram = next; })} />
            <TextField label="PDF 索取邮箱" type="email" value={draft.contact.pdfRequest} onChange={(next) => update((value) => { value.contact.pdfRequest = next; })} />
          </div>
          <div className="grid gap-4">
            <BilingualInput label="城市与空间说明" value={draft.contact.address} onChange={(next) => update((value) => { value.contact.address = next; })} />
            <BilingualTextarea label="预约说明" value={draft.contact.appointmentNote} onChange={(next) => update((value) => { value.contact.appointmentNote = next; })} rows={3} />
            <BilingualTextarea label="回复时间" value={draft.contact.replyWindow} onChange={(next) => update((value) => { value.contact.replyWindow = next; })} rows={3} />
            <BilingualTextarea label="合作与借展说明" value={draft.contact.collaborationNote} onChange={(next) => update((value) => { value.contact.collaborationNote = next; })} rows={3} />
          </div>
        </SectionBlock>

        <SectionBlock id="section-contactPage" title="联系页文案" description="联系页页头与联系方式标签统一维护。" reminders={sectionReminders.contactPage}>
          <div className="grid gap-4">
            <BilingualInput label="页眉标签" value={draft.contactPage.eyebrow} onChange={(next) => update((value) => { value.contactPage.eyebrow = next; })} />
            <BilingualInput label="联系页标题" value={draft.contactPage.title} onChange={(next) => update((value) => { value.contactPage.title = next; })} />
            <BilingualTextarea label="联系页说明" value={draft.contactPage.description} onChange={(next) => update((value) => { value.contactPage.description = next; })} rows={4} />
            <BilingualTextarea label="联系页右侧辅助说明" value={draft.contactPage.aside} onChange={(next) => update((value) => { value.contactPage.aside = next; })} rows={4} />
            <div className="grid gap-4 md:grid-cols-3">
              <BilingualInput label="邮箱标签" value={draft.contactPage.infoLabels.email} onChange={(next) => update((value) => { value.contactPage.infoLabels.email = next; })} />
              <BilingualInput label="微信标签" value={draft.contactPage.infoLabels.wechat} onChange={(next) => update((value) => { value.contactPage.infoLabels.wechat = next; })} />
              <BilingualInput label="电话 / WhatsApp 标签" value={draft.contactPage.infoLabels.phoneWhatsapp} onChange={(next) => update((value) => { value.contactPage.infoLabels.phoneWhatsapp = next; })} />
            </div>
          </div>
        </SectionBlock>

        <SectionBlock id="section-footer" title="页脚" description="页脚简介、预约说明和页脚标签统一在这里维护。" reminders={sectionReminders.footer}>
          <div className="grid gap-4">
            <BilingualTextarea label="页脚简介" value={draft.footer.intro} onChange={(next) => update((value) => { value.footer.intro = next; })} rows={4} fieldKeys={{ zh: "footer.intro.zh", en: "footer.intro.en" }} />
            <BilingualInput label="预约说明" value={draft.footer.appointment} onChange={(next) => update((value) => { value.footer.appointment = next; })} />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <BilingualInput label="版权标签" value={draft.footer.copyrightLabel} onChange={(next) => update((value) => { value.footer.copyrightLabel = next; })} />
              <BilingualInput label="联系标题" value={draft.footer.contactHeading} onChange={(next) => update((value) => { value.footer.contactHeading = next; })} />
              <BilingualInput label="信息标题" value={draft.footer.informationHeading} onChange={(next) => update((value) => { value.footer.informationHeading = next; })} />
              <BilingualInput label="藏品链接名称" value={draft.footer.collectionLink} onChange={(next) => update((value) => { value.footer.collectionLink = next; })} />
              <BilingualInput label="展览链接名称" value={draft.footer.exhibitionsLink} onChange={(next) => update((value) => { value.footer.exhibitionsLink = next; })} />
              <BilingualInput label="文章链接名称" value={draft.footer.journalLink} onChange={(next) => update((value) => { value.footer.journalLink = next; })} />
              <BilingualInput label="PDF 标签" value={draft.footer.pdfRequestLabel} onChange={(next) => update((value) => { value.footer.pdfRequestLabel = next; })} />
              <BilingualInput label="Instagram 标签" value={draft.footer.instagramLabel} onChange={(next) => update((value) => { value.footer.instagramLabel = next; })} />
              <BilingualInput label="微信标签" value={draft.footer.wechatLabel} onChange={(next) => update((value) => { value.footer.wechatLabel = next; })} />
            </div>
          </div>
        </SectionBlock>
      </div>
    </div>
  );
}

function HomeContentEditor({
  title,
  description,
  initialValue,
  content,
  initialFocus,
}: {
  title: string;
  description: string;
  initialValue: HomeContentEditorValue;
  content: SiteContent;
  initialFocus?: string;
}) {
  const { draft, persisted, setDraft, saveNow, saveState, isDirty } = useAutosaveSection("homeContent", initialValue, {
    prepare: normalizeHomeContentDraft,
  });
  const reminders = useMemo(() => getHomeContentReminders(draft), [draft]);
  const sectionLabels = {
    hero: "Hero",
    focus: "当前专题",
    selectedWorks: "精选作品",
    directions: "收藏方向",
    trust: "专业信任",
  } satisfies Record<string, string>;
  const sectionReminders = {
    hero: reminders.filter((item) => item.section === "hero").map((item) => item.message),
    focus: reminders.filter((item) => item.section === "focus").map((item) => item.message),
    selectedWorks: reminders.filter((item) => item.section === "selectedWorks").map((item) => item.message),
    directions: reminders.filter((item) => item.section === "directions").map((item) => item.message),
    trust: reminders.filter((item) => item.section === "trust").map((item) => item.message),
  };
  const syncState = useWebsiteSyncStatus({
    target: { section: "homeContent" },
    changeToken: JSON.stringify(persisted),
    hasPendingChanges: isDirty || saveState.phase === "saving" || saveState.phase === "creating",
  });

  useInitialFieldFocus(initialFocus);

  function update(recipe: (value: HomeContentEditorValue) => void) {
    setDraft((current) => {
      const next = cloneValue(current);
      recipe(next);
      return next;
    });
  }

  const artworkOptions = content.artworks.map((artwork) => ({
    value: getArtworkId(artwork),
    title: artwork.title.zh || artwork.slug,
    note: artwork.period.zh || artwork.category.zh,
  }));

  return (
    <div className="space-y-6">
      <StatusBar
        title={title}
        state={saveState}
        sync={syncState}
        isDirty={isDirty}
        actions={<ToolbarButton onClick={() => void saveNow(draft, "manual")}>保存更改</ToolbarButton>}
      />
      <div className="space-y-3 border-b border-[var(--line)] pb-6">
        <p className="text-sm leading-8 text-[var(--muted)]">{description}</p>
      </div>
      <ReminderSummary title="当前还有一些建议补充项" reminders={reminders} sectionLabels={sectionLabels} />

      <div className="grid gap-6">
        <SectionBlock id="section-hero" title="Hero" description="首页首屏的主标题、副标题和按钮文案。" reminders={sectionReminders.hero}>
          <div className="grid gap-4">
            <BilingualInput label="页眉标签" value={draft.homeContent.heroEyebrow} onChange={(next) => update((value) => { value.homeContent.heroEyebrow = next; })} />
            <BilingualInput label="主标题" value={draft.homeContent.heroTitle} onChange={(next) => update((value) => { value.homeContent.heroTitle = next; })} fieldKeys={{ zh: "homeContent.heroTitle.zh", en: "homeContent.heroTitle.en" }} />
            <BilingualTextarea label="副标题" value={draft.homeContent.heroSubtitle} onChange={(next) => update((value) => { value.homeContent.heroSubtitle = next; })} rows={3} fieldKeys={{ zh: "homeContent.heroSubtitle.zh", en: "homeContent.heroSubtitle.en" }} />
            <BilingualTextarea label="首页短介绍" value={draft.intro} onChange={(next) => update((value) => { value.intro = next; })} rows={4} />
            <div className="grid gap-4 md:grid-cols-2">
              <BilingualInput label="主按钮" value={draft.homeContent.heroPrimaryAction} onChange={(next) => update((value) => { value.homeContent.heroPrimaryAction = next; })} />
              <BilingualInput label="副按钮" value={draft.homeContent.heroSecondaryAction} onChange={(next) => update((value) => { value.homeContent.heroSecondaryAction = next; })} />
            </div>
          </div>
        </SectionBlock>

        <SectionBlock id="section-focus" title="当前专题" description="控制首页第二屏的专题区文案。" reminders={sectionReminders.focus}>
          <div className="grid gap-4 md:grid-cols-2">
            <BilingualTextarea label="当前专题标签与说明" value={draft.homeContent.focusCurrent.eyebrow} onChange={(next) => update((value) => { value.homeContent.focusCurrent.eyebrow = next; })} rows={2} fieldKeys={{ zh: "homeContent.focusCurrent.eyebrow.zh", en: "homeContent.focusCurrent.eyebrow.en" }} />
            <BilingualTextarea label="近期展览标签与说明" value={draft.homeContent.focusRecent.eyebrow} onChange={(next) => update((value) => { value.homeContent.focusRecent.eyebrow = next; })} rows={2} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <BilingualTextarea label="当前专题说明" value={draft.homeContent.focusCurrent.description} onChange={(next) => update((value) => { value.homeContent.focusCurrent.description = next; })} rows={4} fieldKeys={{ zh: "homeContent.focusCurrent.description.zh", en: "homeContent.focusCurrent.description.en" }} />
            <BilingualTextarea label="近期展览说明" value={draft.homeContent.focusRecent.description} onChange={(next) => update((value) => { value.homeContent.focusRecent.description = next; })} rows={4} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <BilingualInput label="重点作品计数单位" value={draft.homeContent.focusSummaryLine.highlightUnit} onChange={(next) => update((value) => { value.homeContent.focusSummaryLine.highlightUnit = next; })} />
            <BilingualInput label="图录页数字段单位" value={draft.homeContent.focusSummaryLine.catalogueUnit} onChange={(next) => update((value) => { value.homeContent.focusSummaryLine.catalogueUnit = next; })} />
            <BilingualInput label="专题按钮" value={draft.homeContent.focusAction} onChange={(next) => update((value) => { value.homeContent.focusAction = next; })} />
          </div>
        </SectionBlock>

        <SectionBlock id="section-selectedWorks" title="精选作品" description="控制精选作品区标题，并选择哪些藏品出现在首页。" reminders={sectionReminders.selectedWorks}>
          <div className="grid gap-4">
            <BilingualInput label="区块标签" value={draft.homeContent.selectedWorks.eyebrow} onChange={(next) => update((value) => { value.homeContent.selectedWorks.eyebrow = next; })} />
            <BilingualInput label="区块标题" value={draft.homeContent.selectedWorks.title} onChange={(next) => update((value) => { value.homeContent.selectedWorks.title = next; })} />
            <BilingualTextarea label="区块说明" value={draft.homeContent.selectedWorks.description} onChange={(next) => update((value) => { value.homeContent.selectedWorks.description = next; })} rows={4} />
            <RelationChecklist
              label="首页精选作品"
              options={artworkOptions}
              selected={draft.featuredArtworkIds}
              onToggle={(value) => update((next) => {
                next.featuredArtworkIds = next.featuredArtworkIds.includes(value)
                  ? next.featuredArtworkIds.filter((item) => item !== value)
                  : [...next.featuredArtworkIds, value];
              })}
              fieldKey="featuredArtworkIds"
            />
          </div>
        </SectionBlock>

        <SectionBlock id="section-directions" title="收藏方向" description="维护首页收藏方向区块标题与具体条目。" reminders={sectionReminders.directions}>
          <div className="grid gap-4">
            <BilingualInput label="区块标签" value={draft.homeContent.collectingDirections.eyebrow} onChange={(next) => update((value) => { value.homeContent.collectingDirections.eyebrow = next; })} />
            <BilingualInput label="区块标题" value={draft.homeContent.collectingDirections.title} onChange={(next) => update((value) => { value.homeContent.collectingDirections.title = next; })} />
            <BilingualTextarea label="区块说明" value={draft.homeContent.collectingDirections.description} onChange={(next) => update((value) => { value.homeContent.collectingDirections.description = next; })} rows={4} />
            <div data-field-key="operationalFacts" className="grid gap-4">
              {draft.collectingDirections.map((direction, index) => (
                <div key={`direction-${index}`} className="space-y-3 border border-[var(--line)] bg-white/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Label>{`收藏方向 ${index + 1}`}</Label>
                    <button
                      type="button"
                      onClick={() => update((value) => { value.collectingDirections = removeArrayItem(value.collectingDirections, index); })}
                      className="text-xs tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[#8e4e3b]"
                    >
                      删除
                    </button>
                  </div>
                  <BilingualInput label="名称" value={direction.name} onChange={(next) => update((value) => { value.collectingDirections = updateArrayItem(value.collectingDirections, index, (item) => { item.name = next; }); })} />
                  <BilingualTextarea label="说明" value={direction.description} onChange={(next) => update((value) => { value.collectingDirections = updateArrayItem(value.collectingDirections, index, (item) => { item.description = next; }); })} rows={4} />
                </div>
              ))}
              <button
                type="button"
                onClick={() => update((value) => { value.collectingDirections = [...value.collectingDirections, { name: emptyBilingual(), description: emptyBilingual() }]; })}
                className="inline-flex min-h-11 items-center justify-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)]"
              >
                新增收藏方向
              </button>
            </div>
          </div>
        </SectionBlock>

        <SectionBlock id="section-trust" title="专业信任" description="维护首页专业信任区标题与数据条目。" reminders={sectionReminders.trust}>
          <div className="grid gap-4">
            <BilingualInput label="区块标签" value={draft.homeContent.operationalFacts.eyebrow} onChange={(next) => update((value) => { value.homeContent.operationalFacts.eyebrow = next; })} />
            <BilingualInput label="区块标题" value={draft.homeContent.operationalFacts.title} onChange={(next) => update((value) => { value.homeContent.operationalFacts.title = next; })} />
            <BilingualTextarea label="区块说明" value={draft.homeContent.operationalFacts.description} onChange={(next) => update((value) => { value.homeContent.operationalFacts.description = next; })} rows={4} />
            <div className="grid gap-4">
              {draft.operationalFacts.map((fact, index) => (
                <div key={`fact-${index}`} className="space-y-3 border border-[var(--line)] bg-white/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Label>{`专业信任 ${index + 1}`}</Label>
                    <button
                      type="button"
                      onClick={() => update((value) => { value.operationalFacts = removeArrayItem(value.operationalFacts, index); })}
                      className="text-xs tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[#8e4e3b]"
                    >
                      删除
                    </button>
                  </div>
                  <BilingualInput label="标题" value={fact.title} onChange={(next) => update((value) => { value.operationalFacts = updateArrayItem(value.operationalFacts, index, (item) => { item.title = next; }); })} />
                  <BilingualInput label="数字或字段值" value={fact.value} onChange={(next) => update((value) => { value.operationalFacts = updateArrayItem(value.operationalFacts, index, (item) => { item.value = next; }); })} />
                  <BilingualTextarea label="说明" value={fact.description} onChange={(next) => update((value) => { value.operationalFacts = updateArrayItem(value.operationalFacts, index, (item) => { item.description = next; }); })} rows={4} />
                </div>
              ))}
              <button
                type="button"
                onClick={() => update((value) => { value.operationalFacts = [...value.operationalFacts, { title: emptyBilingual(), value: emptyBilingual(), description: emptyBilingual() }]; })}
                className="inline-flex min-h-11 items-center justify-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)]"
              >
                新增专业信任条目
              </button>
            </div>
          </div>
        </SectionBlock>
      </div>
    </div>
  );
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
            body: JSON.stringify({ artwork: preparedArtwork }),
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
    [],
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
        <aside>
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
                      <option value="sold">已售</option>
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
                onSaveDraft={() => void saveCurrentExhibition("draft")}
                onSavePublish={() => void saveCurrentExhibition("published")}
              />
              <ToolbarButton onClick={() => void duplicateCurrentExhibition()}>复制当前展览</ToolbarButton>
            </>
          ) : undefined
        }
      />
      <div className="space-y-3 border-b border-[var(--line)] pb-6">
        <p className="text-sm leading-8 text-[var(--muted)]">{description}</p>
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
                  <TextField label="图录页数" type="number" value={String(exhibition.cataloguePages)} onChange={(next) => update((items) => { items[selectedIndex].cataloguePages = Number(next || 0); })} />
                </div>
                <BilingualInput label="时间" value={exhibition.period} onChange={(next) => update((items) => { items[selectedIndex].period = next; })} fieldKeys={{ zh: "period.zh", en: "period.en" }} />
                <BilingualInput label="地点" value={exhibition.venue} onChange={(next) => update((items) => { items[selectedIndex].venue = next; })} fieldKeys={{ zh: "venue.zh", en: "venue.en" }} />
                <BilingualTextarea label="简介" value={exhibition.intro} onChange={(next) => update((items) => { items[selectedIndex].intro = next; })} rows={4} fieldKeys={{ zh: "intro.zh", en: "intro.en" }} />
                <BilingualTextarea label="策展前言" value={exhibition.curatorialLead} onChange={(next) => update((items) => { items[selectedIndex].curatorialLead = next; })} rows={4} />
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
                <BilingualTextarea label="图录说明" value={exhibition.catalogueIntro} onChange={(next) => update((items) => { items[selectedIndex].catalogueIntro = next; })} rows={4} />
                <RelationChecklist fieldKey="highlightArtworkSlugs" label="重点作品" options={artworkOptions} selected={exhibition.highlightArtworkSlugs} onToggle={(value) => update((items) => { const list = items[selectedIndex].highlightArtworkSlugs; items[selectedIndex].highlightArtworkSlugs = list.includes(value) ? list.filter((item) => item !== value) : [...list, value]; items[selectedIndex].highlightCount = items[selectedIndex].highlightArtworkSlugs.length; })} />
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
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const sectionLabels = {
    basic: "基础信息",
    body: "正文与关键词",
  } satisfies Record<string, string>;

  useEffect(() => {
    setSelectedIndex(0);
    setValidationIssues([]);
  }, [initialValue]);

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

  async function saveCurrentArticle(nextStatus: PublicationStatus) {
    if (!article) {
      return;
    }

    const previousDraft = cloneValue(draft);
    const nextDraft = cloneValue(draft);
    nextDraft[selectedIndex].publicationStatus = nextStatus;
    if (nextStatus === "published") {
      setValidationIssues(getArticlePublicationIssues(nextDraft[selectedIndex], nextDraft));
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
    body: validationIssues.filter((issue) => issue.section === "body"),
  };

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
                onSaveDraft={() => void saveCurrentArticle("draft")}
                onSavePublish={() => void saveCurrentArticle("published")}
              />
              <ToolbarButton onClick={() => void duplicateCurrentArticle()}>复制当前文章</ToolbarButton>
            </>
          ) : undefined
        }
      />
      <div className="space-y-3 border-b border-[var(--line)] pb-6">
        <p className="text-sm leading-8 text-[var(--muted)]">{description}</p>
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
          <div className="space-y-6">
            <SectionBlock id="section-basic" title="基础信息" issues={sectionIssues.basic}>
              <div className="grid gap-4">
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
                  onChange={(next) => update((items) => { items[selectedIndex].cover = next; })}
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
                <BilingualInput label="标题" value={article.title} onChange={(next) => update((items) => { items[selectedIndex].title = next; })} fieldKeys={{ zh: "title.zh", en: "title.en" }} />
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="Slug" value={article.slug} onChange={(next) => update((items) => { items[selectedIndex].slug = next; })} fieldKey="slug" />
                  <TextField label="日期" type="date" value={article.date} onChange={(next) => update((items) => { items[selectedIndex].date = next; })} fieldKey="date" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <BilingualInput label="分类" value={article.category} onChange={(next) => update((items) => { items[selectedIndex].category = next; })} fieldKeys={{ zh: "category.zh", en: "category.en" }} />
                  <BilingualInput label="栏目" value={article.column} onChange={(next) => update((items) => { items[selectedIndex].column = next; })} />
                  <BilingualInput label="作者" value={article.author} onChange={(next) => update((items) => { items[selectedIndex].author = next; })} />
                </div>
                <BilingualTextarea label="摘要" value={article.excerpt} onChange={(next) => update((items) => { items[selectedIndex].excerpt = next; })} rows={4} fieldKeys={{ zh: "excerpt.zh", en: "excerpt.en" }} />
              </div>
            </SectionBlock>
            <SectionBlock id="section-body" title="正文与关键词" issues={sectionIssues.body}>
              <div data-field-key="body" className="grid gap-4">
                {article.body.map((paragraph, index) => (
                  <BilingualTextarea key={`article-body-${index}`} label={`正文 ${index + 1}`} value={paragraph} onChange={(next) => update((items) => { items[selectedIndex].body = updateArrayItem(items[selectedIndex].body, index, (item) => { item.zh = next.zh; item.en = next.en; }); })} rows={5} fieldKeys={{ zh: `body.${index}.zh`, en: `body.${index}.en` }} />
                ))}
                <button data-field-key="body.add" type="button" onClick={() => update((items) => { items[selectedIndex].body = [...items[selectedIndex].body, emptyBilingual()]; })} className="inline-flex min-h-11 items-center justify-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)]">新增正文段落</button>
                {article.keywords.map((keyword, index) => (
                  <BilingualInput key={`article-keyword-${index}`} label={`关键词 ${index + 1}`} value={keyword} onChange={(next) => update((items) => { items[selectedIndex].keywords = updateArrayItem(items[selectedIndex].keywords, index, (item) => { item.zh = next.zh; item.en = next.en; }); })} />
                ))}
                <button type="button" onClick={() => update((items) => { items[selectedIndex].keywords = [...items[selectedIndex].keywords, emptyBilingual()]; })} className="inline-flex min-h-11 items-center justify-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)]">新增关键词</button>
              </div>
            </SectionBlock>
            <SectionBlock title="关联内容">
              <div className="grid gap-4">
                <RelationChecklist label="关联藏品" options={artworkOptions} selected={article.relatedArtworkSlugs} onToggle={(value) => update((items) => { const list = items[selectedIndex].relatedArtworkSlugs; items[selectedIndex].relatedArtworkSlugs = list.includes(value) ? list.filter((item) => item !== value) : [...list, value]; })} />
                <RelationChecklist label="关联展览" options={exhibitionOptions} selected={article.relatedExhibitionSlugs} onToggle={(value) => update((items) => { const list = items[selectedIndex].relatedExhibitionSlugs; items[selectedIndex].relatedExhibitionSlugs = list.includes(value) ? list.filter((item) => item !== value) : [...list, value]; })} />
              </div>
            </SectionBlock>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AdminCmsEditor(props: AdminCmsEditorProps) {
  if (props.section === "siteConfig") {
    return <SiteSettingsEditor title={props.title} description={props.description} initialValue={props.initialValue as SiteConfigContent} initialFocus={props.initialFocus} />;
  }

  if (props.section === "homeContent") {
    return <HomeContentEditor title={props.title} description={props.description} initialValue={props.initialValue as HomeContentEditorValue} content={props.content} initialFocus={props.initialFocus} />;
  }

  if (props.section === "artworks") {
    return <ArtworkEditor title={props.title} description={props.description} initialValue={props.initialValue as Artwork[]} content={props.content} autoCreate={props.autoCreate} initialSearch={props.initialSearch} initialStatusFilter={props.initialStatusFilter} initialFocus={props.initialFocus} />;
  }

  if (props.section === "exhibitions") {
    return <ExhibitionsEditor title={props.title} description={props.description} initialValue={props.initialValue as Exhibition[]} content={props.content} initialFocus={props.initialFocus} />;
  }

  return <ArticlesEditor title={props.title} description={props.description} initialValue={props.initialValue as Article[]} content={props.content} initialFocus={props.initialFocus} />;
}
