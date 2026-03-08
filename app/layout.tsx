import { headers } from "next/headers";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buildMetadata } from "@/lib/metadata";
import { loadSiteContent } from "@/lib/site-data";

import "./globals.css";

export const dynamic = "force-dynamic";

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
  const headerStore = await headers();
  const pathname = headerStore.get("x-zhujinju-pathname") ?? "";
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <html lang="zh-CN">
      <body className="font-sans">
        <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
          {isAdminRoute ? null : <SiteHeader />}
          <main className="site-fade-in">{children}</main>
          {isAdminRoute ? null : <SiteFooter />}
        </div>
      </body>
    </html>
  );
}
