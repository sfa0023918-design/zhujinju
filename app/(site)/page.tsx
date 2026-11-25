import { V3Home } from "@/components/v3/v3-home";
import { resolveArticleCover } from "@/lib/article-content";
import { withImageVersion } from "@/lib/image-url";
import {
  getCurrentExhibition,
  getPublicArticles,
  getPublicArtworks,
  getPublicExhibitions,
  loadSiteContent,
} from "@/lib/site-data";
import {
  countExhibitionWorks,
  getArtworkCardSrc,
  getArtworkFacts,
} from "@/lib/v3-helpers";

// 5 matched portrait masterpieces: 世尊观音 centered (index 2), 帝释天 in slot 2 (index 1)
const HERO_PLATE_SLUGS = [
  "artwork-1790493666006",
  "artwork-1773059260653",
  "artwork-1773412663200",
  "artwork-1790512216778",
  "artwork-1790502573230",
] as const;

export default async function HomePage() {
  const content = await loadSiteContent();
  const publicArtworks = getPublicArtworks(content);
  const publicExhibitions = getPublicExhibitions(content);
  const publicArticles = getPublicArticles(content);

  const pickedPlates = HERO_PLATE_SLUGS.map((slug) =>
    publicArtworks.find((a) => a.slug === slug),
  ).filter((a): a is NonNullable<typeof a> => Boolean(a));

  const heroArtworks = pickedPlates.length === 5 ? pickedPlates : publicArtworks.slice(0, 5);
  const toPlate = (a: (typeof publicArtworks)[number]) => ({
    slug: a.slug,
    title: a.title,
    card: getArtworkCardSrc(a),
    facts: getArtworkFacts(a, ["region", "period"]),
  });

  const ex26 =
    publicExhibitions.find((e) => e.slug === "himalayan-art-2026") ??
    getCurrentExhibition(content) ??
    publicExhibitions[0];

  const fdArticle = publicArticles.find((a) => a.slug === "form-and-devotion-2026");

  return (
    <V3Home
      totalArtworks={publicArtworks.length}
      totalCatalogues={publicExhibitions.length}
      plates={heroArtworks.map(toPlate)}
      exhibition2026={
        ex26
          ? {
              slug: ex26.slug,
              title: ex26.title,
              periodZh: ex26.period.zh,
              venue: ex26.venue,
              intro: ex26.catalogueIntro?.zh ? ex26.catalogueIntro : ex26.intro,
              workCount: countExhibitionWorks(ex26, publicArtworks),
              pageCount:
                ex26.cataloguePageImages?.filter(Boolean).length ||
                ex26.cataloguePageCount ||
                ex26.cataloguePages ||
                121,
            }
          : null
      }
      recentWorks={publicArtworks.slice(0, 10).map(toPlate)}
      chapters={fdArticle?.editorial?.chapters ?? []}
      articles={publicArticles.slice(0, 5).map((a) => ({
        slug: a.slug,
        date: a.date,
        category: a.category,
        title: a.title,
        cover: withImageVersion(resolveArticleCover(a)),
      }))}
    />
  );
}
