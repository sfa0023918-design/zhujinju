import Link from "next/link";
import { formatCatalogueExtent, formatExhibitionPeriod } from "@/lib/display-format";

import type {
  Article,
  Artwork,
  BilingualText as BilingualValue,
  Exhibition,
  PageCopyContent,
} from "@/lib/site-data";
import { withImageVersion } from "@/lib/image-url";

import { ContemporaryExhibition } from "./contemporary-exhibition";
import { BilingualText } from "./bilingual-text";
import { MediaPlaceholder } from "./media-placeholder";
import { ProtectedImage } from "./protected-image";
import styles from "./exhibition-pages.module.css";

type ExhibitionsPageContentProps = {
  exhibitions: Exhibition[];
  pageCopy: PageCopyContent;
};

type ExhibitionDetailPageContentProps = {
  exhibition: Exhibition;
  detailCopy: PageCopyContent["exhibitionDetail"];
  highlightedArtworks: Artwork[];
  relatedArticles: Article[];
  pastExhibitions: Exhibition[];
};

// Some exhibitions store only a heading such as "序 / Preface" in the intro field.
// That heading belongs with the preface text, so lists and the masthead skip it.
function hasIntroSummary(exhibition: Exhibition) {
  return (
    exhibition.intro.zh.trim().length > 4 ||
    exhibition.intro.en.trim().split(/\s+/).length > 3
  );
}

// Keep "竹瑾居｜" and the rest of a title together on their own lines, so a title
// wraps at the divider instead of inside a word such as 喜马拉雅.
function ExhibitionTitle({
  as: Tag,
  text,
  className,
}: {
  as: "h1" | "h3";
  text: BilingualValue;
  className: string;
}) {
  const parts = text.zh.split("｜");

  return (
    <Tag className={className}>
      <span className={styles.zh}>
        {parts.map((part, index) => (
          <span key={`${index}-${part}`} className={styles.titleSegment}>
            {index < parts.length - 1 ? `${part}｜` : part}
          </span>
        ))}
      </span>
      <span className={styles.en}>{text.en}</span>
    </Tag>
  );
}

function getYear(exhibition: Exhibition) {
  return (
    exhibition.period.zh.match(/\d{4}/)?.[0] ??
    exhibition.period.en.match(/\d{4}/)?.[0] ??
    ""
  );
}

function ExhibitionImage({
  exhibition,
  priority = false,
  className,
}: {
  exhibition: Exhibition;
  priority?: boolean;
  className?: string;
}) {
  const image =
    exhibition.coverAsset?.detail ??
    exhibition.coverAsset?.hero ??
    exhibition.coverAsset?.card ??
    exhibition.cover;

  if (image.startsWith("/api/placeholder/")) {
    return (
      <div className={`${styles.coverPlaceholder} ${className ?? ""}`}>
        <MediaPlaceholder
          eyebrow="Exhibition Image"
          title={exhibition.title.zh}
        />
      </div>
    );
  }

  return (
    <ProtectedImage
      src={withImageVersion(image)}
      alt={`${exhibition.title.zh} ${exhibition.title.en}`.trim()}
      width={1800}
      height={1125}
      priority={priority}
      quality={86}
      sizes="(min-width: 1024px) 66vw, 100vw"
      wrapperClassName={`${styles.coverImageWrapper} ${className ?? ""}`}
      className={styles.coverImage}
    />
  );
}

function CatalogueFact({ exhibition }: { exhibition: Exhibition }) {
  return (
    <div className={styles.catalogueFact}>
      <BilingualText
        as="p"
        text={exhibition.catalogueTitle}
        className={styles.bilingualPair}
        zhClassName={styles.zh}
        enClassName={styles.en}
      />
      <BilingualText
        as="p"
        text={formatCatalogueExtent(exhibition)}
        className={`${styles.bilingualPair} ${styles.catalogueCount}`}
        zhClassName={styles.zh}
        enClassName={styles.en}
      />
    </div>
  );
}

function ExhibitionRecord({ exhibition }: { exhibition: Exhibition }) {
  return (
    <div className={styles.record}>
      <BilingualText
        as="p"
        text={formatExhibitionPeriod(exhibition.period)}
        className={styles.bilingualPair}
        zhClassName={styles.zh}
        enClassName={styles.en}
      />
      <BilingualText
        as="p"
        text={exhibition.venue}
        className={styles.bilingualPair}
        zhClassName={styles.zh}
        enClassName={styles.en}
      />
    </div>
  );
}

