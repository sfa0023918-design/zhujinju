import { ArtworkCard } from "@/components/artwork-card";
import { CollectionFilters } from "@/components/collection-filters";
import { PageHero } from "@/components/page-hero";
import { buildMetadata } from "@/lib/metadata";
import { collectingDirections, getFilteredArtworks } from "@/lib/site-data";

type CollectionPageProps = {
  searchParams?: Promise<{
    category?: string;
    region?: string;
    period?: string;
    material?: string;
  }>;
};

export const metadata = buildMetadata({
  title: "藏品",
  description: "浏览竹瑾居所整理的铜造像、唐卡、佛教工艺与相关专题展览作品。",
  path: "/collection",
});

export default async function CollectionPage({ searchParams }: CollectionPageProps) {
  const filters = (await searchParams) ?? {};
  const artworks = getFilteredArtworks(filters);

  return (
    <>
      <PageHero
        eyebrow="Collection"
        title="藏品浏览"
        description="按品类、地区、年代与材质筛选，建立更清晰的作品观看路径。列表以作品信息为中心，避免电商化排列。"
        aside="当前内容由本地 mock data 驱动，字段结构已按后续接入 CMS 的方式整理。"
      />

      <section className="mx-auto w-full max-w-[1480px] px-5 pb-16 md:px-10 md:pb-24">
        <CollectionFilters current={filters} />
        <div className="mt-10 grid gap-8">
          {artworks.length > 0 ? (
            artworks.map((artwork) => <ArtworkCard key={artwork.slug} artwork={artwork} />)
          ) : (
            <div className="border-t border-[var(--line)] py-10 text-sm leading-8 text-[var(--muted)]">
              当前筛选下暂无结果，可重置条件后继续浏览。
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-14 md:px-10 md:py-20">
        <div className="grid gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-5">
          {collectingDirections.map((direction) => (
            <div key={direction.name} className="bg-[var(--surface-strong)] p-5">
              <p className="font-serif text-[1.35rem] tracking-[-0.03em] text-[var(--ink)]">
                {direction.name}
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{direction.description}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
