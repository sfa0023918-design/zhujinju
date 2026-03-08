"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import type { AdminActionState } from "@/app/admin/actions";
import type {
  Article,
  Artwork,
  BrandIntroContent,
  BilingualText,
  CollectingDirection,
  EditableSectionKey,
  Exhibition,
  OperationalFact,
  PageCopyContent,
  PublicationStatus,
  SiteConfigContent,
  SiteContent,
} from "@/lib/site-data";

import { AdminMediaField } from "./admin-media-field";

const initialState: AdminActionState = {};

type AdminVisualEditorProps = {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  section: EditableSectionKey;
  title: string;
  description: string;
  initialValue: SiteContent[EditableSectionKey];
  content: SiteContent;
  autoCreate?: boolean;
};

function emptyBilingual(): BilingualText {
  return { zh: "", en: "" };
}

function createSlug(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

function createArtwork(): Artwork {
  return {
    slug: createSlug("artwork"),
    publicationStatus: "draft",
    title: emptyBilingual(),
    subtitle: emptyBilingual(),
    period: emptyBilingual(),
    region: emptyBilingual(),
    origin: emptyBilingual(),
    material: emptyBilingual(),
    category: emptyBilingual(),
    dimensions: emptyBilingual(),
    status: "inquiry",
    excerpt: emptyBilingual(),
    viewingNote: emptyBilingual(),
    comparisonNote: emptyBilingual(),
    provenance: [],
    exhibitions: [],
    publications: [],
    inquirySupport: [
      { zh: "可索取高清图", en: "High-resolution images available on request" },
      { zh: "可索取品相信息", en: "Condition report available on request" },
      { zh: "可索取图录页", en: "Catalogue pages available on request" },
    ],
    relatedArticleSlugs: [],
    relatedExhibitionSlugs: [],
    image: "",
    gallery: [],
    featured: false,
  };
}

function createExhibition(): Exhibition {
  return {
    slug: createSlug("exhibition"),
    publicationStatus: "draft",
    title: emptyBilingual(),
    subtitle: emptyBilingual(),
    period: emptyBilingual(),
    venue: emptyBilingual(),
    intro: emptyBilingual(),
    description: [emptyBilingual()],
    highlightArtworkSlugs: [],
    highlightCount: 0,
    catalogueTitle: emptyBilingual(),
    catalogueIntro: emptyBilingual(),
    cataloguePages: 0,
    curatorialLead: emptyBilingual(),
    relatedArticleSlugs: [],
    cover: "",
    current: false,
  };
}

function createArticle(): Article {
  return {
    slug: createSlug("article"),
    publicationStatus: "draft",
    title: emptyBilingual(),
    category: emptyBilingual(),
    column: emptyBilingual(),
    author: emptyBilingual(),
    date: new Date().toISOString().slice(0, 10),
    excerpt: emptyBilingual(),
    body: [emptyBilingual()],
    keywords: [emptyBilingual()],
    relatedArtworkSlugs: [],
    relatedExhibitionSlugs: [],
    cover: "",
  };
}

function createDirection(): CollectingDirection {
  return {
    name: emptyBilingual(),
    description: emptyBilingual(),
  };
}

function createOperationalFact(): OperationalFact {
  return {
    title: emptyBilingual(),
    value: emptyBilingual(),
    description: emptyBilingual(),
  };
}

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

function updateArrayItem<T>(items: T[], index: number, updater: (item: T) => void) {
  const next = [...items];
  next[index] = cloneValue(next[index]);
  updater(next[index]);
  return next;
}

function removeArrayItem<T>(items: T[], index: number) {
  return items.filter((_, itemIndex) => itemIndex !== index);
}

function moveArrayItem<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function toggleString(items: string[], value: string) {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[0.72rem] tracking-[0.18em] text-[var(--accent)]">{children}</p>;
}

function TextField({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: "text" | "date" | "email" | "url" | "number";
}) {
  return (
    <label className="grid gap-2">
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className="min-h-11 w-full border border-[var(--line)] bg-white/60 px-3 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  onBlur,
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <Label>{label}</Label>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className="w-full border border-[var(--line)] bg-white/60 px-3 py-3 text-sm leading-7 text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
      />
    </label>
  );
}

function BilingualInput({
  label,
  value,
  onChange,
  zhPlaceholder,
  enPlaceholder,
}: {
  label: string;
  value: BilingualText;
  onChange: (value: BilingualText) => void;
  zhPlaceholder?: string;
  enPlaceholder?: string;
}) {
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  async function requestTranslation(force = false) {
    const zh = value.zh.trim();
    const en = value.en.trim();

    if (!zh || (!force && en)) {
      return;
    }

    setTranslating(true);
    setTranslateError(null);

    try {
      const response = await fetch("/api/admin/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: zh,
          label,
        }),
      });
      const payload = (await response.json()) as { translation?: string; error?: string };

      if (!response.ok || !payload.translation) {
        throw new Error(payload.error ?? "英文翻译失败。");
      }

      onChange({
        zh: value.zh,
        en: payload.translation,
      });
    } catch (translationError) {
      setTranslateError(translationError instanceof Error ? translationError.message : "英文翻译失败。");
    } finally {
      setTranslating(false);
    }
  }

  return (
    <div className="grid gap-3 border border-[var(--line)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between gap-4">
        <Label>{label}</Label>
        <button
          type="button"
          onClick={() => requestTranslation(true)}
          disabled={translating || !value.zh.trim()}
          className="text-xs tracking-[0.14em] text-[var(--accent)] transition-colors hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {translating ? "翻译中..." : "根据中文生成英文"}
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <TextField
          label="中文"
          value={value.zh}
          onChange={(zh) => onChange({ ...value, zh })}
          onBlur={() => void requestTranslation(false)}
          placeholder={zhPlaceholder}
        />
        <TextField
          label="英文"
          value={value.en}
          onChange={(en) => onChange({ ...value, en })}
          placeholder={enPlaceholder}
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
}: {
  label: string;
  value: BilingualText;
  onChange: (value: BilingualText) => void;
  rows?: number;
}) {
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  async function requestTranslation(force = false) {
    const zh = value.zh.trim();
    const en = value.en.trim();

    if (!zh || (!force && en)) {
      return;
    }

    setTranslating(true);
    setTranslateError(null);

    try {
      const response = await fetch("/api/admin/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: zh,
          label,
        }),
      });
      const payload = (await response.json()) as { translation?: string; error?: string };

      if (!response.ok || !payload.translation) {
        throw new Error(payload.error ?? "英文翻译失败。");
      }

      onChange({
        zh: value.zh,
        en: payload.translation,
      });
    } catch (translationError) {
      setTranslateError(translationError instanceof Error ? translationError.message : "英文翻译失败。");
    } finally {
      setTranslating(false);
    }
  }

  return (
    <div className="grid gap-3 border border-[var(--line)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between gap-4">
        <Label>{label}</Label>
        <button
          type="button"
          onClick={() => requestTranslation(true)}
          disabled={translating || !value.zh.trim()}
          className="text-xs tracking-[0.14em] text-[var(--accent)] transition-colors hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {translating ? "翻译中..." : "根据中文生成英文"}
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <TextAreaField
          label="中文"
          rows={rows}
          value={value.zh}
          onChange={(zh) => onChange({ ...value, zh })}
          onBlur={() => void requestTranslation(false)}
        />
        <TextAreaField
          label="英文"
          rows={rows}
          value={value.en}
          onChange={(en) => onChange({ ...value, en })}
        />
      </div>
      {translateError ? <p className="text-sm leading-7 text-[#8e4e3b]">{translateError}</p> : null}
    </div>
  );
}

function PageHeroFields({
  value,
  onChange,
  titleLabel = "页面标题",
}: {
  value: { eyebrow: BilingualText; title: BilingualText; description: BilingualText; aside?: BilingualText };
  onChange: (value: { eyebrow: BilingualText; title: BilingualText; description: BilingualText; aside?: BilingualText }) => void;
  titleLabel?: string;
}) {
  return (
    <div className="grid gap-4">
      <BilingualInput
        label="页眉标签"
        value={value.eyebrow}
        onChange={(next) => onChange({ ...value, eyebrow: next })}
      />
      <BilingualInput
        label={titleLabel}
        value={value.title}
        onChange={(next) => onChange({ ...value, title: next })}
      />
      <BilingualTextarea
        label="页面说明"
        rows={4}
        value={value.description}
        onChange={(next) => onChange({ ...value, description: next })}
      />
      {"aside" in value ? (
        <BilingualTextarea
          label="右侧辅助说明"
          rows={4}
          value={value.aside ?? emptyBilingual()}
          onChange={(next) => onChange({ ...value, aside: next })}
        />
      ) : null}
    </div>
  );
}

function SwitchField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-4 border border-[var(--line)] bg-[var(--surface)] px-4">
      <span className="text-sm text-[var(--ink)]">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-[var(--ink)]"
      />
    </label>
  );
}