export function ExhibitionsPageContent({
  exhibitions,
  pageCopy,
}: ExhibitionsPageContentProps) {
  const currentExhibition = exhibitions.find(
    (exhibition) => exhibition.current === true,
  );
  const recentExhibition = currentExhibition ?? exhibitions[0];
  const pastExhibitions = recentExhibition
    ? exhibitions.filter(
        (exhibition) => exhibition.slug !== recentExhibition.slug,
      )
    : [];
  const recentSectionLabel = currentExhibition
    ? { zh: "当前展览", en: "Current Exhibition" }
    : { zh: "近期展览", en: "Recent Exhibition" };

  return (
    <div className={styles.exhibitionsPage}>
      <header className={styles.listHero}>
        <BilingualText
          as="p"
          text={pageCopy.exhibitions.hero.eyebrow}
          mode="inline"
          className={`${styles.bilingualPair} ${styles.eyebrow}`}
          zhClassName={styles.zh}
          enClassName={styles.en}
        />
        <BilingualText
          as="h1"
          text={pageCopy.exhibitions.hero.title}
          className={`${styles.bilingualPair} ${styles.listTitle}`}
          zhClassName={styles.zh}
          enClassName={styles.en}
        />
        <BilingualText
          as="div"
          text={pageCopy.exhibitions.hero.description}
          className={`${styles.bilingualPair} ${styles.listDescription}`}
          zhClassName={styles.zh}
          enClassName={styles.en}
        />
      </header>

      {recentExhibition ? (
        <section className={styles.recentSection}>
          <BilingualText
            as="h2"
            text={recentSectionLabel}
            className={`${styles.bilingualPair} ${styles.sectionLabel}`}
            zhClassName={styles.zh}
            enClassName={styles.en}
          />
          <article className={styles.recentExhibition}>
            <Link
              href={`/exhibitions/${recentExhibition.slug}`}
              className={styles.recentImageLink}
            >
              <ExhibitionImage exhibition={recentExhibition} priority />
            </Link>
            <div className={styles.recentRecord}>
              <p className={styles.year}>{getYear(recentExhibition)}</p>
              <BilingualText
                as="p"
                text={recentExhibition.subtitle}
                className={`${styles.bilingualPair} ${styles.subtitle}`}
                zhClassName={styles.zh}
                enClassName={styles.en}
              />
              <ExhibitionTitle
                as="h3"
                text={recentExhibition.title}
                className={`${styles.bilingualPair} ${styles.exhibitionTitle}`}
              />
              <ExhibitionRecord exhibition={recentExhibition} />
              {hasIntroSummary(recentExhibition) ? (
                <BilingualText
                  as="div"
                  text={recentExhibition.intro}
                  className={`${styles.bilingualPair} ${styles.intro}`}
                  zhClassName={styles.zh}
                  enClassName={styles.en}
                />
              ) : null}
              <CatalogueFact exhibition={recentExhibition} />
              <Link
                href={`/exhibitions/${recentExhibition.slug}`}
                className={styles.viewLink}
              >
                <BilingualText
                  as="span"
                  text={pageCopy.exhibitions.cardLabels.viewAction}
                  className={styles.bilingualPair}
                  zhClassName={styles.zh}
                  enClassName={styles.en}
                />
              </Link>
            </div>
          </article>
        </section>
      ) : null}

      {pastExhibitions.length ? (
        <section className={styles.pastSection}>
          <BilingualText
            as="h2"
            text={{ zh: "往期展览", en: "Past Exhibitions" }}
            className={`${styles.bilingualPair} ${styles.sectionLabel}`}
            zhClassName={styles.zh}
            enClassName={styles.en}
          />
          <div className={styles.pastGrid}>
            {pastExhibitions.map((exhibition, index) => (
              <article
                key={exhibition.slug}
                className={`${styles.pastExhibition} ${index % 2 ? styles.pastExhibitionReverse : ""}`}
              >
                <div className={styles.pastRecord}>
                  <p className={styles.year}>{getYear(exhibition)}</p>
                  <ExhibitionTitle
                    as="h3"
                    text={exhibition.title}
                    className={`${styles.bilingualPair} ${styles.pastTitle}`}
                  />
                  <ExhibitionRecord exhibition={exhibition} />
                  <CatalogueFact exhibition={exhibition} />
                </div>
                <Link
                  href={`/exhibitions/${exhibition.slug}`}
                  className={styles.pastImageLink}
                >
                  <ExhibitionImage exhibition={exhibition} />
                </Link>
                <div className={styles.pastIntro}>
                  {hasIntroSummary(exhibition) ? (
                    <BilingualText
                      as="div"
                      text={exhibition.intro}
                      className={`${styles.bilingualPair} ${styles.intro}`}
                      zhClassName={styles.zh}
                      enClassName={styles.en}
                    />
                  ) : null}
                  <Link
                    href={`/exhibitions/${exhibition.slug}`}
                    className={styles.viewLink}
                  >
                    <BilingualText
                      as="span"
                      text={pageCopy.exhibitions.cardLabels.viewAction}
                      className={styles.bilingualPair}
                      zhClassName={styles.zh}
                      enClassName={styles.en}
                    />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function ExhibitionDetailPageContent({
  exhibition,
  detailCopy,
  highlightedArtworks,
  relatedArticles,
  pastExhibitions,
}: ExhibitionDetailPageContentProps) {
  return (
    <ContemporaryExhibition
      exhibition={exhibition}
      detailCopy={detailCopy}
      relatedArticles={relatedArticles}
      pastExhibitions={pastExhibitions}
      fallbackWorkCount={highlightedArtworks.length}
    />
  );
}
