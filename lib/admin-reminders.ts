import type { HomeContentEditorValue, SiteConfigContent } from "./site-data";

export type EditorReminder = {
  field: string;
  section: string;
  message: string;
};

function hasText(value?: string) {
  return Boolean(value?.trim());
}

function hasBilingualText(value?: { zh: string; en: string }) {
  return hasText(value?.zh) || hasText(value?.en);
}

export function getSiteConfigReminders(config: SiteConfigContent): EditorReminder[] {
  const reminders: EditorReminder[] = [];

  if (!hasText(config.siteName.zh)) {
    reminders.push({ field: "siteName.zh", section: "branding", message: "建议填写品牌中文名" });
  }

  if (!hasText(config.siteName.en)) {
    reminders.push({ field: "siteName.en", section: "branding", message: "建议填写品牌英文名" });
  }

  if (!hasText(config.about.title.zh)) {
    reminders.push({ field: "about.title.zh", section: "about", message: "建议填写 About 标题" });
  }

  if (!hasBilingualText(config.about.subtitle)) {
    reminders.push({ field: "about.subtitle.zh", section: "about", message: "建议补充 About 副标题" });
  }

  if (!config.about.body.some((paragraph) => hasBilingualText(paragraph))) {
    reminders.push({ field: "about.body.0.zh", section: "about", message: "建议补充 About 正文" });
  }

  if (!hasText(config.contact.email)) {
    reminders.push({ field: "contact.email", section: "contact", message: "建议填写联系邮箱" });
  }

  if (!hasText(config.contact.phone) && !hasText(config.contact.whatsapp)) {
    reminders.push({ field: "contact.phone", section: "contact", message: "建议填写电话或 WhatsApp" });
  }

  if (!hasText(config.contact.wechat)) {
    reminders.push({ field: "contact.wechat", section: "contact", message: "建议填写微信" });
  }

  if (!hasBilingualText(config.title)) {
    reminders.push({ field: "title.zh", section: "branding", message: "建议填写 SEO 标题" });
  }

  if (!hasBilingualText(config.description)) {
    reminders.push({ field: "description.zh", section: "branding", message: "建议填写 SEO 描述" });
  }

  if (!hasText(config.defaultDomain)) {
    reminders.push({ field: "defaultDomain", section: "branding", message: "建议填写主域名" });
  }

  return reminders;
}

export function getHomeContentReminders(value: HomeContentEditorValue): EditorReminder[] {
  const reminders: EditorReminder[] = [];

  if (!hasText(value.homeContent.heroTitle.zh)) {
    reminders.push({ field: "homeContent.heroTitle.zh", section: "hero", message: "建议填写 Hero 中文主标题" });
  }

  if (!hasText(value.homeContent.focusCurrent.eyebrow.zh)) {
    reminders.push({ field: "homeContent.focusCurrent.eyebrow.zh", section: "focus", message: "建议填写当前专题标题" });
  }

  if (!value.featuredArtworkIds.length) {
    reminders.push({ field: "featuredArtworkIds", section: "selectedWorks", message: "建议至少选择一件精选作品" });
  }

  return reminders;
}
