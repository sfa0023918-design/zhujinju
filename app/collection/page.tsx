import { ArtworkCard } from "@/components/artwork-card";
import { CollectionFilters } from "@/components/collection-filters";
import { getArtworkStatusText } from "@/lib/bilingual";
import { buildMetadata } from "@/lib/metadata";
import { bt } from "@/lib/bilingual";
import { getFilterOptions, getFilteredArtworks, getPublicArtworks, loadSiteContent } from "@/lib/site-data";

export const dynamic = "force-dynamic";

type CollectionPageProps = {
  searchParams?: Promise<{
    category?: string;
    region?: string;
    period?: string;
    material?: string;
    status?: string;
  }>;
};

export async function generateMetadata() {
  const { siteConfig, pageCopy } = await loadSiteContent();

  return buildMetadata({
    title: bt("藏品", "Collection"),
    description: pageCopy.collection.hero.description,
    path: "/collection",
    site: siteConfig,
  });
}

export default async function CollectionPage({ searchParams }: CollectionPageProps) {
  const filters = (await searchParams) ?? {};
  const content = await loadSiteContent();
  const baseArtworks = getFilteredArtworks(content, filters);
  const publicArtworks = getPublicArtworks(content);
  const artworks = !filters.status
    ? baseArtworks
    : baseArtworks.filter((artwork) => artwork.status === filters.status);
  const filterOptions = {
    ...getFilterOptions(content),
    statuses: Array.from(new Set(publicArtworks.map((artwork) => artwork.status))).map((status) => ({
      value: status,
      label: getArtworkStatusText(status),
    })),
  };
  const { pageCopy } = content;
  const filterLabels = {
    ...pageCopy.collection.filters,
    status: bt("状态", "Status"),
  };

  return (
    <>
      <section className="mx-auto w-full max-w-[1480px] px-5 py-6 md:px-10 md:py-8">
        <div className="grid gap-3 md:grid-cols-[168px_minmax(0,480px)] md:items-start md:gap-6">
          <p className="text-[0.7rem] tracking-[0.17em] text-[var(--accent)]/84">
            藏品浏览
            <span className="mx-[0.45em] opacity-40">·</span>
            <span className="text-[0.44rem] uppercase tracking-[0.15em] text-[var(--accent)]/54">
              Collection
            </span>
          </p>
          <div className="space-y-2">
            <h1 className="font-serif text-[clamp(2.28rem,3.45vw,3rem)] leading-[1.02] tracking-[-0.04em] text-[var(--ink)]">
              藏品浏览
            </h1>
            <p className="max-w-[21rem] text-[0.78rem] leading-[1.9] text-[var(--muted)]/88">
              {pageCopy.collection.hero.description.zh}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] px-5 pb-14 md:px-10 md:pb-20">
        <CollectionFilters
          current={filters}
          options={filterOptions}
          labels={filterLabels}
          resultCount={artworks.length}
        />
        <div className="mt-6 grid gap-x-8 gap-y-11 md:grid-cols-2 xl:grid-cols-3">
          {artworks.length > 0 ? (
            artworks.map((artwork, index) => (
              <ArtworkCard
                key={artwork.slug}
                artwork={artwork}
                priority={index < 3}
                variant="catalogue"
              />
            ))
          ) : (
            <div className="border-t border-[var(--line)] py-10 text-[var(--muted)]">
              <p className="text-sm leading-8">{pageCopy.collection.emptyState.zh}</p>
              <p className="mt-2 text-[0.66rem] uppercase tracking-[0.18em] text-[var(--accent)]/72">
                {pageCopy.collection.emptyState.en}
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
