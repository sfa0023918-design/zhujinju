import { CollectionBrowser } from "@/components/collection-browser";
import styles from "@/components/collection-page.module.css";
import { bt } from "@/lib/bilingual";
import { toCollectionArtworkSummary } from "@/lib/collection-filtering";
import { buildMetadata } from "@/lib/metadata";
import { getPublicArtworks, loadSiteContent } from "@/lib/site-data";

// Filters and pages are read from the address in the browser, so every request
// renders with its own query (same as before) while later changes stay client-side.
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { siteConfig, pageCopy } = await loadSiteContent();
  const collectionHeroDescriptionEn =
    "FILTER BY CATEGORY, REGION, PERIOD, AND MATERIAL FOR AN ENHANCED VIEWING EXPERIENCE";

  return buildMetadata({
    title: bt("藏品", "Collection"),
    description: bt(
      pageCopy.collection.hero.description.zh,
      collectionHeroDescriptionEn,
    ),
    path: "/collection",
    site: siteConfig,
  });
}

export default async function CollectionPage() {
  const content = await loadSiteContent();
  const publicArtworks = getPublicArtworks(content);
  const artworkSummaries = publicArtworks.map(toCollectionArtworkSummary);
  const { pageCopy } = content;
  const filterLabels = {
    ...pageCopy.collection.filters,
    status: bt("状态", "Status"),
  };

  return (
    <div className={styles.collectionPage}>
      <section className={styles.hero}>
        <div className={styles.heroTitleGroup}>
          <h1>{pageCopy.collection.hero.title.zh}</h1>
          <p lang="en">{pageCopy.collection.hero.title.en}</p>
        </div>
        <p className={styles.totalCount}>
          <span>共 {publicArtworks.length} 件作品</span>
          <span lang="en">
            {publicArtworks.length} works ·{" "}
            {publicArtworks.filter((a) => a.status === "inquiry").length}{" "}
            available<span className={styles.desktopOnly}> on request</span>
          </span>
        </p>
      </section>

      <section className={styles.collectionBody}>
        <CollectionBrowser
          artworks={artworkSummaries}
          labels={filterLabels}
          emptyState={pageCopy.collection.emptyState}
        />
      </section>
    </div>
  );
}