function RelationChecklist({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: Array<{ value: string; title: string; note?: string }>;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="space-y-3 border border-[var(--line)] bg-[var(--surface)] p-4">
      <Label>{label}</Label>
      <div className="grid gap-3 md:grid-cols-2">
        {options.map((option) => {
          const active = selected.includes(option.value);

          return (
            <label
              key={option.value}
              className={`grid cursor-pointer gap-1 border px-4 py-3 transition-colors ${
                active
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
                  checked={active}
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

function ListManager({
  label,
  items,
  selectedIndex,
  onSelect,
  onAdd,
  onRemove,
  onMove,
  renderLabel,
}: {
  label: string;
  items: Array<{ slug?: string }>;
  selectedIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onMove: (from: number, to: number) => void;
  renderLabel: (index: number) => string;
}) {
  return (
    <div className="space-y-4 border border-[var(--line)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between gap-4">
        <Label>{label}</Label>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex min-h-10 items-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)]"
        >
          新增
        </button>
      </div>
      <div className="grid gap-2">
        {items.length ? (
          items.map((item, index) => (
            <div
              key={item.slug ?? `item-${index}`}
              className={`flex items-center justify-between gap-3 border px-3 py-3 ${
                index === selectedIndex
                  ? "border-[var(--line-strong)] bg-[var(--surface-strong)]"
                  : "border-[var(--line)] bg-white/50"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(index)}
                className="min-w-0 flex-1 text-left text-sm leading-6 text-[var(--ink)]"
              >
                {renderLabel(index)}
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onMove(index, Math.max(0, index - 1))}
                  disabled={index === 0}
                  className="text-xs tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  上移
                </button>
                <button
                  type="button"
                  onClick={() => onMove(index, Math.min(items.length - 1, index + 1))}
                  disabled={index === items.length - 1}
                  className="text-xs tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  下移
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="text-xs tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[#8e4e3b]"
                >
                  删除
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm leading-7 text-[var(--muted)]">当前分区还没有内容，点击上方“新增”开始添加。</p>
        )}
      </div>
    </div>
  );
}

function SectionMenu({
  items,
}: {
  items: Array<{ id: string; label: string }>;
}) {
  return (
    <div className="sticky top-4 z-10 flex flex-wrap gap-2 border border-[var(--line)] bg-[var(--surface)]/95 p-3 backdrop-blur">
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className="inline-flex min-h-9 items-center border border-[var(--line)] px-3 text-xs tracking-[0.12em] text-[var(--muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}

function EditorSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 space-y-4 border border-[var(--line)] bg-[var(--surface)] p-5 md:p-6"
    >
      <div className="space-y-1 border-b border-[var(--line)] pb-4">
        <Label>{title}</Label>
        {description ? <p className="text-sm leading-7 text-[var(--muted)]">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function WorkflowSteps({
  title,
  steps,
}: {
  title: string;
  steps: Array<{ label: string; description: string }>;
}) {
  return (
    <div className="space-y-4 border border-[var(--line)] bg-[var(--surface)] p-5">
      <Label>{title}</Label>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <div key={step.label} className="border border-[var(--line)] bg-white/40 p-4">
            <p className="text-[0.68rem] tracking-[0.18em] text-[var(--accent)]">{`步骤 ${index + 1}`}</p>
            <p className="mt-3 text-sm leading-7 text-[var(--ink)]">{step.label}</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HelperNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-[var(--line)] bg-white/40 px-4 py-3 text-sm leading-7 text-[var(--muted)]">
      {children}
    </div>
  );
}

function PublicationStatusField({
  value,
  onChange,
}: {
  value: PublicationStatus;
  onChange: (value: PublicationStatus) => void;
}) {
  return (
    <label className="grid gap-2">
      <Label>发布状态</Label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as PublicationStatus)}
        className="min-h-11 border border-[var(--line)] bg-white/60 px-3 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
      >
        <option value="draft">草稿</option>
        <option value="published">已发布</option>
      </select>
    </label>
  );
}

const DEFAULT_GALLERY_SLOTS = 3;
const MAX_GALLERY_SLOTS = 8;

function normalizeGalleryImages(images: string[]) {
  const normalized = images.map((image) => image.trim());
  let lastFilledIndex = -1;

  normalized.forEach((image, index) => {
    if (image) {
      lastFilledIndex = index;
    }
  });

  if (lastFilledIndex < 0) {
    return [];
  }

  return normalized.slice(0, lastFilledIndex + 1);
}

function getGallerySlots(images: string[]) {
  const normalized = normalizeGalleryImages(images);
  const slotCount = Math.min(MAX_GALLERY_SLOTS, Math.max(DEFAULT_GALLERY_SLOTS, normalized.length));
  return Array.from({ length: slotCount }, (_, index) => normalized[index] ?? "");
}

function MediaGalleryEditor({
  label,
  folder,
  artworkSlug,
  canPersistMedia,
  images,
  onChange,
  onRequestAutoSave,
}: {
  label: string;
  folder: string;
  artworkSlug: string;
  canPersistMedia: boolean;
  images: string[];
  onChange: (images: string[]) => void;
  onRequestAutoSave?: () => void;
}) {
  const [visibleSlots, setVisibleSlots] = useState(() => getGallerySlots(images).length);

  useEffect(() => {
    setVisibleSlots((current) => Math.min(MAX_GALLERY_SLOTS, Math.max(current, getGallerySlots(images).length)));
  }, [images]);

  const slots = Array.from({ length: visibleSlots }, (_, index) => getGallerySlots(images)[index] ?? "");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Label>{label}</Label>
          <p className="text-sm leading-7 text-[var(--muted)]">
            细节图按前台展示顺序填写。每一项都和主图一样，可以直接粘贴图片路径，或上传电脑里的图片。
          </p>
        </div>
        {slots.length < MAX_GALLERY_SLOTS ? (
          <button
            type="button"
            onClick={() => setVisibleSlots((current) => Math.min(MAX_GALLERY_SLOTS, current + 1))}
            className="inline-flex min-h-10 items-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)]"
          >
            新增细节图位
          </button>
        ) : null}
      </div>
      <div className="grid gap-4">
        {slots.map((image, index) => (
          <div key={`gallery-image-${index}`} className="space-y-3 border border-[var(--line)] bg-white/40 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label>{`细节图 ${index + 1}`}</Label>
                <p className="text-xs leading-6 text-[var(--muted)]">
                  {index === 0 ? "建议先上传最重要的一张局部图。" : "如果这一项暂时不用，可以留空。"}
                </p>
              </div>
              {index >= DEFAULT_GALLERY_SLOTS ? (
                <button
                  type="button"
                  onClick={() => {
                    setVisibleSlots((current) => Math.max(DEFAULT_GALLERY_SLOTS, current - 1));
                    onChange(normalizeGalleryImages(removeArrayItem(slots, index)));
                  }}
                  className="text-xs tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[#8e4e3b]"
                >
                  删除这个图位
                </button>
              ) : null}
            </div>
            <AdminMediaField
              label={`细节图 ${index + 1}`}
              folder={folder}
              value={image}
              targetSize={{ width: 1200, height: 1500 }}
              onRequestAutoSave={onRequestAutoSave}
              saveTarget={
                canPersistMedia
                  ? {
                      section: "artworks",
                      slug: artworkSlug,
                      field: "gallery",
                      index,
                    }
                  : undefined
              }
              onChange={(next) => {
                const nextImages = [...slots];
                nextImages[index] = next;
                onChange(normalizeGalleryImages(nextImages));
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminVisualEditor({
  action,
  section,
  title,
  description,
  initialValue,
  content,
  autoCreate = false,
}: AdminVisualEditorProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [draft, setDraft] = useState<SiteContent[EditableSectionKey]>(() => cloneValue(initialValue));
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [autosaveState, setAutosaveState] = useState<"idle" | "restored" | "saved">("idle");
  const [queuedUploadSave, setQueuedUploadSave] = useState(0);
  const [submittedUploadSave, setSubmittedUploadSave] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setDraft(cloneValue(initialValue));
    setSelectedIndex(0);
    setHydrated(false);
    setAutosaveState("idle");
  }, [initialValue, section]);

  useEffect(() => {
    if (hydrated || autoCreate) {
      return;
    }
    const storageKey = `zhujinju-admin-draft-${section}`;

    try {
      const raw = window.localStorage.getItem(storageKey);

      if (raw) {
        const parsed = JSON.parse(raw) as { draft: SiteContent[EditableSectionKey]; selectedIndex?: number };
        setDraft(parsed.draft);
        setSelectedIndex(parsed.selectedIndex ?? 0);
        setAutosaveState("restored");
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    } finally {
      setHydrated(true);
    }
  }, [hydrated, section, autoCreate]);

  useEffect(() => {
    if (hydrated || !autoCreate) {
      return;
    }

    if (section === "artworks") {
      setDraft((current) => {
        const items = cloneValue(current as Artwork[]);
        items.push(createArtwork());
        return items as SiteContent[EditableSectionKey];
      });
      setSelectedIndex((initialValue as Artwork[]).length);
      setHydrated(true);
      return;
    }

    if (section === "exhibitions") {
      setDraft((current) => {
        const items = cloneValue(current as Exhibition[]);
        items.push(createExhibition());
        return items as SiteContent[EditableSectionKey];
      });
      setSelectedIndex((initialValue as Exhibition[]).length);
      setHydrated(true);
      return;
    }

    if (section === "articles") {
      setDraft((current) => {
        const items = cloneValue(current as Article[]);
        items.push(createArticle());
        return items as SiteContent[EditableSectionKey];
      });
      setSelectedIndex((initialValue as Article[]).length);
      setHydrated(true);
      return;
    }

    setHydrated(true);
  }, [autoCreate, hydrated, initialValue, section]);

  useEffect(() => {
    if (!hydrated || pending) {
      return;
    }

    const storageKey = `zhujinju-admin-draft-${section}`;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          draft,
          selectedIndex,
        }),
      );
      setAutosaveState("saved");
    }, 600);

    return () => window.clearTimeout(timer);
  }, [draft, hydrated, pending, section, selectedIndex]);

  useEffect(() => {
    if (!state.success) {
      return;
    }

    const storageKey = `zhujinju-admin-draft-${section}`;
    window.localStorage.removeItem(storageKey);
    setAutosaveState("idle");
  }, [section, state.success]);

  const serialized = useMemo(() => JSON.stringify(draft), [draft]);

  useEffect(() => {
    if (!hydrated || pending || !queuedUploadSave || queuedUploadSave === submittedUploadSave) {
      return;
    }

    setSubmittedUploadSave(queuedUploadSave);
    window.setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 0);
  }, [hydrated, pending, queuedUploadSave, serialized, submittedUploadSave]);

  function updateDraft(recipe: (value: SiteContent[EditableSectionKey]) => void) {
    setDraft((current) => {
      const next = cloneValue(current);
      recipe(next);
      return next;
    });
  }
  const articleOptions = content.articles.map((article) => ({
    value: article.slug,
    title: article.title.zh || article.slug,
    note: article.title.en || article.column.zh,
  }));
  const exhibitionOptions = content.exhibitions.map((exhibition) => ({
    value: exhibition.slug,
    title: exhibition.title.zh || exhibition.slug,
    note: exhibition.title.en || exhibition.period.zh,
  }));
  const artworkOptions = content.artworks.map((artwork) => ({
    value: artwork.slug,
    title: artwork.title.zh || artwork.slug,
    note: artwork.title.en || artwork.period.zh,
  }));

  function resetBrowserDraft() {
    const storageKey = `zhujinju-admin-draft-${section}`;
    window.localStorage.removeItem(storageKey);
    setDraft(cloneValue(initialValue));
    setSelectedIndex(0);
    setAutosaveState("idle");
  }

  function queueAutoSaveAfterUpload() {
    setQueuedUploadSave(Date.now());
  }

  function getPreviewHref() {
    if (section === "artworks") {
      const item = (draft as Artwork[])[selectedIndex];
      if (!item?.slug) return null;
      return item.publicationStatus === "draft"
        ? `/collection/${item.slug}?preview=1`
        : `/collection/${item.slug}`;
    }

    if (section === "exhibitions") {
      const item = (draft as Exhibition[])[selectedIndex];
      if (!item?.slug) return null;
      return item.publicationStatus === "draft"
        ? `/exhibitions/${item.slug}?preview=1`
        : `/exhibitions/${item.slug}`;
    }

    if (section === "articles") {
      const item = (draft as Article[])[selectedIndex];
      if (!item?.slug) return null;
      return item.publicationStatus === "draft"
        ? `/journal/${item.slug}?preview=1`
        : `/journal/${item.slug}`;
    }

    return null;
  }

  const previewHref = getPreviewHref();

  const renderSection = () => {
    if (section === "siteConfig") {
      const value = draft as SiteConfigContent;

      return (
        <div className="grid gap-6">
          <BilingualInput
            label="网站名称"
            value={value.siteName}
            onChange={(next) => updateDraft((item) => ((item as SiteConfigContent).siteName = next))}
          />
          <BilingualInput
            label="浏览器标题"
            value={value.title}
            onChange={(next) => updateDraft((item) => ((item as SiteConfigContent).title = next))}
          />
          <BilingualTextarea
            label="站点描述"
            rows={4}
            value={value.description}
            onChange={(next) => updateDraft((item) => ((item as SiteConfigContent).description = next))}
          />
          <div className="grid gap-4 md:grid-cols-3">
            <TextField
              label="主域名"
              value={value.defaultDomain}
              onChange={(next) => updateDraft((item) => ((item as SiteConfigContent).defaultDomain = next))}
            />
            <TextField
              label="协议"
              value={value.protocol}
              onChange={(next) =>
                updateDraft((item) => ((item as SiteConfigContent).protocol = next as "http" | "https"))
              }
            />
            <TextField
              label="地区代码"
              value={value.locale}
              onChange={(next) => updateDraft((item) => ((item as SiteConfigContent).locale = next))}
            />
          </div>
          <AdminMediaField
            label="社交分享图"
            folder="site"
            value={value.ogImagePath}
            onChange={(next) => updateDraft((item) => ((item as SiteConfigContent).ogImagePath = next))}
            onRequestAutoSave={queueAutoSaveAfterUpload}
            note="可上传用于 Open Graph / 社交分享的图片，也可以保留现有生成图。"
            previewRatio="landscape"
            targetSize={{ width: 1200, height: 630 }}
            recommendedUse="分享链接时的预览图"
            recommendedSize="1200 x 630 像素，横图"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="联系邮箱"
              type="email"
              value={value.contact.email}
              onChange={(next) =>
                updateDraft((item) => ((item as SiteConfigContent).contact.email = next))
              }
            />
            <TextField
              label="PDF 请求邮箱"
              type="email"
              value={value.contact.pdfRequest}
              onChange={(next) =>
                updateDraft((item) => ((item as SiteConfigContent).contact.pdfRequest = next))
              }
            />
            <TextField
              label="电话"
              value={value.contact.phone}
              onChange={(next) =>
                updateDraft((item) => ((item as SiteConfigContent).contact.phone = next))
              }
            />
            <TextField
              label="WhatsApp"
              value={value.contact.whatsapp}
              onChange={(next) =>
                updateDraft((item) => ((item as SiteConfigContent).contact.whatsapp = next))
              }
            />
            <TextField
              label="微信"
              value={value.contact.wechat}
              onChange={(next) =>
                updateDraft((item) => ((item as SiteConfigContent).contact.wechat = next))
              }
            />
            <TextField
              label="Instagram"
              value={value.contact.instagram}
              onChange={(next) =>
                updateDraft((item) => ((item as SiteConfigContent).contact.instagram = next))
              }
            />
          </div>
          <BilingualInput
            label="地址 / 会面地点"
            value={value.contact.address}
            onChange={(next) =>
              updateDraft((item) => ((item as SiteConfigContent).contact.address = next))
            }
          />
          <BilingualTextarea
            label="咨询回复时间"
            rows={3}
            value={value.contact.replyWindow}
            onChange={(next) =>
              updateDraft((item) => ((item as SiteConfigContent).contact.replyWindow = next))
            }
          />
          <BilingualTextarea
            label="合作说明"
            rows={3}
            value={value.contact.collaborationNote}
            onChange={(next) =>
              updateDraft((item) => ((item as SiteConfigContent).contact.collaborationNote = next))
            }
          />
        </div>
      );
    }

    if (section === "pageCopy") {
      const value = draft as PageCopyContent;

      return (
        <div className="grid gap-6">
          <div className="border border-[var(--line)] bg-[var(--surface)] p-5">
            <p className="text-sm leading-7 text-[var(--muted)]">
              推荐先修改这个分区。这里按网站前台的阅读顺序排列页面，并尽量把每一页会看到的固定文案都收在同一个地方。一般只改中文也可以，英文可以后补。
            </p>
          </div>

          <SectionMenu
            items={[
              { id: "page-site-chrome", label: "通用信息" },
              { id: "page-home", label: "首页" },
              { id: "page-about", label: "关于页" },
              { id: "page-contact", label: "联系页" },
              { id: "page-collection", label: "藏品列表页" },
              { id: "page-artwork-detail", label: "藏品详情页" },
              { id: "page-exhibitions", label: "展览页" },
              { id: "page-exhibition-detail", label: "展览详情页" },
              { id: "page-journal", label: "文章页" },
              { id: "page-article-detail", label: "文章详情页" },
            ]}
          />

          <EditorSection
            id="page-site-chrome"
            title="通用信息"
            description="这里放页脚和联系表单这类会在多个页面重复出现的固定文案。"
          >
            <div className="grid gap-6">
              <div className="space-y-4 border border-[var(--line)] bg-white/40 p-4">
                <Label>页脚</Label>
                <BilingualTextarea
                  label="页脚品牌简介"
                  rows={4}
                  value={value.siteChrome.footer.intro}
                  onChange={(next) =>
                    updateDraft((item) => {
                      (item as PageCopyContent).siteChrome.footer.intro = next;
                    })
                  }
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <BilingualInput
                    label="预约说明"
                    value={value.siteChrome.footer.appointment}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).siteChrome.footer.appointment = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="版权标签"
                    value={value.siteChrome.footer.copyrightLabel}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).siteChrome.footer.copyrightLabel = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="联络标题"
                    value={value.siteChrome.footer.contactHeading}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).siteChrome.footer.contactHeading = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="信息与请求标题"
                    value={value.siteChrome.footer.informationHeading}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).siteChrome.footer.informationHeading = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="藏品链接文字"
                    value={value.siteChrome.footer.collectionLink}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).siteChrome.footer.collectionLink = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="展览链接文字"
                    value={value.siteChrome.footer.exhibitionsLink}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).siteChrome.footer.exhibitionsLink = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="文章链接文字"
                    value={value.siteChrome.footer.journalLink}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).siteChrome.footer.journalLink = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="PDF 请求标签"
                    value={value.siteChrome.footer.pdfRequestLabel}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).siteChrome.footer.pdfRequestLabel = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="Instagram 标签"
                    value={value.siteChrome.footer.instagramLabel}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).siteChrome.footer.instagramLabel = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="微信标签"
                    value={value.siteChrome.footer.wechatLabel}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).siteChrome.footer.wechatLabel = next;
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4 border border-[var(--line)] bg-white/40 p-4">
                <Label>联系表单</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <BilingualTextarea
                    label="默认提示"
                    rows={3}
                    value={value.siteChrome.contactForm.introIdle}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).siteChrome.contactForm.introIdle = next;
                      })
                    }
                  />
                  <BilingualTextarea
                    label="提交中提示"
                    rows={3}
                    value={value.siteChrome.contactForm.introSubmitting}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).siteChrome.contactForm.introSubmitting = next;
                      })
                    }
                  />
                  <BilingualTextarea
                    label="提交成功提示"
                    rows={3}
                    value={value.siteChrome.contactForm.introSuccess}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).siteChrome.contactForm.introSuccess = next;
                      })
                    }
                  />
                  <BilingualTextarea
                    label="提交失败提示"
                    rows={3}
                    value={value.siteChrome.contactForm.introError}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).siteChrome.contactForm.introError = next;
                      })
                    }
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <BilingualInput
                    label="姓名字段"
                    value={value.siteChrome.contactForm.nameLabel}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).siteChrome.contactForm.nameLabel = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="邮箱字段"
                    value={value.siteChrome.contactForm.emailLabel}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).siteChrome.contactForm.emailLabel = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="机构字段"
                    value={value.siteChrome.contactForm.organizationLabel}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).siteChrome.contactForm.organizationLabel = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="身份字段"
                    value={value.siteChrome.contactForm.roleLabel}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).siteChrome.contactForm.roleLabel = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="意向作品字段"
                    value={value.siteChrome.contactForm.artworkLabel}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).siteChrome.contactForm.artworkLabel = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="留言字段"
                    value={value.siteChrome.contactForm.messageLabel}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).siteChrome.contactForm.messageLabel = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="提交按钮"
                    value={value.siteChrome.contactForm.submitLabel}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).siteChrome.contactForm.submitLabel = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="提交中按钮"
                    value={value.siteChrome.contactForm.submittingLabel}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).siteChrome.contactForm.submittingLabel = next;
                      })
                    }
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <Label>身份选项</Label>
                    <button
                      type="button"
                      onClick={() =>
                        updateDraft((item) =>
                          (item as PageCopyContent).siteChrome.contactForm.roleOptions.push(emptyBilingual()),
                        )
                      }
                      className="inline-flex min-h-10 items-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)]"
                    >
                      新增身份
                    </button>
                  </div>
                  <div className="grid gap-4">
                    {value.siteChrome.contactForm.roleOptions.map((option, index) => (
                      <div key={`contact-role-${index}`} className="space-y-3 border border-[var(--line)] bg-[var(--surface)] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <Label>{`身份 ${index + 1}`}</Label>
                          <button
                            type="button"
                            onClick={() =>
                              updateDraft((item) => {
                                (item as PageCopyContent).siteChrome.contactForm.roleOptions = removeArrayItem(
                                  (item as PageCopyContent).siteChrome.contactForm.roleOptions,
                                  index,
                                );
                              })
                            }
                            className="text-xs tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[#8e4e3b]"
                          >
                            删除
                          </button>
                        </div>
                        <BilingualInput
                          label={`身份 ${index + 1}`}
                          value={option}
                          onChange={(next) =>
                            updateDraft((item) => {
                              (item as PageCopyContent).siteChrome.contactForm.roleOptions = updateArrayItem(
                                (item as PageCopyContent).siteChrome.contactForm.roleOptions,
                                index,
                                (target) => {
                                  target.zh = next.zh;
                                  target.en = next.en;
                                },
                              );
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </EditorSection>

          <EditorSection
            id="page-home"
            title="首页"
            description="按首页从上到下的顺序编辑首屏、专题、精选作品、收藏方向、专业信任和联系区文案。"
          >
            <div className="grid gap-6">
              <div className="space-y-4 border border-[var(--line)] bg-white/40 p-4">
                <Label>首屏</Label>
                <BilingualInput
                  label="首屏眉题"
                  value={value.home.heroEyebrow}
                  onChange={(next) =>
                    updateDraft((item) => {
                      (item as PageCopyContent).home.heroEyebrow = next;
                    })
                  }
                />
                <BilingualInput
                  label="首屏主标题"
                  value={value.home.heroTitle}
                  onChange={(next) =>
                    updateDraft((item) => {
                      (item as PageCopyContent).home.heroTitle = next;
                    })
                  }
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <BilingualInput
                    label="首屏主按钮"
                    value={value.home.heroPrimaryAction}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).home.heroPrimaryAction = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="首屏次按钮"
                    value={value.home.heroSecondaryAction}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).home.heroSecondaryAction = next;
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4 border border-[var(--line)] bg-white/40 p-4">
                <Label>首页第二屏 / 专题模块</Label>
                <BilingualInput
                  label="当前专题标签"
                  value={value.home.focusCurrent.eyebrow}
                  onChange={(next) =>
                    updateDraft((item) => {
                      (item as PageCopyContent).home.focusCurrent.eyebrow = next;
                    })
                  }
                />
                <BilingualTextarea
                  label="当前专题说明"
                  rows={3}
                  value={value.home.focusCurrent.description}
                  onChange={(next) =>
                    updateDraft((item) => {
                      (item as PageCopyContent).home.focusCurrent.description = next;
                    })
                  }
                />
                <BilingualInput
                  label="近期展览标签"
                  value={value.home.focusRecent.eyebrow}
                  onChange={(next) =>
                    updateDraft((item) => {
                      (item as PageCopyContent).home.focusRecent.eyebrow = next;
                    })
                  }
                />
                <BilingualTextarea
                  label="近期展览说明"
                  rows={3}
                  value={value.home.focusRecent.description}
                  onChange={(next) =>
                    updateDraft((item) => {
                      (item as PageCopyContent).home.focusRecent.description = next;
                    })
                  }
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <BilingualInput
                    label="专题统计：重点作品单位"
                    value={value.home.focusSummaryLine.highlightUnit}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).home.focusSummaryLine.highlightUnit = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="专题统计：图录页数单位"
                    value={value.home.focusSummaryLine.catalogueUnit}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).home.focusSummaryLine.catalogueUnit = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="专题详情按钮"
                    value={value.home.focusAction}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).home.focusAction = next;
                      })
                    }
                  />
                </div>
              </div>

              {[
                { key: "selectedWorks", title: "精选作品模块" },
                { key: "collectingDirections", title: "收藏方向模块" },
                { key: "operationalFacts", title: "专业信任模块" },
                { key: "contact", title: "首页联系模块" },
              ].map((sectionMeta) => {
                const sectionValue = value.home[sectionMeta.key as keyof PageCopyContent["home"]] as {
                  eyebrow: BilingualText;
                  title: BilingualText;
                  description: BilingualText;
                };

                return (
                  <div key={sectionMeta.key} className="space-y-4 border border-[var(--line)] bg-white/40 p-4">
                    <Label>{sectionMeta.title}</Label>
                    <BilingualInput
                      label="模块标签"
                      value={sectionValue.eyebrow}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (
                            (item as PageCopyContent).home[
                              sectionMeta.key as keyof PageCopyContent["home"]
                            ] as { eyebrow: BilingualText }
                          ).eyebrow = next;
                        })
                      }
                    />
                    <BilingualInput
                      label="模块标题"
                      value={sectionValue.title}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (
                            (item as PageCopyContent).home[
                              sectionMeta.key as keyof PageCopyContent["home"]
                            ] as { title: BilingualText }
                          ).title = next;
                        })
                      }
                    />
                    <BilingualTextarea
                      label="模块说明"
                      rows={3}
                      value={sectionValue.description}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (
                            (item as PageCopyContent).home[
                              sectionMeta.key as keyof PageCopyContent["home"]
                            ] as { description: BilingualText }
                          ).description = next;
                        })
                      }
                    />
                  </div>
                );
              })}

              <div className="space-y-4 border border-[var(--line)] bg-white/40 p-4">
                <Label>首页联系区按钮</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <BilingualInput
                    label="联系页面按钮"
                    value={value.home.contactPrimaryAction}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).home.contactPrimaryAction = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="文章页面按钮"
                    value={value.home.contactSecondaryAction}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).home.contactSecondaryAction = next;
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </EditorSection>

          <EditorSection
            id="page-about"
            title="关于页"
            description="按关于页从上到下编辑页头与正文。"
          >
            <div className="grid gap-6">
              <div className="space-y-4 border border-[var(--line)] bg-white/40 p-4">
                <Label>页头</Label>
                <PageHeroFields
                  value={value.about.hero}
                  onChange={(next) =>
                    updateDraft((item) => {
                      (item as PageCopyContent).about.hero = next;
                    })
                  }
                />
              </div>
              <div className="space-y-4 border border-[var(--line)] bg-white/40 p-4">
                <Label>正文第一模块</Label>
                <BilingualInput
                  label="模块标签"
                  value={value.about.position.eyebrow}
                  onChange={(next) =>
                    updateDraft((item) => {
                      (item as PageCopyContent).about.position.eyebrow = next;
                    })
                  }
                />
                <BilingualInput
                  label="模块标题"
                  value={value.about.position.title}
                  onChange={(next) =>
                    updateDraft((item) => {
                      (item as PageCopyContent).about.position.title = next;
                    })
                  }
                />
                <BilingualTextarea
                  label="第二段文字"
                  rows={4}
                  value={value.about.position.paragraphTwo}
                  onChange={(next) =>
                    updateDraft((item) => {
                      (item as PageCopyContent).about.position.paragraphTwo = next;
                    })
                  }
                />
                <BilingualTextarea
                  label="第三段文字"
                  rows={4}
                  value={value.about.position.paragraphThree}
                  onChange={(next) =>
                    updateDraft((item) => {
                      (item as PageCopyContent).about.position.paragraphThree = next;
                    })
                  }
                />
              </div>
            </div>
          </EditorSection>

          <EditorSection
            id="page-contact"
            title="联系页"
            description="按联系页从上到下编辑页头和补充说明。"
          >
            <div className="grid gap-6">
              <div className="space-y-4 border border-[var(--line)] bg-white/40 p-4">
                <Label>页头</Label>
                <PageHeroFields
                  value={value.contact.hero}
                  onChange={(next) =>
                    updateDraft((item) => {
                      (item as PageCopyContent).contact.hero = next;
                    })
                  }
                />
              </div>
              <div className="space-y-4 border border-[var(--line)] bg-white/40 p-4">
                <Label>正文补充说明</Label>
                <BilingualTextarea
                  label="预约说明"
                  rows={3}
                  value={value.contact.appointmentLine}
                  onChange={(next) =>
                    updateDraft((item) => {
                      (item as PageCopyContent).contact.appointmentLine = next;
                    })
                  }
                />
                <BilingualTextarea
                  label="合作说明补充"
                  rows={3}
                  value={value.contact.cooperationLine}
                  onChange={(next) =>
                    updateDraft((item) => {
                      (item as PageCopyContent).contact.cooperationLine = next;
                    })
                  }
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <BilingualInput
                    label="邮箱标签"
                    value={value.contact.infoLabels.email}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).contact.infoLabels.email = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="微信标签"
                    value={value.contact.infoLabels.wechat}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).contact.infoLabels.wechat = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="电话 / WhatsApp 标签"
                    value={value.contact.infoLabels.phoneWhatsapp}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).contact.infoLabels.phoneWhatsapp = next;
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </EditorSection>

          <EditorSection
            id="page-collection"
            title="藏品列表页"
            description="按藏品列表页从上到下编辑页头和空状态提示。"
          >
            <div className="grid gap-6">
              <div className="space-y-4 border border-[var(--line)] bg-white/40 p-4">
                <Label>页头</Label>
                <PageHeroFields
                  value={value.collection.hero}
                  onChange={(next) =>
                    updateDraft((item) => {
                      (item as PageCopyContent).collection.hero = next;
                    })
                  }
                />
              </div>
              <div className="space-y-4 border border-[var(--line)] bg-white/40 p-4">
                <Label>空结果提示</Label>
                <BilingualTextarea
                  label="筛选无结果时显示的说明"
                  rows={3}
                  value={value.collection.emptyState}
                  onChange={(next) =>
                    updateDraft((item) => {
                      (item as PageCopyContent).collection.emptyState = next;
                    })
                  }
                />
              </div>
              <div className="space-y-4 border border-[var(--line)] bg-white/40 p-4">
                <Label>筛选栏文字</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <BilingualInput
                    label="品类"
                    value={value.collection.filters.category}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).collection.filters.category = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="地区"
                    value={value.collection.filters.region}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).collection.filters.region = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="年代"
                    value={value.collection.filters.period}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).collection.filters.period = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="材质"
                    value={value.collection.filters.material}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).collection.filters.material = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="操作分组标题"
                    value={value.collection.filters.actions}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).collection.filters.actions = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="筛选按钮"
                    value={value.collection.filters.apply}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).collection.filters.apply = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="重置按钮"
                    value={value.collection.filters.reset}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).collection.filters.reset = next;
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </EditorSection>

          <EditorSection
            id="page-artwork-detail"
            title="藏品详情页"
            description="按藏品详情页从上到下编辑面包屑、按钮、字段标题与正文分区标题。"
          >
            <div className="grid gap-6">
              <div className="space-y-4 border border-[var(--line)] bg-white/40 p-4">
                <Label>页面状态与顶部信息</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <BilingualInput
                    label="未找到标题"
                    value={value.artworkDetail.errorTitle}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).artworkDetail.errorTitle = next;
                      })
                    }
                  />
                  <BilingualTextarea
                    label="未找到说明"
                    rows={3}
                    value={value.artworkDetail.errorDescription}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).artworkDetail.errorDescription = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="面包屑返回文字"
                    value={value.artworkDetail.breadcrumb}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).artworkDetail.breadcrumb = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="询洽按钮"
                    value={value.artworkDetail.inquireAction}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).artworkDetail.inquireAction = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="返回列表按钮"
                    value={value.artworkDetail.backAction}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).artworkDetail.backAction = next;
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-4 border border-[var(--line)] bg-white/40 p-4">
                <Label>字段标题</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <BilingualInput
                    label="年代"
                    value={value.artworkDetail.fieldLabels.period}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).artworkDetail.fieldLabels.period = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="地区 / 产地"
                    value={value.artworkDetail.fieldLabels.regionOrigin}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).artworkDetail.fieldLabels.regionOrigin = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="材质"
                    value={value.artworkDetail.fieldLabels.material}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).artworkDetail.fieldLabels.material = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="尺寸"
                    value={value.artworkDetail.fieldLabels.dimensions}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).artworkDetail.fieldLabels.dimensions = next;
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-4 border border-[var(--line)] bg-white/40 p-4">
                <Label>正文分区标题</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <BilingualInput
                    label="学术说明"
                    value={value.artworkDetail.scholarlyNote}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).artworkDetail.scholarlyNote = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="观看描述"
                    value={value.artworkDetail.viewingNote}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).artworkDetail.viewingNote = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="比较判断"
                    value={value.artworkDetail.comparisonNote}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).artworkDetail.comparisonNote = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="来源"
                    value={value.artworkDetail.provenance}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).artworkDetail.provenance = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="展览"
                    value={value.artworkDetail.exhibitions}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).artworkDetail.exhibitions = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="出版"
                    value={value.artworkDetail.publications}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).artworkDetail.publications = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="相关展览"
                    value={value.artworkDetail.relatedExhibitions}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).artworkDetail.relatedExhibitions = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="相关文章"
                    value={value.artworkDetail.relatedArticles}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).artworkDetail.relatedArticles = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="相关推荐小标题"
                    value={value.artworkDetail.relatedWorks}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).artworkDetail.relatedWorks = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="相关推荐主标题"
                    value={value.artworkDetail.relatedWorksTitle}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).artworkDetail.relatedWorksTitle = next;
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </EditorSection>

          <EditorSection
            id="page-exhibitions"
            title="展览页"
            description="按展览页从上到下编辑页头与展览卡片固定标签。"
          >
            <div className="grid gap-6">
              <div className="space-y-4 border border-[var(--line)] bg-white/40 p-4">
                <Label>页头</Label>
                <PageHeroFields
                  value={value.exhibitions.hero}
                  onChange={(next) =>
                    updateDraft((item) => {
                      (item as PageCopyContent).exhibitions.hero = next;
                    })
                  }
                />
              </div>
              <div className="space-y-4 border border-[var(--line)] bg-white/40 p-4">
                <Label>展览卡片固定标签</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <BilingualInput
                    label="重点作品"
                    value={value.exhibitions.cardLabels.highlightWorks}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).exhibitions.cardLabels.highlightWorks = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="图录页数"
                    value={value.exhibitions.cardLabels.cataloguePages}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).exhibitions.cardLabels.cataloguePages = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="图录"
                    value={value.exhibitions.cardLabels.catalogueTitle}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).exhibitions.cardLabels.catalogueTitle = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="查看详情按钮"
                    value={value.exhibitions.cardLabels.viewAction}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).exhibitions.cardLabels.viewAction = next;
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </EditorSection>

          <EditorSection
            id="page-exhibition-detail"
            title="展览详情页"
            description="按展览详情页从上到下编辑返回按钮、统计语句和各分区标题。"
          >
            <div className="grid gap-6">
              <div className="space-y-4 border border-[var(--line)] bg-white/40 p-4">
                <Label>顶部与错误状态</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <BilingualInput
                    label="未找到标题"
                    value={value.exhibitionDetail.errorTitle}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).exhibitionDetail.errorTitle = next;
                      })
                    }
                  />
                  <BilingualTextarea
                    label="未找到说明"
                    rows={3}
                    value={value.exhibitionDetail.errorDescription}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).exhibitionDetail.errorDescription = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="返回按钮"
                    value={value.exhibitionDetail.backAction}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).exhibitionDetail.backAction = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="统计语句：重点作品单位"
                    value={value.exhibitionDetail.summaryLine.highlightUnit}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).exhibitionDetail.summaryLine.highlightUnit = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="统计语句：图录页数单位"
                    value={value.exhibitionDetail.summaryLine.catalogueUnit}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).exhibitionDetail.summaryLine.catalogueUnit = next;
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-4 border border-[var(--line)] bg-white/40 p-4">
                <Label>正文分区标题</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <BilingualInput
                    label="图录说明"
                    value={value.exhibitionDetail.catalogueNote}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).exhibitionDetail.catalogueNote = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="相关文字"
                    value={value.exhibitionDetail.relatedWriting}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).exhibitionDetail.relatedWriting = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="重点作品小标题"
                    value={value.exhibitionDetail.highlightedWorks}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).exhibitionDetail.highlightedWorks = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="重点作品主标题"
                    value={value.exhibitionDetail.highlightedWorksTitle}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).exhibitionDetail.highlightedWorksTitle = next;
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </EditorSection>

          <EditorSection
            id="page-journal"
            title="文章页"
            description="按文章列表页从上到下编辑页头和按钮。"
          >
            <div className="grid gap-6">
              <div className="space-y-4 border border-[var(--line)] bg-white/40 p-4">
                <Label>页头</Label>
                <PageHeroFields
                  value={value.journal.hero}
                  onChange={(next) =>
                    updateDraft((item) => {
                      (item as PageCopyContent).journal.hero = next;
                    })
                  }
                />
              </div>
              <div className="space-y-4 border border-[var(--line)] bg-white/40 p-4">
                <Label>列表动作按钮</Label>
                <BilingualInput
                  label="阅读全文按钮"
                  value={value.journal.readAction}
                  onChange={(next) =>
                    updateDraft((item) => {
                      (item as PageCopyContent).journal.readAction = next;
                    })
                  }
                />
              </div>
            </div>
          </EditorSection>

          <EditorSection
            id="page-article-detail"
            title="文章详情页"
            description="按文章详情页从上到下编辑返回按钮、错误提示和底部关联模块标题。"
          >
            <div className="grid gap-6">
              <div className="space-y-4 border border-[var(--line)] bg-white/40 p-4">
                <Label>顶部与错误状态</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <BilingualInput
                    label="未找到标题"
                    value={value.articleDetail.errorTitle}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).articleDetail.errorTitle = next;
                      })
                    }
                  />
                  <BilingualTextarea
                    label="未找到说明"
                    rows={3}
                    value={value.articleDetail.errorDescription}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).articleDetail.errorDescription = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="返回按钮"
                    value={value.articleDetail.backAction}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).articleDetail.backAction = next;
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-4 border border-[var(--line)] bg-white/40 p-4">
                <Label>底部关联模块标题</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <BilingualInput
                    label="相关展览"
                    value={value.articleDetail.relatedExhibitions}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).articleDetail.relatedExhibitions = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="相关藏品"
                    value={value.articleDetail.relatedWorks}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as PageCopyContent).articleDetail.relatedWorks = next;
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </EditorSection>
        </div>
      );
    }

    if (section === "brandIntro") {
      const value = draft as BrandIntroContent;

      return (
        <div className="grid gap-6">
          <AdminMediaField
            label="首页主图"
            folder="site"
            value={value.heroImage ?? ""}
            onChange={(next) => updateDraft((item) => ((item as BrandIntroContent).heroImage = next))}
            onRequestAutoSave={queueAutoSaveAfterUpload}
            note="用于首页首屏主图。上传后保存即可更新。"
            previewRatio="landscape"
            targetSize={{ width: 1600, height: 1400 }}
            recommendedUse="首页首屏主视觉"
            recommendedSize="1600 x 1400 像素以上，接近 1.15:1"
          />
          <BilingualInput
            label="首页主图说明"
            value={value.heroAlt ?? emptyBilingual()}
            onChange={(next) => updateDraft((item) => ((item as BrandIntroContent).heroAlt = next))}
          />
          <BilingualTextarea
            label="首页核心说明"
            rows={4}
            value={value.statement}
            onChange={(next) => updateDraft((item) => ((item as BrandIntroContent).statement = next))}
          />
          <BilingualTextarea
            label="品牌方法说明"
            rows={5}
            value={value.about}
            onChange={(next) => updateDraft((item) => ((item as BrandIntroContent).about = next))}
          />
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Label>方法论条目</Label>
              <button
                type="button"
                onClick={() =>
                  updateDraft((item) =>
                    (item as BrandIntroContent).methodology.push(emptyBilingual()),
                  )
                }
                className="inline-flex min-h-10 items-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)]"
              >
                新增条目
              </button>
            </div>
            <div className="grid gap-4">
              {value.methodology.map((entry, index) => (
                <div key={`methodology-${index}`} className="space-y-3 border border-[var(--line)] bg-[var(--surface)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Label>{`条目 ${index + 1}`}</Label>
                    <button
                      type="button"
                      onClick={() =>
                        updateDraft((item) => {
                          (item as BrandIntroContent).methodology = removeArrayItem(
                            (item as BrandIntroContent).methodology,
                            index,
                          );
                        })
                      }
                      className="text-xs tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[#8e4e3b]"
                    >
                      删除
                    </button>
                  </div>
                  <BilingualTextarea
                    label={`方法论 ${index + 1}`}
                    rows={3}
                    value={entry}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as BrandIntroContent).methodology = updateArrayItem(
                          (item as BrandIntroContent).methodology,
                          index,
                          (target) => {
                            target.zh = next.zh;
                            target.en = next.en;
                          },
                        );
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (section === "collectingDirections") {
      const value = draft as CollectingDirection[];

      return (
        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-4">
            <Label>收藏方向</Label>
            <button
              type="button"
              onClick={() => updateDraft((item) => (item as CollectingDirection[]).push(createDirection()))}
              className="inline-flex min-h-10 items-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)]"
            >
              新增方向
            </button>
          </div>
          {value.map((direction, index) => (
            <div key={`direction-${index}`} className="space-y-4 border border-[var(--line)] bg-[var(--surface)] p-4">
              <div className="flex items-center justify-between gap-4">
                <Label>{`方向 ${index + 1}`}</Label>
                <button
                  type="button"
                  onClick={() =>
                    updateDraft((item) => {
                      const next = removeArrayItem(item as CollectingDirection[], index);
                      (item as CollectingDirection[]).splice(0, (item as CollectingDirection[]).length, ...next);
                    })
                  }
                  className="text-xs tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[#8e4e3b]"
                >
                  删除
                </button>
              </div>
              <BilingualInput
                label="方向名称"
                value={direction.name}
                onChange={(next) =>
                  updateDraft((item) => {
                    (item as CollectingDirection[])[index].name = next;
                  })
                }
              />
              <BilingualTextarea
                label="方向说明"
                rows={3}
                value={direction.description}
                onChange={(next) =>
                  updateDraft((item) => {
                    (item as CollectingDirection[])[index].description = next;
                  })
                }
              />
            </div>
          ))}
        </div>
      );
    }

    if (section === "operationalFacts") {
      const value = draft as OperationalFact[];

      return (
        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-4">
            <Label>专业积累信息</Label>
            <button
              type="button"
              onClick={() => updateDraft((item) => (item as OperationalFact[]).push(createOperationalFact()))}
              className="inline-flex min-h-10 items-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)]"
            >
              新增条目
            </button>
          </div>
          {value.map((fact, index) => (
            <div key={`fact-${index}`} className="space-y-4 border border-[var(--line)] bg-[var(--surface)] p-4">
              <div className="flex items-center justify-between gap-4">
                <Label>{`条目 ${index + 1}`}</Label>
                <button
                  type="button"
                  onClick={() =>
                    updateDraft((item) => {
                      const next = removeArrayItem(item as OperationalFact[], index);
                      (item as OperationalFact[]).splice(0, (item as OperationalFact[]).length, ...next);
                    })
                  }
                  className="text-xs tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[#8e4e3b]"
                >
                  删除
                </button>
              </div>
              <BilingualInput
                label="标题"
                value={fact.title}
                onChange={(next) =>
                  updateDraft((item) => {
                    (item as OperationalFact[])[index].title = next;
                  })
                }
              />
              <BilingualInput
                label="数值"
                value={fact.value}
                onChange={(next) =>
                  updateDraft((item) => {
                    (item as OperationalFact[])[index].value = next;
                  })
                }
              />
              <BilingualTextarea
                label="说明"
                rows={3}
                value={fact.description}
                onChange={(next) =>
                  updateDraft((item) => {
                    (item as OperationalFact[])[index].description = next;
                  })
                }
              />
            </div>
          ))}
        </div>
      );
    }

    if (section === "artworks") {
      const items = draft as Artwork[];
      const current = items[selectedIndex];

      return (
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-4">
            <WorkflowSteps
              title="藏品页编辑顺序"
              steps={[
                { label: "第 1 步：上传主图", description: "先上传主图和细节图。前台最先看到的就是这里。" },
                { label: "第 2 步：填写标题和基本信息", description: "接着填写标题、年代、地区、材质、尺寸。" },
                { label: "第 3 步：填写学术说明", description: "按前台顺序填写简述、观看描述、比较判断。" },
                { label: "第 4 步：补来源与记录", description: "再补来源、展览、出版。没有的可以先留空。" },
                { label: "第 5 步：补询洽和关联内容", description: "最后补询洽提示，并勾选相关展览和文章。" },
              ]}
            />
            <ListManager
              label="藏品列表"
              items={items}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
              onAdd={() => {
                updateDraft((item) => (item as Artwork[]).push(createArtwork()));
                setSelectedIndex(items.length);
              }}
              onRemove={(index) => {
                updateDraft((item) => {
                  const next = removeArrayItem(item as Artwork[], index);
                  (item as Artwork[]).splice(0, (item as Artwork[]).length, ...next);
                });
                setSelectedIndex((currentIndex) => Math.max(0, currentIndex - (currentIndex >= index ? 1 : 0)));
              }}
              onMove={(from, to) => {
                if (from === to) return;
                updateDraft((item) => {
                  const next = moveArrayItem(item as Artwork[], from, to);
                  (item as Artwork[]).splice(0, (item as Artwork[]).length, ...next);
                });
                setSelectedIndex(to);
              }}
              renderLabel={(index) =>
                `${items[index]?.publicationStatus === "draft" ? "草稿" : "已发布"} · ${
                  items[index]?.title.zh || items[index]?.slug || `藏品 ${index + 1}`
                }`
              }
            />
          </div>

          {current ? (
            <div className="grid gap-6">
              {(() => {
                const persistedArtworkSlugs = new Set(content.artworks.map((artwork) => artwork.slug));
                const canPersistArtworkMedia = persistedArtworkSlugs.has(current.slug);

                return (
                  <>
              <SectionMenu
                items={[
                  { id: "artwork-media", label: "第 1 步 上传主图" },
                  { id: "artwork-basic", label: "第 2 步 基本信息" },
                  { id: "artwork-description", label: "第 3 步 学术说明" },
                  { id: "artwork-records", label: "第 4 步 来源与记录" },
                  { id: "artwork-relations", label: "第 5 步 询洽与关联" },
                ]}
              />

              <EditorSection
                id="artwork-media"
                title="第 1 步：上传主图与细节图"
                description="这一块对应前台藏品详情页最上方的大图区域。先把图片传好，再继续往下填写文字。"
              >
                <div className="grid gap-4">
                  <HelperNote>这是前台页面最先出现的位置。先上传主图，前台列表页和详情页就会先有视觉内容。</HelperNote>
                  <AdminMediaField
                    label="藏品主图"
                    folder="artworks"
                    value={current.image}
                    previewRatio="portrait"
                    targetSize={{ width: 1200, height: 1500 }}
                    onRequestAutoSave={queueAutoSaveAfterUpload}
                    saveTarget={
                      canPersistArtworkMedia
                        ? {
                            section: "artworks",
                            slug: current.slug,
                            field: "image",
                          }
                        : undefined
                    }
                    recommendedUse="藏品列表与藏品详情主图"
                    recommendedSize="1200 x 1500 像素以上，竖图 4:5"
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as Artwork[])[selectedIndex].image = next;
                      })
                    }
                  />
                  <MediaGalleryEditor
                    label="细节图画廊"
                    folder="artworks"
                    artworkSlug={current.slug}
                    canPersistMedia={canPersistArtworkMedia}
                    images={current.gallery ?? []}
                    onRequestAutoSave={queueAutoSaveAfterUpload}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as Artwork[])[selectedIndex].gallery = next;
                      })
                    }
                  />
                  {!canPersistArtworkMedia ? (
                    <HelperNote>
                      这是一件刚新增、还未正式保存到网站的藏品。请先点击下方“保存当前分区”建立这件藏品，再继续上传主图和细节图。
                    </HelperNote>
                  ) : null}
                </div>
              </EditorSection>

              <EditorSection
                id="artwork-basic"
                title="第 2 步：标题与基本信息"
                description="这一块对应前台图片右侧和图片下方的基础信息。按页面阅读顺序依次填写即可。"
              >
                <div className="grid gap-4">
                  <HelperNote>最少先填 5 项：作品标题、年代、地区、材质、尺寸。这样前台列表和详情页就已经能正常显示。</HelperNote>
                  <div className="grid gap-4 md:grid-cols-3">
                    <TextField
                      label="URL 标识（slug）"
                      value={current.slug}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (item as Artwork[])[selectedIndex].slug = next;
                        })
                      }
                    />
                    <PublicationStatusField
                      value={current.publicationStatus ?? "published"}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (item as Artwork[])[selectedIndex].publicationStatus = next;
                        })
                      }
                    />
                    <label className="grid gap-2">
                      <Label>作品状态</Label>
                      <select
                        value={current.status}
                        onChange={(event) =>
                          updateDraft((item) => {
                            (item as Artwork[])[selectedIndex].status = event.target.value as Artwork["status"];
                          })
                        }
                        className="min-h-11 border border-[var(--line)] bg-white/60 px-3 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--line-strong)]"
                      >
                        <option value="inquiry">可洽询</option>
                        <option value="sold">已售</option>
                        <option value="reserved">暂留</option>
                      </select>
                    </label>
                  </div>
                  <SwitchField
                    label="设为首页精选作品"
                    checked={Boolean(current.featured)}
                    onChange={(checked) =>
                      updateDraft((item) => {
                        (item as Artwork[])[selectedIndex].featured = checked;
                      })
                    }
                  />
                  <BilingualInput
                    label="作品标题"
                    value={current.title}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as Artwork[])[selectedIndex].title = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="副标题"
                    value={current.subtitle}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as Artwork[])[selectedIndex].subtitle = next;
                      })
                    }
                  />
                  <div className="grid gap-4 md:grid-cols-3">
                    <BilingualInput
                      label="年代"
                      value={current.period}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (item as Artwork[])[selectedIndex].period = next;
                        })
                      }
                    />
                    <BilingualInput
                      label="地区"
                      value={current.region}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (item as Artwork[])[selectedIndex].region = next;
                        })
                      }
                    />
                    <BilingualInput
                      label="产地"
                      value={current.origin}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (item as Artwork[])[selectedIndex].origin = next;
                        })
                      }
                    />
                    <BilingualInput
                      label="材质"
                      value={current.material}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (item as Artwork[])[selectedIndex].material = next;
                        })
                      }
                    />
                    <BilingualInput
                      label="品类"
                      value={current.category}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (item as Artwork[])[selectedIndex].category = next;
                        })
                      }
                    />
                    <BilingualInput
                      label="尺寸"
                      value={current.dimensions}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (item as Artwork[])[selectedIndex].dimensions = next;
                        })
                      }
                    />
                  </div>
                </div>
              </EditorSection>

              <EditorSection
                id="artwork-description"
                title="第 3 步：学术说明"
                description="这一块对应前台详情页图片下方的文字说明区。按前台阅读顺序填写即可。"
              >
                <div className="grid gap-4">
                  <HelperNote>如果时间有限，先写“简述”。观看描述和比较判断可以后补。</HelperNote>
                  <BilingualTextarea
                    label="简述"
                    rows={4}
                    value={current.excerpt}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as Artwork[])[selectedIndex].excerpt = next;
                      })
                    }
                  />
                  <BilingualTextarea
                    label="观看描述"
                    rows={6}
                    value={current.viewingNote}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as Artwork[])[selectedIndex].viewingNote = next;
                      })
                    }
                  />
                  <BilingualTextarea
                    label="比较判断"
                    rows={6}
                    value={current.comparisonNote}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as Artwork[])[selectedIndex].comparisonNote = next;
                      })
                    }
                  />
                </div>
              </EditorSection>

              <EditorSection
                id="artwork-records"
                title="第 4 步：来源、展览与出版"
                description="这一块对应前台详情页中段的来源、展览、出版信息。"
              >
                <div className="grid gap-6">
              <HelperNote>来源、展览、出版都支持一条一条新增。暂时没有的信息可以先留空，不会影响保存。</HelperNote>
              <div className="space-y-4 border border-[var(--line)] bg-[var(--surface)] p-4">
                <div className="flex items-center justify-between gap-4">
                  <Label>来源 / Provenance</Label>
                  <button
                    type="button"
                    onClick={() =>
                      updateDraft((item) => {
                        (item as Artwork[])[selectedIndex].provenance.push({
                          label: emptyBilingual(),
                          note: emptyBilingual(),
                        });
                      })
                    }
                    className="inline-flex min-h-10 items-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)]"
                  >
                    新增来源
                  </button>
                </div>
                {current.provenance.map((entry, index) => (
                  <div key={`provenance-${index}`} className="space-y-3 border border-[var(--line)] bg-white/40 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <Label>{`来源 ${index + 1}`}</Label>
                      <button
                        type="button"
                        onClick={() =>
                          updateDraft((item) => {
                            (item as Artwork[])[selectedIndex].provenance = removeArrayItem(
                              (item as Artwork[])[selectedIndex].provenance,
                              index,
                            );
                          })
                        }
                        className="text-xs tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[#8e4e3b]"
                      >
                        删除
                      </button>
                    </div>
                    <BilingualInput
                      label="来源标题"
                      value={entry.label}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (item as Artwork[])[selectedIndex].provenance[index].label = next;
                        })
                      }
                    />
                    <BilingualTextarea
                      label="附注"
                      rows={3}
                      value={entry.note ?? emptyBilingual()}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (item as Artwork[])[selectedIndex].provenance[index].note = next;
                        })
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-4 border border-[var(--line)] bg-[var(--surface)] p-4">
                <div className="flex items-center justify-between gap-4">
                  <Label>展览记录</Label>
                  <button
                    type="button"
                    onClick={() =>
                      updateDraft((item) => {
                        (item as Artwork[])[selectedIndex].exhibitions.push({
                          title: emptyBilingual(),
                          venue: emptyBilingual(),
                          year: "",
                        });
                      })
                    }
                    className="inline-flex min-h-10 items-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)]"
                  >
                    新增展览
                  </button>
                </div>
                {current.exhibitions.map((entry, index) => (
                  <div key={`art-exhibition-${index}`} className="space-y-3 border border-[var(--line)] bg-white/40 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <Label>{`展览 ${index + 1}`}</Label>
                      <button
                        type="button"
                        onClick={() =>
                          updateDraft((item) => {
                            (item as Artwork[])[selectedIndex].exhibitions = removeArrayItem(
                              (item as Artwork[])[selectedIndex].exhibitions,
                              index,
                            );
                          })
                        }
                        className="text-xs tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[#8e4e3b]"
                      >
                        删除
                      </button>
                    </div>
                    <BilingualInput
                      label="展览标题"
                      value={entry.title}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (item as Artwork[])[selectedIndex].exhibitions[index].title = next;
                        })
                      }
                    />
                    <BilingualInput
                      label="地点 / Venue"
                      value={entry.venue}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (item as Artwork[])[selectedIndex].exhibitions[index].venue = next;
                        })
                      }
                    />
                    <TextField
                      label="年份"
                      value={entry.year}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (item as Artwork[])[selectedIndex].exhibitions[index].year = next;
                        })
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-4 border border-[var(--line)] bg-[var(--surface)] p-4">
                <div className="flex items-center justify-between gap-4">
                  <Label>出版记录</Label>
                  <button
                    type="button"
                    onClick={() =>
                      updateDraft((item) => {
                        (item as Artwork[])[selectedIndex].publications.push({
                          title: emptyBilingual(),
                          year: "",
                          pages: emptyBilingual(),
                          note: emptyBilingual(),
                        });
                      })
                    }
                    className="inline-flex min-h-10 items-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)]"
                  >
                    新增出版
                  </button>
                </div>
                {current.publications.map((entry, index) => (
                  <div key={`publication-${index}`} className="space-y-3 border border-[var(--line)] bg-white/40 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <Label>{`出版 ${index + 1}`}</Label>
                      <button
                        type="button"
                        onClick={() =>
                          updateDraft((item) => {
                            (item as Artwork[])[selectedIndex].publications = removeArrayItem(
                              (item as Artwork[])[selectedIndex].publications,
                              index,
                            );
                          })
                        }
                        className="text-xs tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[#8e4e3b]"
                      >
                        删除
                      </button>
                    </div>
                    <BilingualInput
                      label="图录 / Catalogue"
                      value={entry.title}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (item as Artwork[])[selectedIndex].publications[index].title = next;
                        })
                      }
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                      <TextField
                        label="年份"
                        value={entry.year}
                        onChange={(next) =>
                          updateDraft((item) => {
                            (item as Artwork[])[selectedIndex].publications[index].year = next;
                          })
                        }
                      />
                      <BilingualInput
                        label="页码"
                        value={entry.pages}
                        onChange={(next) =>
                          updateDraft((item) => {
                            (item as Artwork[])[selectedIndex].publications[index].pages = next;
                          })
                        }
                      />
                    </div>
                    <BilingualTextarea
                      label="附注"
                      rows={3}
                      value={entry.note ?? emptyBilingual()}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (item as Artwork[])[selectedIndex].publications[index].note = next;
                        })
                      }
                    />
                  </div>
                ))}
              </div>
                </div>
              </EditorSection>

              <EditorSection
                id="artwork-relations"
                title="第 5 步：询洽与关联内容"
                description="这一块对应前台详情页底部的询洽提示和相关推荐。"
              >
                <div className="grid gap-6">
              <HelperNote>这一步不是必填，但建议至少关联一篇文章或一个展览，前台会更完整。</HelperNote>
              <div className="space-y-4 border border-[var(--line)] bg-[var(--surface)] p-4">
                <div className="flex items-center justify-between gap-4">
                  <Label>询洽补充信息</Label>
                  <button
                    type="button"
                    onClick={() =>
                      updateDraft((item) => {
                        (item as Artwork[])[selectedIndex].inquirySupport.push(emptyBilingual());
                      })
                    }
                    className="inline-flex min-h-10 items-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)]"
                  >
                    新增提示
                  </button>
                </div>
                {current.inquirySupport.map((entry, index) => (
                  <div key={`support-${index}`} className="space-y-3 border border-[var(--line)] bg-white/40 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <Label>{`提示 ${index + 1}`}</Label>
                      <button
                        type="button"
                        onClick={() =>
                          updateDraft((item) => {
                            (item as Artwork[])[selectedIndex].inquirySupport = removeArrayItem(
                              (item as Artwork[])[selectedIndex].inquirySupport,
                              index,
                            );
                          })
                        }
                        className="text-xs tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[#8e4e3b]"
                      >
                        删除
                      </button>
                    </div>
                    <BilingualInput
                      label={`提示 ${index + 1}`}
                      value={entry}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (item as Artwork[])[selectedIndex].inquirySupport[index] = next;
                        })
                      }
                    />
                  </div>
                ))}
              </div>

              <RelationChecklist
                label="关联文章"
                options={articleOptions}
                selected={current.relatedArticleSlugs}
                onToggle={(slug) =>
                  updateDraft((item) => {
                    (item as Artwork[])[selectedIndex].relatedArticleSlugs = toggleString(
                      (item as Artwork[])[selectedIndex].relatedArticleSlugs,
                      slug,
                    );
                  })
                }
              />
              <RelationChecklist
                label="关联展览"
                options={exhibitionOptions}
                selected={current.relatedExhibitionSlugs}
                onToggle={(slug) =>
                  updateDraft((item) => {
                    (item as Artwork[])[selectedIndex].relatedExhibitionSlugs = toggleString(
                      (item as Artwork[])[selectedIndex].relatedExhibitionSlugs,
                      slug,
                    );
                  })
                }
              />
                </div>
              </EditorSection>
                  </>
                );
              })()}
            </div>
          ) : null}
        </div>
      );
    }

    if (section === "exhibitions") {
      const items = draft as Exhibition[];
      const current = items[selectedIndex];

      return (
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-4">
            <WorkflowSteps
              title="展览页编辑顺序"
              steps={[
                { label: "第 1 步：上传封面", description: "先上传封面图。前台列表页和首页专题最先用到它。" },
                { label: "第 2 步：填写标题与时间地点", description: "接着填写标题、时间、地点和首页专题状态。" },
                { label: "第 3 步：填写前言、图录和正文", description: "导语、策展前言、图录标题与正文按顺序往下填。" },
                { label: "第 4 步：勾选重点作品和文章", description: "最后补重点作品和相关文章，前台会自动形成互链。" },
              ]}
            />
            <ListManager
              label="展览列表"
              items={items}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
              onAdd={() => {
                updateDraft((item) => (item as Exhibition[]).push(createExhibition()));
                setSelectedIndex(items.length);
              }}
              onRemove={(index) => {
                updateDraft((item) => {
                  const next = removeArrayItem(item as Exhibition[], index);
                  (item as Exhibition[]).splice(0, (item as Exhibition[]).length, ...next);
                });
                setSelectedIndex((currentIndex) => Math.max(0, currentIndex - (currentIndex >= index ? 1 : 0)));
              }}
              onMove={(from, to) => {
                if (from === to) return;
                updateDraft((item) => {
                  const next = moveArrayItem(item as Exhibition[], from, to);
                  (item as Exhibition[]).splice(0, (item as Exhibition[]).length, ...next);
                });
                setSelectedIndex(to);
              }}
              renderLabel={(index) =>
                `${items[index]?.publicationStatus === "draft" ? "草稿" : "已发布"} · ${
                  items[index]?.title.zh || items[index]?.slug || `展览 ${index + 1}`
                }`
              }
            />
          </div>

          {current ? (
            <div className="grid gap-6">
              <SectionMenu
                items={[
                  { id: "exhibition-basic", label: "第 1 步 封面与标题" },
                  { id: "exhibition-content", label: "第 2 步 前言与图录" },
                  { id: "exhibition-relations", label: "第 3 步 重点作品与文章" },
                ]}
              />
              <EditorSection
                id="exhibition-basic"
                title="第 1 步：封面、标题与时间地点"
                description="这一块对应前台展览列表卡片和展览详情页顶部。"
              >
                <div className="grid gap-4">
                  <HelperNote>如果这个展览要显示在首页专题，把“设为首页当前专题 / 近期展览”打开即可。</HelperNote>
                  <AdminMediaField
                    label="展览封面"
                    folder="exhibitions"
                    value={current.cover}
                    previewRatio="landscape"
                    targetSize={{ width: 1600, height: 1000 }}
                    onRequestAutoSave={queueAutoSaveAfterUpload}
                    recommendedUse="首页专题与展览列表封面"
                    recommendedSize="1600 x 1000 像素以上，横图约 1.45:1"
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as Exhibition[])[selectedIndex].cover = next;
                      })
                    }
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField
                      label="URL 标识（slug）"
                      value={current.slug}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (item as Exhibition[])[selectedIndex].slug = next;
                        })
                      }
                    />
                    <PublicationStatusField
                      value={current.publicationStatus ?? "published"}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (item as Exhibition[])[selectedIndex].publicationStatus = next;
                        })
                      }
                    />
                    <TextField
                      label="图录页数"
                      type="number"
                      value={String(current.cataloguePages)}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (item as Exhibition[])[selectedIndex].cataloguePages = Number(next || 0);
                        })
                      }
                    />
                  </div>
                  <SwitchField
                    label="设为首页当前专题 / 近期展览"
                    checked={Boolean(current.current)}
                    onChange={(checked) =>
                      updateDraft((item) => {
                        (item as Exhibition[]).forEach((entry, index) => {
                          entry.current = checked ? index === selectedIndex : false;
                        });
                      })
                    }
                  />
                  <BilingualInput
                    label="展览标题"
                    value={current.title}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as Exhibition[])[selectedIndex].title = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="副标题"
                    value={current.subtitle}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as Exhibition[])[selectedIndex].subtitle = next;
                      })
                    }
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <BilingualInput
                      label="时间"
                      value={current.period}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (item as Exhibition[])[selectedIndex].period = next;
                        })
                      }
                    />
                    <BilingualInput
                      label="地点"
                      value={current.venue}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (item as Exhibition[])[selectedIndex].venue = next;
                        })
                      }
                    />
                  </div>
                </div>
              </EditorSection>
              <EditorSection
                id="exhibition-content"
                title="第 2 步：前言、图录与正文"
                description="这一块对应前台展览详情页中部的导语、策展前言、图录说明和正文。"
              >
                <div className="grid gap-4">
                  <HelperNote>正文段落可以只有中文，英文可以以后再补。</HelperNote>
                  <BilingualTextarea
                    label="导语"
                    rows={4}
                    value={current.intro}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as Exhibition[])[selectedIndex].intro = next;
                      })
                    }
                  />
                  <BilingualTextarea
                    label="策展前言"
                    rows={4}
                    value={current.curatorialLead}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as Exhibition[])[selectedIndex].curatorialLead = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="图录标题"
                    value={current.catalogueTitle}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as Exhibition[])[selectedIndex].catalogueTitle = next;
                      })
                    }
                  />
                  <BilingualTextarea
                    label="图录简介"
                    rows={4}
                    value={current.catalogueIntro}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as Exhibition[])[selectedIndex].catalogueIntro = next;
                      })
                    }
                  />
                  <div className="space-y-4 border border-[var(--line)] bg-white/40 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <Label>正文段落</Label>
                      <button
                        type="button"
                        onClick={() =>
                          updateDraft((item) => {
                            (item as Exhibition[])[selectedIndex].description.push(emptyBilingual());
                          })
                        }
                        className="inline-flex min-h-10 items-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)]"
                      >
                        新增段落
                      </button>
                    </div>
                    {current.description.map((entry, index) => (
                      <div key={`exhibition-paragraph-${index}`} className="space-y-3 border border-[var(--line)] bg-[var(--surface)] p-4">
                        <div className="flex items-center justify-between gap-4">
                          <Label>{`段落 ${index + 1}`}</Label>
                          <button
                            type="button"
                            onClick={() =>
                              updateDraft((item) => {
                                (item as Exhibition[])[selectedIndex].description = removeArrayItem(
                                  (item as Exhibition[])[selectedIndex].description,
                                  index,
                                );
                              })
                            }
                            className="text-xs tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[#8e4e3b]"
                          >
                            删除
                          </button>
                        </div>
                        <BilingualTextarea
                          label={`段落 ${index + 1}`}
                          rows={4}
                          value={entry}
                          onChange={(next) =>
                            updateDraft((item) => {
                              (item as Exhibition[])[selectedIndex].description[index] = next;
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </EditorSection>
              <EditorSection
                id="exhibition-relations"
                title="第 3 步：重点作品与相关文章"
                description="这一块对应前台展览详情页底部的重点作品和相关文章。"
              >
                <div className="grid gap-6">
                  <HelperNote>重点作品数量会根据你勾选的作品自动计算，不需要手动填写。</HelperNote>
                  <RelationChecklist
                    label="重点作品"
                    options={artworkOptions}
                    selected={current.highlightArtworkSlugs}
                    onToggle={(slug) =>
                      updateDraft((item) => {
                        const next = toggleString(
                          (item as Exhibition[])[selectedIndex].highlightArtworkSlugs,
                          slug,
                        );
                        (item as Exhibition[])[selectedIndex].highlightArtworkSlugs = next;
                        (item as Exhibition[])[selectedIndex].highlightCount = next.length;
                      })
                    }
                  />
                  <RelationChecklist
                    label="关联文章"
                    options={articleOptions}
                    selected={current.relatedArticleSlugs}
                    onToggle={(slug) =>
                      updateDraft((item) => {
                        (item as Exhibition[])[selectedIndex].relatedArticleSlugs = toggleString(
                          (item as Exhibition[])[selectedIndex].relatedArticleSlugs,
                          slug,
                        );
                      })
                    }
                  />
                </div>
              </EditorSection>
            </div>
          ) : null}
        </div>
      );
    }

    const articleItems = draft as Article[];
    const currentArticle = articleItems[selectedIndex];

    return (
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <WorkflowSteps
            title="文章页编辑顺序"
            steps={[
              { label: "第 1 步：上传封面", description: "先上传封面图。文章列表页和详情页顶部最先使用这张图。" },
              { label: "第 2 步：填写标题、作者和日期", description: "接着填写文章列表里最先出现的标题、作者、栏目和日期。" },
              { label: "第 3 步：填写摘要与正文", description: "摘要和正文按前台阅读顺序填写，关键词可以后补。" },
              { label: "第 4 步：勾选相关展览和藏品", description: "最后补关联内容，文章详情页底部会自动出现链接。" },
            ]}
          />
          <ListManager
            label="文章列表"
            items={articleItems}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            onAdd={() => {
              updateDraft((item) => (item as Article[]).push(createArticle()));
              setSelectedIndex(articleItems.length);
            }}
            onRemove={(index) => {
              updateDraft((item) => {
                const next = removeArrayItem(item as Article[], index);
                (item as Article[]).splice(0, (item as Article[]).length, ...next);
              });
              setSelectedIndex((currentIndex) => Math.max(0, currentIndex - (currentIndex >= index ? 1 : 0)));
            }}
            onMove={(from, to) => {
              if (from === to) return;
              updateDraft((item) => {
                const next = moveArrayItem(item as Article[], from, to);
                (item as Article[]).splice(0, (item as Article[]).length, ...next);
              });
              setSelectedIndex(to);
            }}
            renderLabel={(index) =>
              `${articleItems[index]?.publicationStatus === "draft" ? "草稿" : "已发布"} · ${
                articleItems[index]?.title.zh || articleItems[index]?.slug || `文章 ${index + 1}`
              }`
            }
          />
        </div>

        {currentArticle ? (
          <div className="grid gap-6">
            <SectionMenu
              items={[
                { id: "article-basic", label: "第 1 步 封面与标题" },
                { id: "article-body", label: "第 2 步 摘要与正文" },
                { id: "article-relations", label: "第 3 步 关联内容" },
              ]}
            />
            <EditorSection
              id="article-basic"
              title="第 1 步：封面、标题、作者与日期"
              description="这一块对应前台文章列表卡片和文章详情页顶部。"
            >
              <div className="grid gap-4">
                <HelperNote>最少先填 6 项：封面、标题、日期、作者、栏目、摘要。这样前台文章列表就会正常显示。</HelperNote>
                <AdminMediaField
                  label="文章封面"
                  folder="articles"
                  value={currentArticle.cover}
                  previewRatio="landscape"
                  targetSize={{ width: 1400, height: 900 }}
                  onRequestAutoSave={queueAutoSaveAfterUpload}
                  recommendedUse="文章列表与文章详情头图"
                  recommendedSize="1400 x 900 像素以上，横图约 1.55:1"
                  onChange={(next) =>
                    updateDraft((item) => {
                      (item as Article[])[selectedIndex].cover = next;
                    })
                  }
                />
                <div className="grid gap-4 md:grid-cols-3">
                  <TextField
                    label="URL 标识（slug）"
                    value={currentArticle.slug}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as Article[])[selectedIndex].slug = next;
                      })
                    }
                  />
                  <PublicationStatusField
                    value={currentArticle.publicationStatus ?? "published"}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as Article[])[selectedIndex].publicationStatus = next;
                      })
                    }
                  />
                  <TextField
                    label="发布日期"
                    type="date"
                    value={currentArticle.date}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as Article[])[selectedIndex].date = next;
                      })
                    }
                  />
                </div>
                <BilingualInput
                  label="文章标题"
                  value={currentArticle.title}
                  onChange={(next) =>
                    updateDraft((item) => {
                      (item as Article[])[selectedIndex].title = next;
                    })
                  }
                />
                <div className="grid gap-4 md:grid-cols-3">
                  <BilingualInput
                    label="分类"
                    value={currentArticle.category}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as Article[])[selectedIndex].category = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="栏目"
                    value={currentArticle.column}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as Article[])[selectedIndex].column = next;
                      })
                    }
                  />
                  <BilingualInput
                    label="作者"
                    value={currentArticle.author}
                    onChange={(next) =>
                      updateDraft((item) => {
                        (item as Article[])[selectedIndex].author = next;
                      })
                    }
                  />
                </div>
                <BilingualTextarea
                  label="摘要"
                  rows={4}
                  value={currentArticle.excerpt}
                  onChange={(next) =>
                    updateDraft((item) => {
                      (item as Article[])[selectedIndex].excerpt = next;
                    })
                  }
                />
              </div>
            </EditorSection>
            <EditorSection
              id="article-body"
              title="第 2 步：摘要、正文与关键词"
              description="这一块对应前台文章列表摘要和文章详情正文。"
            >
              <div className="grid gap-6">
                <HelperNote>正文可以只写中文，关键词建议至少填 2 到 3 个，便于后续整理内容方向。</HelperNote>
                <div className="space-y-4 border border-[var(--line)] bg-white/40 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <Label>正文段落</Label>
                    <button
                      type="button"
                      onClick={() =>
                        updateDraft((item) => {
                          (item as Article[])[selectedIndex].body.push(emptyBilingual());
                        })
                      }
                      className="inline-flex min-h-10 items-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)]"
                    >
                      新增段落
                    </button>
                  </div>
                  {currentArticle.body.map((entry, index) => (
                    <div key={`article-body-${index}`} className="space-y-3 border border-[var(--line)] bg-[var(--surface)] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <Label>{`段落 ${index + 1}`}</Label>
                        <button
                          type="button"
                          onClick={() =>
                            updateDraft((item) => {
                              (item as Article[])[selectedIndex].body = removeArrayItem(
                                (item as Article[])[selectedIndex].body,
                                index,
                              );
                            })
                          }
                          className="text-xs tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[#8e4e3b]"
                        >
                          删除
                        </button>
                      </div>
                      <BilingualTextarea
                        label={`段落 ${index + 1}`}
                        rows={5}
                        value={entry}
                        onChange={(next) =>
                          updateDraft((item) => {
                            (item as Article[])[selectedIndex].body[index] = next;
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="space-y-4 border border-[var(--line)] bg-white/40 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <Label>关键词</Label>
                    <button
                      type="button"
                      onClick={() =>
                        updateDraft((item) => {
                          (item as Article[])[selectedIndex].keywords.push(emptyBilingual());
                        })
                      }
                      className="inline-flex min-h-10 items-center border border-[var(--line-strong)] px-4 text-sm text-[var(--ink)] transition-colors hover:bg-[var(--surface-strong)]"
                    >
                      新增关键词
                    </button>
                  </div>
                  {currentArticle.keywords.map((entry, index) => (
                    <div key={`keyword-${index}`} className="space-y-3 border border-[var(--line)] bg-[var(--surface)] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <Label>{`关键词 ${index + 1}`}</Label>
                        <button
                          type="button"
                          onClick={() =>
                            updateDraft((item) => {
                              (item as Article[])[selectedIndex].keywords = removeArrayItem(
                                (item as Article[])[selectedIndex].keywords,
                                index,
                              );
                            })
                          }
                          className="text-xs tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[#8e4e3b]"
                        >
                          删除
                        </button>
                      </div>
                      <BilingualInput
                        label={`关键词 ${index + 1}`}
                        value={entry}
                        onChange={(next) =>
                          updateDraft((item) => {
                            (item as Article[])[selectedIndex].keywords[index] = next;
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </EditorSection>
            <EditorSection
              id="article-relations"
              title="第 3 步：关联展览与藏品"
              description="这一块对应前台文章详情页底部的相关展览和相关藏品。"
            >
              <div className="grid gap-6">
                <HelperNote>如果文章和某件作品或某个展览有关，建议在这里勾选，前台会自动生成互链。</HelperNote>
                <RelationChecklist
                  label="关联藏品"
                  options={artworkOptions}
                  selected={currentArticle.relatedArtworkSlugs}
                  onToggle={(slug) =>
                    updateDraft((item) => {
                      (item as Article[])[selectedIndex].relatedArtworkSlugs = toggleString(
                        (item as Article[])[selectedIndex].relatedArtworkSlugs,
                        slug,
                      );
                    })
                  }
                />
                <RelationChecklist
                  label="关联展览"
                  options={exhibitionOptions}
                  selected={currentArticle.relatedExhibitionSlugs}
                  onToggle={(slug) =>
                    updateDraft((item) => {
                      (item as Article[])[selectedIndex].relatedExhibitionSlugs = toggleString(
                        (item as Article[])[selectedIndex].relatedExhibitionSlugs,
                        slug,
                      );
                    })
                  }
                />
              </div>
            </EditorSection>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <input type="hidden" name="section" value={section} />
      <input type="hidden" name="content" value={serialized} />
      <div className="space-y-2 border-b border-[var(--line)] pb-6">
        <h1 className="font-serif text-[2rem] leading-none tracking-[-0.04em] text-[var(--ink)] md:text-[3.3rem]">
          {title}
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-[var(--muted)]">{description}</p>
      </div>

      {renderSection()}

      <div className="flex flex-col gap-4 border-t border-[var(--line)] pt-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1 text-sm text-[var(--muted)]">
          <p>内容通过可视化表单保存到 `content/site-content.json`。</p>
          <p>图片会上传到仓库资源目录，并在下一次 Vercel 部署完成后对外可见。</p>
          <p>
            {autosaveState === "restored"
              ? "已恢复你上次未保存的浏览器草稿。"
              : autosaveState === "saved"
                ? "当前分区已自动保存在这台电脑的浏览器里。"
                : "编辑过程中会自动保存在当前浏览器。"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {previewHref ? (
            <a
              href={previewHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center border border-[var(--line)] px-5 text-[var(--muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
            >
              预览当前内容
            </a>
          ) : null}
          <button
            type="button"
            onClick={resetBrowserDraft}
            className="inline-flex min-h-11 items-center border border-[var(--line)] px-5 text-[var(--muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
          >
            清除浏览器草稿
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-11 items-center border border-[var(--line-strong)] px-6 text-[var(--ink)] transition-colors duration-300 hover:bg-[var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "保存中" : "保存当前分区"}
          </button>
        </div>
      </div>
      {state.error ? <p className="text-sm leading-7 text-[#8e4e3b]">{state.error}</p> : null}
      {state.success ? <p className="text-sm leading-7 text-[var(--muted)]">{state.success}</p> : null}
    </form>
  );
}
