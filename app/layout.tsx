import { buildMetadata } from "@/lib/metadata";
import { loadSiteContent } from "@/lib/site-data";

import "./globals.css";

export async function generateMetadata() {
  const { siteConfig } = await loadSiteContent();

  return {
    ...buildMetadata({ site: siteConfig }),
    keywords: [
      "竹瑾居",
      "Zhu Jin Ju",
      "喜马拉雅艺术",
      "Himalayan Art",
      "藏传佛教艺术",
      "Tibetan Buddhist Art",
      "亚洲古代艺术",
      "Asian Antiquities",
      "铜造像",
      "唐卡",
      "古董艺廊",
    ],
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans">
        <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">{children}</div>
      </body>
    </html>
  );
}
