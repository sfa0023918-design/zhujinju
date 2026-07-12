import Link from "next/link";

import type {
  Article,
  Artwork,
  Exhibition,
  PageCopyContent,
} from "@/lib/site-data";
import { withImageVersion } from "@/lib/image-url";

import { ArtworkCard } from "./artwork-card";
import { BilingualText } from "./bilingual-text";
import { ExhibitionCatalogueViewer } from "./exhibition-catalogue-viewer";
import { ExhibitionDetailReading } from "./exhibition-detail-reading";
import { HistoryBackLink } from "./history-back-link";
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
};

function getYear(exhibition: Exhibition) {
  return exhibition.period.zh.match(/\d{4}/)?.[0]
    ?? exhibition.period.en.match(/\d{4}/)?.[0]
    ?? "";
}

function getCataloguePageCount(exhibition: Exhibition) {
  return exhibition.cataloguePageCount ?? exhibition.cataloguePages ?? exhibition.cataloguePageImages?.length ?? 0;
}

function getCatalogueMode(exhibition: Exhibition) {
  return exhibition.catalogueViewMode === "spread-images"
    ? { zh: "幅图录版面", en: "catalogue spreads" }
    : { zh: "页图录", en: "catalogue pages" };
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
  const image = exhibition.coverAsset?.detail
    ?? exhibition.coverAsset?.hero
    ?? exhibition.coverAsset?.card
    ?? exhibition.cover;

  if (image.startsWith("/api/placeholder/")) {
    return (
      <div className={`${styles.coverPlaceholder} ${className ?? ""}`}>
        <MediaPlaceholder eyebrow="Exhibition Image" title={exhibition.title.zh} />
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
  const pageCount = getCataloguePageCount(exhibition);
  const unit = getCatalogueMode(exhibition);

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
        text={{
          zh: `${pageCount}${unit.zh}`,
          en: `${pageCount} ${unit.en}`,
        }}
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
        text={exhibition.period}
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
  const currentExhibition = exhibitions.find((exhibition) => exhibition.current === true);
  const recentExhibition = currentExhibition ?? exhibitions[0];
  const pastExhibitions = recentExhibition
    ? exhibitions.filter((exhibition) => exhibition.slug !== recentExhibition.slug)
    : [];
  const recentSectionLabel = currentExhibition
    ? { zh: "当前展览", en: "Current Exhibition" }
    : { zh: "近期展览", en: "Recent Exhibition" };

  return (
    <main className={styles.exhibitionsPage}>
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
              <BilingualText
                as="h3"
                text={recentExhibition.title}
                className={`${styles.bilingualPair} ${styles.exhibitionTitle}`}
                zhClassName={styles.zh}
                enClassName={styles.en}
              />
              <ExhibitionRecord exhibition={recentExhibition} />
              <BilingualText
                as="div"
                text={recentExhibition.intro}
                className={`${styles.bilingualPair} ${styles.intro}`}
                zhClassName={styles.zh}
                enClassName={styles.en}
              />
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
                  <BilingualText
                    as="h3"
                    text={exhibition.title}
                    className={`${styles.bilingualPair} ${styles.pastTitle}`}
                    zhClassName={styles.zh}
                    enClassName={styles.en}
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
                  <BilingualText
                    as="div"
                    text={exhibition.intro}
                    className={`${styles.bilingualPair} ${styles.intro}`}
                    zhClassName={styles.zh}
                    enClassName={styles.en}
                  />
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
    </main>
  );
}

export function ExhibitionDetailPageContent({
  exhibition,
  detailCopy,
  highlightedArtworks,
  relatedArticles,
}: ExhibitionDetailPageContentProps) {
  const cataloguePages = exhibition.cataloguePageImages?.filter(Boolean) ?? [];
  const pageCount = getCataloguePageCount(exhibition);
  const catalogueUnit = getCatalogueMode(exhibition);
  const catalogueNote = exhibition.catalogueNote ?? exhibition.catalogueIntro;
  const curatorialNote = exhibition.curatorialNote ?? exhibition.curatorialLead;

  return (
    <main className={styles.exhibitionDetail}>
      <section className={styles.detailHero}>
        <div className={styles.detailCover}>
          <ExhibitionImage exhibition={exhibition} priority />
        </div>
        <div className={styles.detailRecord}>
          <HistoryBackLink fallbackHref="/exhibitions" className={styles.backLink}>
            <BilingualText
              as="span"
              text={detailCopy.backAction}
              className={styles.bilingualPair}
              zhClassName={styles.zh}
              enClassName={styles.en}
            />
          </HistoryBackLink>
          <p className={styles.year}>{getYear(exhibition)}</p>
          <BilingualText
            as="p"
            text={exhibition.subtitle}
            className={`${styles.bilingualPair} ${styles.subtitle}`}
            zhClassName={styles.zh}
            enClassName={styles.en}
          />
          <BilingualText
            as="h1"
            text={exhibition.title}
            className={`${styles.bilingualPair} ${styles.detailTitle}`}
            zhClassName={styles.zh}
            enClassName={styles.en}
          />
          <ExhibitionRecord exhibition={exhibition} />
          <dl className={styles.summaryFacts}>
            <div>
              <dt>{detailCopy.summaryLine.highlightUnit.zh}</dt>
              <dd>{exhibition.featuredWorksCount ?? exhibition.highlightCount ?? highlightedArtworks.length}</dd>
            </div>
            <div>
              <dt>{catalogueUnit.zh}</dt>
              <dd>{pageCount}</dd>
            </div>
          </dl>
          <BilingualText
            as="div"
            text={exhibition.intro}
            className={`${styles.bilingualPair} ${styles.detailIntro}`}
            zhClassName={styles.zh}
            enClassName={styles.en}
          />
          {cataloguePages.length ? (
            <Link href="#catalogue" className={styles.catalogueLink}>
              <BilingualText
                as="span"
                text={{ zh: "查看电子图录", en: "View Catalogue" }}
                className={styles.bilingualPair}
                zhClassName={styles.zh}
                enClassName={styles.en}
              />
            </Link>
          ) : null}
        </div>
      </section>

      {cataloguePages.length ? (
        <section id="catalogue" className={styles.catalogueSection}>
          <div className={styles.catalogueFrame}>
            <ExhibitionCatalogueViewer
              title={exhibition.catalogueTitle}
              note={catalogueNote}
              pages={cataloguePages}
              viewMode={exhibition.catalogueViewMode}
            />
          </div>
        </section>
      ) : null}

      <div className={styles.readingFrame}>
        <ExhibitionDetailReading
          introLabel={{ zh: "展览介绍", en: "Exhibition Text" }}
          intro={exhibition.intro}
          description={exhibition.description}
          catalogueNoteLabel={detailCopy.catalogueNote}
          catalogueNote={catalogueNote}
          curatorialLeadLabel={{ zh: "策展说明", en: "Curatorial Note" }}
          curatorialLead={curatorialNote}
          relatedWritingLabel={detailCopy.relatedWriting}
          relatedArticles={relatedArticles.map((article) => ({
            slug: article.slug,
            title: article.title,
          }))}
        />
      </div>

      {highlightedArtworks.length ? (
        <section className={styles.highlightedWorks}>
          <BilingualText
            as="p"
            text={detailCopy.highlightedWorks}
            className={`${styles.bilingualPair} ${styles.sectionLabel}`}
            zhClassName={styles.zh}
            enClassName={styles.en}
          />
          <BilingualText
            as="h2"
            text={detailCopy.highlightedWorksTitle}
            className={`${styles.bilingualPair} ${styles.highlightTitle}`}
            zhClassName={styles.zh}
            enClassName={styles.en}
          />
          <div className={styles.highlightGrid}>
            {highlightedArtworks.map((artwork) => (
              <ArtworkCard key={artwork.slug} artwork={artwork} variant="catalogue" />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
