import { CollectionResults } from "@/components/collection-results";
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
  const filteredArtworks = !filters.status
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
      <section className="mx-auto w-full max-w-[1480px] px-5 py-6 md:px-8 md:py-7 lg:px-10 lg:py-8">
        <div className="grid gap-3 md:grid-cols-[168px_minmax(0,480px)] md:items-start md:gap-6">
          <p className="text-[0.7rem] tracking-[0.17em] text-[var(--accent)]/84">
            {pageCopy.collection.hero.eyebrow.zh}
            <span className="mx-[0.45em] opacity-40">·</span>
            <span className="text-[0.44rem] uppercase tracking-[0.15em] text-[var(--accent)]/54">
              {pageCopy.collection.hero.eyebrow.en}
            </span>
          </p>
          <div className="space-y-2">
            <h1 className="font-serif text-[clamp(2.28rem,3.45vw,3rem)] leading-[1.02] tracking-[-0.04em] text-[var(--ink)]">
              {pageCopy.collection.hero.title.zh}
            </h1>
            <p className="max-w-[21rem] text-[0.78rem] leading-[1.9] text-[var(--muted)]/88">
              {pageCopy.collection.hero.description.zh}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1480px] px-5 pb-14 md:px-8 md:pb-18 lg:px-10 lg:pb-20">
        <CollectionFilters
          current={filters}
          options={filterOptions}
          labels={filterLabels}
          resultCount={filteredArtworks.length}
        />
        <div className="mt-6">
          {filteredArtworks.length > 0 ? (
            <CollectionResults artworks={filteredArtworks} />
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
