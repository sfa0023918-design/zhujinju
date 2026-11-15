import Link from "next/link";
import type { Article, Exhibition, PageCopyContent } from "@/lib/site-data";
import {
  COVER_VAJRA_CLIP,
  COVER_VAJRA_IMAGE,
} from "@/lib/artwork-presentation";
import { withImageVersion } from "@/lib/image-url";
import { ProtectedImage } from "./protected-image";
import { ContemporaryReading } from "./contemporary-reading";
import { ExhibitionCatalogueViewer } from "./exhibition-catalogue-viewer";
import { HistoryBackLink } from "./history-back-link";
import styles from "./contemporary-exhibition.module.css";

export function ContemporaryExhibition({
  exhibition: e,
  detailCopy,
  relatedArticles,
  pastExhibitions,
  fallbackWorkCount,
  showBackLink = true,
}: {
  exhibition: Exhibition;
  detailCopy: PageCopyContent["exhibitionDetail"];
  relatedArticles: Article[];
  pastExhibitions: Exhibition[];
  fallbackWorkCount: number;
  showBackLink?: boolean;
}) {
  const seasonal = e.slug === "himalayan-art-2026";
  const pages = e.cataloguePageImages?.filter(Boolean) ?? [];
  const count = e.cataloguePageCount ?? e.cataloguePages ?? pages.length;
  const works = e.featuredWorksCount ?? e.highlightCount ?? fallbackWorkCount;
  const note = e.catalogueNote ?? e.catalogueIntro;
  const introIsHeading =
    e.intro.zh.trim().length <= 4 && e.intro.en.trim().split(/\s+/).length <= 3;
  const preface = introIsHeading ? e.description : [e.intro, ...e.description];
  const article = relatedArticles
    .filter((a) => a.relatedExhibitionSlugs.includes(e.slug))
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const curatorial = e.curatorialNote ?? e.curatorialLead;
  const facts = [
    { zh: "展期", en: "Dates", value: e.period },
    { zh: "地点", en: "Venue", value: e.venue },
    {
      zh: "作品",
      en: "Works",
      value: { zh: `${works} 件`, en: `${works} works` },
    },
    {
      zh: "图录",
      en: "Catalogue",
      value: { zh: `${count} 页`, en: `${count} catalogue pages` },
    },
  ];
  return (
    <div className={styles.exhibition}>
      <section className={`${styles.hero}${seasonal ? "" : ` ${styles.archiveHero}`}`}>
        <div className={styles.heroGrid}>
          {seasonal ? (
            <>
              <div className={styles.wordmarkBlock}>
                <div className={styles.wordmark} aria-hidden="true">
                  <div>HIMA</div>
                  <div>LAYAN</div>
                  <div>ART</div>
                </div>
                <p>喜马拉雅艺术 2026</p>
              </div>
              <div className={styles.vajra}>
                <ProtectedImage
                  src={COVER_VAJRA_IMAGE}
                  alt="五股金刚杵，展览图录封面作品"
                  width={900}
                  height={1198}
                  priority
                  unoptimized
                  sizes="(max-width: 860px) 380px, 650px"
                  className={styles.vajraImage}
                  style={{ clipPath: COVER_VAJRA_CLIP }}
                />
              </div>
            </>
          ) : (
            <ProtectedImage
              src={withImageVersion(e.coverAsset?.hero ?? e.coverAsset?.detail ?? e.cover)}
              alt={`${e.title.zh} 图录封面`}
              width={e.coverAsset?.width ?? 1600}
              height={e.coverAsset?.height ?? 1000}
              priority
              sizes="(max-width: 860px) calc(100vw - 40px), 56vw"
              className={styles.archiveCover}
              wrapperClassName={styles.archiveCoverFrame}
            />
          )}
          <div className={styles.heroCopy}>
            {showBackLink ? (
              <HistoryBackLink
                fallbackHref="/exhibitions"
                className={styles.backLink}
              >
                ← {detailCopy.backAction.zh}
                <span lang="en">{detailCopy.backAction.en}</span>
              </HistoryBackLink>
            ) : null}
            {e.subtitle.zh || e.subtitle.en ? (
              <p className={styles.label}>
                {e.subtitle.zh} <span lang="en">{e.subtitle.en}</span>
              </p>
            ) : null}
            <div>
              <h1>
                {e.title.zh.split("｜").map((part, i, all) => (
                  <span key={i}>
                    {part}
                    {i < all.length - 1 ? "｜" : ""}
                  </span>
                ))}
              </h1>
              <p className={styles.heroEnglish} lang="en">
                {e.title.en}
              </p>
            </div>
            <div className={styles.heroIntro}>
              <p>{note.zh}</p>
              <p lang="en">{note.en}</p>
            </div>
            <div className={styles.actions}>
              {pages.length ? (
                <Link href="#catalogue" className={styles.button}>
                  阅读电子图录 <span lang="en">Read the catalogue</span> →
                </Link>
              ) : null}
              <Link href="#preface" className={styles.textLink}>
                阅读序言 <span lang="en">Read the preface</span> →
              </Link>
            </div>
          </div>
        </div>
        <div className={styles.facts}>
          {facts.map((fact) => (
            <div key={fact.en}>
              <p className={styles.label}>
                {fact.zh} <span lang="en">{fact.en}</span>
              </p>
              <p>{fact.value.zh}</p>
              <p lang="en">{fact.value.en}</p>
            </div>
          ))}
        </div>
      </section>
      <ContemporaryReading
        id="preface"
        title={introIsHeading ? e.intro : { zh: "序", en: "Preface" }}
        content={preface}
        englishLeadSentence
      />
      {curatorial.zh || curatorial.en ? (
        <ContemporaryReading
          title={{ zh: "策展说明", en: "Curatorial Note" }}
          content={curatorial}
        />
      ) : null}
      {pages.length ? (
        <section id="catalogue" className={styles.catalogue}>
          <div className={styles.catalogueFrame}>
            <ExhibitionCatalogueViewer
              title={e.catalogueTitle}
              note={note}
              pages={pages}
              viewMode={e.catalogueViewMode}
            />
          </div>
        </section>
      ) : null}
      {article ? (
        <section className={styles.journal}>
          <Link
            href={`/journal/${article.slug}`}
            className={styles.journalCover}
          >
            <ProtectedImage
              src={withImageVersion(
                article.coverAsset?.detail ??
                  article.coverAsset?.hero ??
                  article.cover,
              )}
              alt={`${article.title.zh} ${article.title.en}`}
              width={article.coverAsset?.width ?? 1600}
              height={article.coverAsset?.height ?? 1792}
              sizes="(max-width: 860px) 100vw, 45vw"
              className={styles.journalImage}
              wrapperClassName={styles.journalImageFrame}
            />
          </Link>
          <div className={styles.journalCopy}>
            <p className={styles.label}>
              {article.category.zh} · {article.date}
              <span lang="en">{article.category.en}</span>
            </p>
            <h2>{article.title.zh}</h2>
            <p className={styles.journalEnglish} lang="en">
              {article.title.en}
            </p>
            <p className={styles.journalExcerpt}>{article.excerpt.zh}</p>
            <p className={styles.journalExcerptEnglish} lang="en">
              {article.excerpt.en}
            </p>
            <div className={styles.actions}>
              <Link
                href={`/journal/${article.slug}`}
                className={styles.textLink}
              >
                阅读全文 <span lang="en">Read the note</span> →
              </Link>
              <Link href="/collection" className={styles.collectionLink}>
                在藏品中查看展出作品{" "}
                <span lang="en">Works in the collection</span> →
              </Link>
            </div>
          </div>
        </section>
      ) : null}
      {relatedArticles.some((item) => item.slug !== article?.slug) ? (
        <nav
          className={styles.otherArticles}
          aria-label={detailCopy.relatedWriting.zh}
        >
          {relatedArticles
            .filter((item) => item.slug !== article?.slug)
            .map((item) => (
              <Link key={item.slug} href={`/journal/${item.slug}`}>
                {item.title.zh}
                <span lang="en">{item.title.en}</span>
              </Link>
            ))}
        </nav>
      ) : null}
      {pastExhibitions.length ? (
        <section className={styles.archive}>
          <div className={styles.archiveInner}>
            <h2>
              往期展览 <span lang="en">Exhibition Archive</span>
            </h2>
            <div className={styles.archiveGrid}>
              {pastExhibitions.map((item) => (
                <Link
                  key={item.slug}
                  href={`/exhibitions/${item.slug}`}
                  className={styles.archiveCard}
                >
                  <ProtectedImage
                    src={withImageVersion(item.coverAsset?.card ?? item.cover)}
                    alt={`${item.title.zh} 图录封面`}
                    width={1600}
                    height={1000}
                    sizes="(max-width: 860px) 100vw, 33vw"
                    className={styles.archiveImage}
                    wrapperClassName={styles.archiveImageFrame}
                  />
                  <h3>{item.title.zh}</h3>
                  <p className={styles.archiveEnglish} lang="en">
                    {item.title.en}
                  </p>
                  <p className={styles.archiveFacts}>
                    {item.period.zh} · {item.venue.zh}
                    <br />
                    {item.featuredWorksCount ?? item.highlightCount} 件重点作品
                    · {item.cataloguePageCount ?? item.cataloguePages} 页图录
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
