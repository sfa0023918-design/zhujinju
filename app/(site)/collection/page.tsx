import { BilingualText } from "@/components/bilingual-text";
import { CollectionFilters } from "@/components/collection-filters";
import styles from "@/components/collection-page.module.css";
import { CollectionResults } from "@/components/collection-results";
import { bt, getArtworkStatusText } from "@/lib/bilingual";
import { buildMetadata } from "@/lib/metadata";
import {
  getFilterOptions,
  getFilteredArtworks,
  getPublicArtworks,
  loadSiteContent,
} from "@/lib/site-data";

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

export async function generateMetadata() {
  const { siteConfig, pageCopy } = await loadSiteContent();
  const collectionHeroDescriptionEn =
    "FILTER BY CATEGORY, REGION, PERIOD, AND MATERIAL FOR AN ENHANCED VIEWING EXPERIENCE";

  return buildMetadata({
    title: bt("藏品", "Collection"),
    description: bt(pageCopy.collection.hero.description.zh, collectionHeroDescriptionEn),
    path: "/collection",
    site: siteConfig,
  });
}

export default async function CollectionPage({ searchParams }: CollectionPageProps) {
  const params = (await searchParams) ?? {};
  const { page: _page, ...filters } = params;
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
  const collectionHeroDescriptionEn =
    "FILTER BY CATEGORY, REGION, PERIOD, AND MATERIAL FOR AN ENHANCED VIEWING EXPERIENCE";
  const filterLabels = {
    ...pageCopy.collection.filters,
    status: bt("状态", "Status"),
  };
  const filterKey = [
    filters.category,
    filters.region,
    filters.period,
    filters.material,
    filters.status,
  ].map((value) => value ?? "").join("|");

  return (
    <div className={styles.collectionPage}>
      <section className={styles.hero}>
        <BilingualText
          as="p"
          text={pageCopy.collection.hero.eyebrow}
          mode="inline"
          className={`${styles.bilingualPair} ${styles.eyebrow}`}
          zhClassName={styles.zh}
          enClassName={styles.en}
        />
        <div className={styles.heroGrid}>
          <div className={styles.heroTitleGroup}>
            <h1>{pageCopy.collection.hero.title.zh}</h1>
            <p>{pageCopy.collection.hero.title.en}</p>
          </div>
          <div className={styles.heroDescription}>
            <p>{pageCopy.collection.hero.description.zh}</p>
            <p lang="en">{collectionHeroDescriptionEn}</p>
          </div>
        </div>
      </section>

      <section className={styles.collectionBody}>
        <CollectionFilters
          current={filters}
          options={filterOptions}
          labels={filterLabels}
          resultCount={filteredArtworks.length}
        />
        {filteredArtworks.length > 0 ? (
          <CollectionResults
            key={filterKey}
            artworks={filteredArtworks}
            filterSignature={filterKey}
          />
        ) : (
          <div className={styles.emptyState}>
            <BilingualText
              as="p"
              text={pageCopy.collection.emptyState}
              className={styles.bilingualPair}
              zhClassName={styles.zh}
              enClassName={styles.en}
            />
          </div>
        )}
      </section>
    </div>
  );
}
