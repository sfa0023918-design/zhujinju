import { bt } from "./bilingual";

export const siteConfig = {
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
  contact: {
    email: "hello@zhujinju.com",
    phone: "+86 138 0000 0000",
    wechat: "Zhujinju_Official",
    whatsapp: "+86 138 0000 0000",
    address: bt("中国上海 · 预约制空间", "Shanghai, China · By Appointment"),
  },
};

export const siteBaseUrl = `${siteConfig.protocol}://${siteConfig.defaultDomain}`;

export function absoluteUrl(path = "/") {
  return new URL(path, `${siteBaseUrl}/`).toString();
}
