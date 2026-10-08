"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { ComponentProps } from "react";

import {
  filterCollectionArtworks,
  getCollectionFilterSignature,
  readCollectionFilters,
} from "@/lib/collection-filtering";
import type { CollectionArtworkSummary } from "@/lib/collection-filtering";
import type { BilingualText as BilingualValue } from "@/lib/site-data";

import { BilingualText } from "./bilingual-text";
import { CollectionFilters } from "./collection-filters";
import styles from "./collection-page.module.css";
import { CollectionResults } from "./collection-results";

type CollectionFiltersProps = ComponentProps<typeof CollectionFilters>;

type CollectionBrowserProps = {
  artworks: CollectionArtworkSummary[];
  options: CollectionFiltersProps["options"];
  labels: CollectionFiltersProps["labels"];
  emptyState: BilingualValue;
};

// Reads the filters from the address and narrows the list in the browser, so choosing
// a filter or a page no longer waits for the server to rebuild the whole page.
export function CollectionBrowser({ artworks, options, labels, emptyState }: CollectionBrowserProps) {
  const searchParams = useSearchParams();
  const filters = useMemo(() => readCollectionFilters(searchParams), [searchParams]);
  const filterSignature = getCollectionFilterSignature(filters);
  const filteredArtworks = useMemo(
    () => filterCollectionArtworks(artworks, filters),
    [artworks, filters],
  );

  const navigateToFilters = useCallback((href: string) => {
    if (href === `${window.location.pathname}${window.location.search}`) {
      return;
    }

    window.history.pushState(null, "", href);

    // Match the previous link navigation: bring the page back to its top when the
    // reader has scrolled past it, and leave the position alone otherwise.
    const pageTop = document.querySelector(`.${styles.collectionPage}`);
    if (pageTop && pageTop.getBoundingClientRect().top < 0) {
      pageTop.scrollIntoView();
    }
  }, []);

  return (
    <>
      <CollectionFilters
        current={filters}
        options={options}
        labels={labels}
        resultCount={filteredArtworks.length}
        onNavigate={navigateToFilters}
      />
      {filteredArtworks.length > 0 ? (
        <CollectionResults
          key={filterSignature}
          artworks={filteredArtworks}
          filterSignature={filterSignature}
        />
      ) : (
        <div className={styles.emptyState}>
          <BilingualText
            as="p"
            text={emptyState}
            className={styles.bilingualPair}
            zhClassName={styles.zh}
            enClassName={styles.en}
          />
        </div>
      )}
    </>
  );
}
