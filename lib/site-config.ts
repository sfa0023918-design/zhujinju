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
      "竹瑾居以研究与眼光为基础，建立对作品更深的理解。",
      "Zhu Jin Ju builds a deeper understanding of each work through research and connoisseurship."
    ),
    body: [
      bt(
        "对竹瑾居而言，喜马拉雅艺术从来不只是一个“门类”或“标签”。每一件作品的背后，都连接着复杂而深远的历史线索、文化传统与精神世界；与此同时，我们始终珍视对作品本体的真实理解，也重视艺术经验在当代语境中的重新展开。",
        "For Zhu Jin Ju, Himalayan art has never been merely a category or a label. Behind each work lies a complex and far-reaching web of historical clues, cultural traditions, and spiritual worlds; at the same time, we remain committed to a truthful understanding of the object itself, while also valuing the renewed unfolding of artistic experience in the contemporary context."
      ),
      bt(
        "竹瑾居的空间实践主要围绕学术研究与展览展开，并持续以自媒体的方式策划、录制一系列与喜马拉雅艺术相关的视频、访谈与人物对谈。我们希望通过更具开放性的传播方式，将这一领域中的文化内涵、美学经验与人物视角传递给更多真正关心它的人。",
        "The practice of Zhu Jin Ju is centered on scholarly research and exhibitions, while also continuing to plan and produce a series of videos, interviews, and conversations related to Himalayan art through self-directed media. Through a more open mode of communication, we hope to bring the cultural depth, aesthetic experience, and human perspectives of this field to more people who genuinely care about it."
      ),
      bt(
        "我们相信，真正有价值的收藏，建立在理解之上；真正可靠的眼光，来自长期的研究、经验的积累，以及对审美与专业的共同坚持。竹瑾居愿以此为基础，与藏家一同进入喜马拉雅艺术更深处的世界。",
        "We believe that meaningful collecting is built upon understanding, and that reliable judgement comes from long-term research, accumulated experience, and a shared commitment to aesthetics and professional rigor. On this basis, Zhu Jin Ju hopes to accompany collectors into the deeper world of Himalayan art."
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
    wechat: "竹瑾居 张弥",
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
