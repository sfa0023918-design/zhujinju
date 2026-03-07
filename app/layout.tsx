import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buildMetadata } from "@/lib/metadata";

import "./globals.css";

export const metadata = {
  ...buildMetadata(),
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans">
        <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
          <SiteHeader />
          <main className="site-fade-in">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
