import type {
  Artwork,
  BilingualText,
  Exhibition,
  PublicationReference,
} from "./types";

export type ArtworkCatalogueReference = {
  title: BilingualText;
  href: string;
  images: string[];
  pages: readonly [number, number];
};

type CatalogueEdition = {
  slug: string;
  imagePage: (printedPage: number) => number | undefined;
  paired: boolean;
};

// The 2023 online edition omits pages from the printed edition. These entry
// openings were checked against the actual online plates, not array offsets.
const OPENINGS_2023: Record<number, number> = {
  14: 14,
  22: 22,
  36: 36,
  50: 50,
  96: 90,
  100: 96,
  120: 116,
};

const EDITIONS: Record<string, CatalogueEdition> = {
  "2023": {
    slug: "exhibition-1773399222802",
    imagePage: (page) => OPENINGS_2023[page],
    paired: true,
  },
  "2024": {
    slug: "exhibition-1773394358822",
    imagePage: (page) => Math.floor(page / 2) + 1,
    paired: false,
  },
  "2025": {
    slug: "silent-radiance",
    imagePage: (page) => Math.floor(page / 2) + 1,
    paired: false,
  },
  "2026": {
    slug: "himalayan-art-2026",
    imagePage: (page) => Math.floor(page / 2),
    paired: false,
  },
};

function publicationPages(
  publication: PublicationReference,
): readonly [number, number] | undefined {
  const text = publication.pages.zh.trim() || publication.pages.en.trim();
  const match = text.match(
    /^(?:第\s*|pp?\.\s*|pages?\s+)?(\d+)\s*(?:[–—-]\s*(\d+))?\s*页?$/i,
  );
  if (!match) return undefined;
  const start = Number(match[1]);
  const end = Number(match[2] ?? match[1]);
  return start > 0 && end >= start ? [start, end] : undefined;
}

export function getArtworkCatalogueReference(
  artwork: Pick<Artwork, "publications">,
  exhibitions: readonly Exhibition[],
): ArtworkCatalogueReference | undefined {
  // Prefer the latest recorded exhibition catalogue when a work appears twice.
  const publications = artwork.publications
    .filter(({ title }) =>
      /竹瑾居.*图录|zhu\s*jin\s*ju.*catalogue/i.test(`${title.zh} ${title.en}`),
    )
    .map((publication) => ({
      publication,
      year: publication.year.match(/20\d{2}/)?.[0] ?? "",
    }))
    .sort((a, b) => Number(b.year) - Number(a.year));

  for (const { publication, year } of publications) {
    const edition = EDITIONS[year];
    const pages = publicationPages(publication);
    if (!edition || !pages) continue;
    const exhibition = exhibitions.find(
      (item) =>
        item.slug === edition.slug && item.publicationStatus !== "draft",
    );
    const catalogueImages = exhibition?.cataloguePageImages?.filter(Boolean);
    if (!exhibition || !catalogueImages?.length) continue;
    const imagePage = edition.imagePage(pages[0]);
    if (imagePage === undefined) continue;
    const image = `/uploads/catalogues/${edition.slug}/page-${String(imagePage).padStart(3, "0")}.jpg`;
    const index = catalogueImages.indexOf(image);
    if (index < 0) continue;
    const images = catalogueImages.slice(
      index,
      index + (edition.paired ? 2 : 1),
    );
    if (edition.paired && images.length !== 2) continue;
    return {
      title: exhibition.catalogueTitle,
      pages,
      images,
      // Hashes address the current reader array, never the printed page number.
      href: `/exhibitions/${exhibition.slug}#catalogue-p${index + 1}`,
    };
  }
  return undefined;
}
