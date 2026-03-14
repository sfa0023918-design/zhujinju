import { bt } from "./bilingual";
import type { SiteConfigContent } from "./data/types";

export const siteConfig: SiteConfigContent = {
  siteName: bt("竹瑾居", "Zhu Jin Ju"),
  title: bt(
    "竹瑾居 | 喜马拉雅艺术与亚洲古代艺术",
    "Zhu Jin Ju | Himalayan Art and Asian Antiquities"
  ),
  description: bt(
    "竹瑾居专注于喜马拉雅艺术、藏传佛教艺术及相关亚洲古代艺术，面向藏家、机构、策展人与研究者提供收藏、展览与研究服务。",
    "Zhu Jin Ju focuses on Himalayan art, Tibetan Buddhist art, and related Asian antiquities, serving collectors, institutions, curators, and researchers through collecting, exhibitions, and research."
  ),
  defaultDomain: "www.zhujinju.com",
  protocol: "https",
  locale: "zh_CN",
  ogImagePath: "/opengraph-image",
  homeIntro: bt(
    "竹瑾居专注于喜马拉雅艺术、藏传佛教艺术及相关亚洲古代艺术，以作品、展览、图录与研究支撑长期判断。",
    "Zhu Jin Ju focuses on Himalayan art, Tibetan Buddhist art, and related Asian antiquities, grounding long-term judgement in objects, exhibitions, catalogues, and research."
  ),
  about: {
    eyebrow: bt("关于", "About"),
    title: bt("关于竹瑾居", "About Zhu Jin Ju"),
    subtitle: bt(
      "工作围绕收藏、研究、展览与图录展开。",
      "The work is structured around collecting, research, exhibitions, and catalogues."
    ),
    body: [
      bt(
        "竹瑾居是一家专注于喜马拉雅艺术、藏传佛教艺术及相关亚洲古代艺术的品牌，服务对象包括藏家、博物馆、机构、策展人与研究者。",
        "Zhu Jin Ju is dedicated to Himalayan art, Tibetan Buddhist art, and related Asian antiquities, serving collectors, museums, institutions, curators, and researchers."
      ),
      bt(
        "我们不以海量上新定义专业，也不将古代艺术处理为泛化的装饰品类。每一次展示、每一件作品与每一段文字，都应指向更准确的观看。",
        "We do not define professionalism by constant new arrivals, nor reduce historical art to generalized decoration. Each display, object, and paragraph should lead to a more precise way of looking."
      ),
      bt(
        "对竹瑾居而言，品牌并不独立于学术判断之外；网站、展览与图录，本身就是专业工作持续公开的一部分。",
        "For Zhu Jin Ju, the brand is not separate from scholarly judgement; the website, exhibitions, and catalogues are themselves part of making that work public."
      ),
    ],
  },
  contactPage: {
    eyebrow: bt("联系", "Contact"),
    title: bt("联系", "Contact"),
    description: bt(
      "欢迎藏家、机构、策展人与研究者联系。竹瑾居以作品咨询、借展洽谈、研究合作与图录交换为主要联络方向。",
      "Collectors, institutions, curators, and researchers are welcome to get in touch regarding works, loans, research collaboration, and catalogue exchange."
    ),
    aside: bt(
      "如咨询具体作品，可在表单中填写作品名称；若由作品页进入，意向作品将自动带入。成都会面采用预约制，可安排看件与研究交流。",
      "If you are inquiring about a specific work, include its title in the form. When arriving from an artwork page, the title is carried over automatically. Meetings in Chengdu are by appointment."
    ),
    infoLabels: {
      email: bt("邮箱", "Email"),
      wechat: bt("微信", "WeChat"),
      phoneWhatsapp: bt("电话 / WhatsApp", "Phone / WhatsApp"),
    },
  },
  footer: {
    intro: bt(
      "关注喜马拉雅艺术、藏传佛教艺术及相关亚洲古代艺术，以作品、展览、图录与研究建立长期判断。",
      "Focused on Himalayan art, Tibetan Buddhist art, and related Asian antiquities, with long-term judgement built through objects, exhibitions, catalogues, and research."
    ),
    appointment: bt("By Appointment in Chengdu", "By Appointment in Chengdu"),
    copyrightLabel: bt("版权所有", "Copyright"),
    contactHeading: bt("联络", "Contact"),
    informationHeading: bt("信息与请求", "Information"),
    collectionLink: bt("藏品浏览", "Browse Collection"),
    exhibitionsLink: bt("展览与图录", "Exhibitions & Catalogues"),
    journalLink: bt("文章与研究", "Journal & Research"),
    pdfRequestLabel: bt("PDF 索取", "PDF Request"),
    instagramLabel: bt("Instagram", "Instagram"),
    wechatLabel: bt("微信", "WeChat"),
  },
  contact: {
    email: "contact@zhujinju.com",
    phone: "+86 21 5466 2187",
    wechat: "zhujinju_shanghai",
    whatsapp: "+86 139 1806 2742",
    instagram: "@zhujinju_arts",
    pdfRequest: "catalogue@zhujinju.com",
    address: bt("中国成都 · 预约制空间", "Chengdu, China · By Appointment"),
    replyWindow: bt("作品咨询通常于 24 小时内回复。", "Artwork inquiries are usually answered within 24 hours."),
    collaborationNote: bt(
      "可联系借展、研究合作、图录交换与机构预约看件。",
      "Loans, research collaboration, catalogue exchange, and institutional viewings may be arranged."
    ),
    appointmentNote: bt("By appointment in Chengdu.", "By appointment in Chengdu."),
  },
};

export const siteBaseUrl = `${siteConfig.protocol}://${siteConfig.defaultDomain}`;

export function resolveSiteBaseUrl(config: SiteConfigContent = siteConfig) {
  return `${config.protocol}://${config.defaultDomain}`;
}

export function absoluteUrl(path = "/", config: SiteConfigContent = siteConfig) {
  return new URL(path, `${resolveSiteBaseUrl(config)}/`).toString();
}
