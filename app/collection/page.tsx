import Link from "next/link";

import { ArtworkCard } from "@/components/artwork-card";
import { CollectionFilters } from "@/components/collection-filters";
import { getArtworkStatusText } from "@/lib/bilingual";
import { buildMetadata } from "@/lib/metadata";
import { bt } from "@/lib/bilingual";
import { getFilterOptions, getFilteredArtworks, getPublicArtworks, loadSiteContent } from "@/lib/site-data";

export const dynamic = "force-dynamic";

const ARTWORKS_PER_PAGE = 9;

type CollectionPageProps = {
  searchParams?: Promise<{
    category?: string;
    region?: string;
    period?: string;
    material?: string;
    status?: string;
    page?: string;
  }>;
};

function buildCollectionPageHref(
  filters: NonNullable<Awaited<CollectionPageProps["searchParams"]>>,
  page: number,
) {
  const params = new URLSearchParams();

  if (filters.category) {
    params.set("category", filters.category);
  }
  if (filters.region) {
    params.set("region", filters.region);
  }
  if (filters.period) {
    params.set("period", filters.period);
  }
  if (filters.material) {
    params.set("material", filters.material);
  }
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `/collection?${query}` : "/collection";
}

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
  const requestedPage = Number.parseInt(filters.page ?? "1", 10);
  const totalPages = Math.max(1, Math.ceil(filteredArtworks.length / ARTWORKS_PER_PAGE));
  const currentPage = Number.isFinite(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), totalPages)
    : 1;
  const pageStartIndex = (currentPage - 1) * ARTWORKS_PER_PAGE;
  const artworks = filteredArtworks.slice(pageStartIndex, pageStartIndex + ARTWORKS_PER_PAGE);
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

      <section className="mx-auto w-full max-w-[1480px] px-5 pb-14 md:px-8 md:pb-18 lg:px-10 lg:pb-20">
        <CollectionFilters
          current={filters}
          options={filterOptions}
          labels={filterLabels}
          resultCount={filteredArtworks.length}
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

        {filteredArtworks.length > ARTWORKS_PER_PAGE ? (
          <div className="mt-12 border-t border-[var(--line)]/55 pt-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[0.76rem] leading-7 text-[var(--muted)]/86">
                第 {currentPage} 页，共 {totalPages} 页
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                {currentPage > 1 ? (
                  <Link
                    href={buildCollectionPageHref(filters, currentPage - 1)}
                    className="inline-flex min-h-[2.2rem] items-center rounded-full border border-[var(--line)]/55 px-3.5 py-[0.42rem] text-[0.72rem] text-[var(--muted)] transition-colors duration-150 hover:border-[var(--line-strong)]/46 hover:text-[var(--ink)]"
                  >
                    上一页
                  </Link>
                ) : null}

                <div className="flex flex-wrap items-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => {
                    const isCurrent = page === currentPage;
                    return (
                      <Link
                        key={page}
                        href={buildCollectionPageHref(filters, page)}
                        aria-current={isCurrent ? "page" : undefined}
                        className={`inline-flex min-h-[2.2rem] min-w-[2.2rem] items-center justify-center rounded-full border px-3 py-[0.42rem] text-[0.72rem] transition-colors duration-150 ${
                          isCurrent
                            ? "border-[var(--line-strong)]/55 text-[var(--ink)]"
                            : "border-[var(--line)]/45 text-[var(--muted)] hover:border-[var(--line-strong)]/42 hover:text-[var(--ink)]"
                        }`}
                      >
                        {page}
                      </Link>
                    );
                  })}
                </div>

                {currentPage < totalPages ? (
                  <Link
                    href={buildCollectionPageHref(filters, currentPage + 1)}
                    className="inline-flex min-h-[2.2rem] items-center rounded-full border border-[var(--line)]/55 px-3.5 py-[0.42rem] text-[0.72rem] text-[var(--muted)] transition-colors duration-150 hover:border-[var(--line-strong)]/46 hover:text-[var(--ink)]"
                  >
                    下一页
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
