"use client";

import { useActionState, useEffect, useMemo, useState } from "react";

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
    featured: false,
  };
}

function createExhibition(): Exhibition {
  return {
    slug: createSlug("exhibition"),
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
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
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
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
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
  return (
    <div className="grid gap-3 border border-[var(--line)] bg-[var(--surface)] p-4">
      <Label>{label}</Label>
      <div className="grid gap-3 md:grid-cols-2">
        <TextField
          label="中文"
          value={value.zh}
          onChange={(zh) => onChange({ ...value, zh })}
          placeholder={zhPlaceholder}
        />
        <TextField
          label="英文"
          value={value.en}
          onChange={(en) => onChange({ ...value, en })}
          placeholder={enPlaceholder}
        />
      </div>
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
  return (
    <div className="grid gap-3 border border-[var(--line)] bg-[var(--surface)] p-4">
      <Label>{label}</Label>
      <div className="grid gap-3 md:grid-cols-2">
        <TextAreaField
          label="中文"
          rows={rows}
          value={value.zh}
          onChange={(zh) => onChange({ ...value, zh })}
        />
        <TextAreaField
          label="英文"
          rows={rows}
          value={value.en}
          onChange={(en) => onChange({ ...value, en })}
        />
      </div>
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
  renderLabel,
}: {
  label: string;
  items: Array<{ slug?: string }>;
  selectedIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
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
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="text-xs tracking-[0.14em] text-[var(--muted)] transition-colors hover:text-[#8e4e3b]"
              >
                删除
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm leading-7 text-[var(--muted)]">当前分区还没有内容，点击上方“新增”开始添加。</p>
        )}
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
}: AdminVisualEditorProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [draft, setDraft] = useState<SiteContent[EditableSectionKey]>(() => cloneValue(initialValue));
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setDraft(cloneValue(initialValue));
    setSelectedIndex(0);
  }, [initialValue, section]);

  function updateDraft(recipe: (value: SiteContent[EditableSectionKey]) => void) {
    setDraft((current) => {
      const next = cloneValue(current);
      recipe(next);
      return next;
    });
  }

  const serialized = useMemo(() => JSON.stringify(draft), [draft]);
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
            note="可上传用于 Open Graph / 社交分享的图片，也可以保留现有生成图。"
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

    if (section === "brandIntro") {
      const value = draft as BrandIntroContent;

      return (
        <div className="grid gap-6">
          <AdminMediaField
            label="首页主图"
            folder="site"
            value={value.heroImage ?? ""}
            onChange={(next) => updateDraft((item) => ((item as BrandIntroContent).heroImage = next))}
            note="用于首页首屏主图。上传后保存即可更新。"
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
                  <div className="grid gap-3 md:grid-cols-2">
                    <TextAreaField
                      label="中文"
                      rows={3}
                      value={entry.zh}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (item as BrandIntroContent).methodology = updateArrayItem(
                            (item as BrandIntroContent).methodology,
                            index,
                            (target) => {
                              target.zh = next;
                            },
                          );
                        })
                      }
                    />
                    <TextAreaField
                      label="英文"
                      rows={3}
                      value={entry.en}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (item as BrandIntroContent).methodology = updateArrayItem(
                            (item as BrandIntroContent).methodology,
                            index,
                            (target) => {
                              target.en = next;
                            },
                          );
                        })
                      }
                    />
                  </div>
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
            renderLabel={(index) => items[index]?.title.zh || items[index]?.slug || `藏品 ${index + 1}`}
          />

          {current ? (
            <div className="grid gap-6">
              <AdminMediaField
                label="藏品主图"
                folder="artworks"
                value={current.image}
                onChange={(next) =>
                  updateDraft((item) => {
                    (item as Artwork[])[selectedIndex].image = next;
                  })
                }
              />
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="URL 标识（slug）"
                  value={current.slug}
                  onChange={(next) =>
                    updateDraft((item) => {
                      (item as Artwork[])[selectedIndex].slug = next;
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
              <div className="grid gap-4 md:grid-cols-2">
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
                    <div className="grid gap-3 md:grid-cols-2">
                      <TextField
                        label="中文"
                        value={entry.zh}
                        onChange={(next) =>
                          updateDraft((item) => {
                            (item as Artwork[])[selectedIndex].inquirySupport[index].zh = next;
                          })
                        }
                      />
                      <TextField
                        label="英文"
                        value={entry.en}
                        onChange={(next) =>
                          updateDraft((item) => {
                            (item as Artwork[])[selectedIndex].inquirySupport[index].en = next;
                          })
                        }
                      />
                    </div>
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
          ) : null}
        </div>
      );
    }

    if (section === "exhibitions") {
      const items = draft as Exhibition[];
      const current = items[selectedIndex];

      return (
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
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
            renderLabel={(index) => items[index]?.title.zh || items[index]?.slug || `展览 ${index + 1}`}
          />

          {current ? (
            <div className="grid gap-6">
              <AdminMediaField
                label="展览封面"
                folder="exhibitions"
                value={current.cover}
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

              <div className="space-y-4 border border-[var(--line)] bg-[var(--surface)] p-4">
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
                  <div key={`exhibition-paragraph-${index}`} className="space-y-3 border border-[var(--line)] bg-white/40 p-4">
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
                    <div className="grid gap-3 md:grid-cols-2">
                      <TextAreaField
                        label="中文"
                        rows={4}
                        value={entry.zh}
                        onChange={(next) =>
                          updateDraft((item) => {
                            (item as Exhibition[])[selectedIndex].description[index].zh = next;
                          })
                        }
                      />
                      <TextAreaField
                        label="英文"
                        rows={4}
                        value={entry.en}
                        onChange={(next) =>
                          updateDraft((item) => {
                            (item as Exhibition[])[selectedIndex].description[index].en = next;
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

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
          ) : null}
        </div>
      );
    }

    const articleItems = draft as Article[];
    const currentArticle = articleItems[selectedIndex];

    return (
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
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
          renderLabel={(index) => articleItems[index]?.title.zh || articleItems[index]?.slug || `文章 ${index + 1}`}
        />

        {currentArticle ? (
          <div className="grid gap-6">
            <AdminMediaField
              label="文章封面"
              folder="articles"
              value={currentArticle.cover}
              onChange={(next) =>
                updateDraft((item) => {
                  (item as Article[])[selectedIndex].cover = next;
                })
              }
            />
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="URL 标识（slug）"
                value={currentArticle.slug}
                onChange={(next) =>
                  updateDraft((item) => {
                    (item as Article[])[selectedIndex].slug = next;
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
            <div className="space-y-4 border border-[var(--line)] bg-[var(--surface)] p-4">
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
                <div key={`article-body-${index}`} className="space-y-3 border border-[var(--line)] bg-white/40 p-4">
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
                  <div className="grid gap-3 md:grid-cols-2">
                    <TextAreaField
                      label="中文"
                      rows={5}
                      value={entry.zh}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (item as Article[])[selectedIndex].body[index].zh = next;
                        })
                      }
                    />
                    <TextAreaField
                      label="英文"
                      rows={5}
                      value={entry.en}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (item as Article[])[selectedIndex].body[index].en = next;
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4 border border-[var(--line)] bg-[var(--surface)] p-4">
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
                <div key={`keyword-${index}`} className="space-y-3 border border-[var(--line)] bg-white/40 p-4">
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
                  <div className="grid gap-3 md:grid-cols-2">
                    <TextField
                      label="中文"
                      value={entry.zh}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (item as Article[])[selectedIndex].keywords[index].zh = next;
                        })
                      }
                    />
                    <TextField
                      label="英文"
                      value={entry.en}
                      onChange={(next) =>
                        updateDraft((item) => {
                          (item as Article[])[selectedIndex].keywords[index].en = next;
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
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
        ) : null}
      </div>
    );
  };

  return (
    <form action={formAction} className="space-y-6">
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
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setDraft(cloneValue(initialValue));
              setSelectedIndex(0);
            }}
            className="inline-flex min-h-11 items-center border border-[var(--line)] px-5 text-[var(--muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
          >
            放弃本页修改
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
