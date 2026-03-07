import { ArtworkCard } from "@/components/artwork-card";
import { CollectionFilters } from "@/components/collection-filters";
import { PageHero } from "@/components/page-hero";
import { buildMetadata } from "@/lib/metadata";
import { bt } from "@/lib/bilingual";
import { getFilterOptions, getFilteredArtworks, loadSiteContent } from "@/lib/site-data";
import { BilingualText } from "@/components/bilingual-text";

type CollectionPageProps = {
  searchParams?: Promise<{
    category?: string;
    region?: string;
    period?: string;
    material?: string;
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
  const artworks = getFilteredArtworks(content, filters);
  const filterOptions = getFilterOptions(content);
  const { collectingDirections, pageCopy } = content;

  return (
    <>
      <PageHero
        eyebrow={pageCopy.collection.hero.eyebrow}
        title={pageCopy.collection.hero.title}
        description={pageCopy.collection.hero.description}
        aside={pageCopy.collection.hero.aside}
      />

      <section className="mx-auto w-full max-w-[1480px] px-5 pb-16 md:px-10 md:pb-24">
        <CollectionFilters current={filters} options={filterOptions} />
        <div className="mt-10 grid gap-8">
          {artworks.length > 0 ? (
            artworks.map((artwork) => <ArtworkCard key={artwork.slug} artwork={artwork} />)
          ) : (
            <BilingualText
              as="div"
              text={pageCopy.collection.emptyState}
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
