export const siteConfig = {
  siteName: "竹瑾居",
  title: "竹瑾居 | 喜马拉雅艺术与亚洲古代艺术",
  description:
    "竹瑾居专注于喜马拉雅艺术、藏传佛教艺术及相关亚洲古代艺术，面向藏家、机构、策展人与研究者提供收藏、展览与研究服务。",
  defaultDomain: "www.zhujinju.com",
  protocol: "https",
  locale: "zh_CN",
  ogImagePath: "/opengraph-image",
  contact: {
    email: "hello@zhujinju.com",
    phone: "+86 138 0000 0000",
    wechat: "Zhujinju_Official",
    whatsapp: "+86 138 0000 0000",
    address: "中国上海 · 预约制空间",
  },
};

export const siteBaseUrl = `${siteConfig.protocol}://${siteConfig.defaultDomain}`;

export function absoluteUrl(path = "/") {
  return new URL(path, `${siteBaseUrl}/`).toString();
}
