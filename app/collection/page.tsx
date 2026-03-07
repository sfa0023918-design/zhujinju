import { ArtworkCard } from "@/components/artwork-card";
import { CollectionFilters } from "@/components/collection-filters";
import { PageHero } from "@/components/page-hero";
import { buildMetadata } from "@/lib/metadata";
import { bt } from "@/lib/bilingual";
import { collectingDirections, getFilteredArtworks } from "@/lib/site-data";
import { BilingualText } from "@/components/bilingual-text";

type CollectionPageProps = {
  searchParams?: Promise<{
    category?: string;
    region?: string;
    period?: string;
    material?: string;
  }>;
};

export const metadata = buildMetadata({
  title: bt("藏品", "Collection"),
  description: bt(
    "浏览竹瑾居所整理的铜造像、唐卡、佛教工艺与相关专题展览作品。",
    "Browse bronzes, thangkas, ritual objects, and related works organized by Zhu Jin Ju."
  ),
  path: "/collection",
});

export default async function CollectionPage({ searchParams }: CollectionPageProps) {
  const filters = (await searchParams) ?? {};
  const artworks = getFilteredArtworks(filters);

  return (
    <>
      <PageHero
        eyebrow={bt("藏品", "Collection")}
        title={bt("藏品浏览", "Browse the Collection")}
        description={bt(
          "按品类、地区、年代与材质筛选，建立更清晰的作品观看路径。列表以作品信息为中心，避免电商化排列。",
          "Filter by category, region, period, and material to build a clearer viewing path. The listing remains object-centered rather than retail-oriented."
        )}
        aside={bt(
          "字段沿用古董商与研究型图录常见的信息结构，便于从作品浏览直接进入深入比较与询洽。",
          "The entries follow the information structure common to dealership and research catalogues, allowing browsing to move naturally into comparison and inquiry."
        )}
      />

      <section className="mx-auto w-full max-w-[1480px] px-5 pb-16 md:px-10 md:pb-24">
        <CollectionFilters current={filters} />
        <div className="mt-10 grid gap-8">
          {artworks.length > 0 ? (
            artworks.map((artwork) => <ArtworkCard key={artwork.slug} artwork={artwork} />)
          ) : (
            <BilingualText
              as="div"
              text={bt(
                "当前筛选下暂无结果，可重置条件后继续浏览。",
                "No works match the current filters. Reset the criteria to continue browsing."
              )}
              className="border-t border-[var(--line)] py-10 flex flex-col gap-3 text-[var(--muted)]"
              zhClassName="text-sm leading-8"
              enClassName="text-[0.8rem] leading-7 text-[var(--accent)]/80"
            />
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] border-t border-[var(--line)] px-5 py-14 md:px-10 md:py-20">
        <div className="grid gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-5">
          {collectingDirections.map((direction) => (
            <div key={direction.name.zh} className="bg-[var(--surface-strong)] p-5">
              <BilingualText
                as="p"
                text={direction.name}
                className="font-serif text-[var(--ink)]"
                zhClassName="block text-[1.35rem] tracking-[-0.03em]"
                enClassName="mt-2 block font-sans text-[0.62rem] uppercase tracking-[0.2em] text-[var(--accent)]"
              />
              <BilingualText
                as="p"
                text={direction.description}
                className="mt-3 flex flex-col gap-3 text-[var(--muted)]"
                zhClassName="text-sm leading-7"
                enClassName="text-[0.76rem] leading-6 text-[var(--accent)]/80"
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
