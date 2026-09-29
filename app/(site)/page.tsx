import Link from "next/link";

import { DirectionalArrow } from "@/components/directional-arrow";
import { HomeHighlights } from "@/components/home-highlights";
import { ProtectedImage } from "@/components/protected-image";
import {
  getArticleDisplayExcerpt,
  resolveArticleCover,
} from "@/lib/article-content";
import {
  COVER_VAJRA_BACKDROP,
  COVER_VAJRA_CLIP,
  COVER_VAJRA_IMAGE,
  COVER_VAJRA_SLUG,
} from "@/lib/artwork-presentation";
import { getArtworkStatusText } from "@/lib/bilingual";
import { resolveArtworkPrimaryImage, withImageVersion } from "@/lib/image-url";
import {
  getCurrentExhibition,
  getFeaturedArtworks,
  getPublicArticles,
  loadSiteContent,
  type Article,
  type Artwork,
  type BilingualText,
} from "@/lib/site-data";

import styles from "./home.module.css";

function HomeAction({
  href,
  text,
  subtle = false,
  catalogue = false,
}: {
  href: string;
  text: BilingualText;
  subtle?: boolean;
  catalogue?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`${subtle ? styles.textLink : styles.action} ${catalogue ? styles.catalogueLink : ""}`}
    >
      <span>
        {text.zh}
        <small lang="en">{text.en}</small>
      </span>
      <DirectionalArrow />
    </Link>
  );
}

function SectionHeading({
  title,
  href,
  action,
}: {
  title: BilingualText;
  href: string;
  action: BilingualText;
}) {
  return (
    <div className={styles.sectionHeading}>
      <div>
        <h2>{title.zh}</h2>
        <p lang="en">{title.en}</p>
      </div>
      <HomeAction href={href} text={action} subtle />
    </div>
  );
}

function HomeArtwork({ artwork }: { artwork: Artwork }) {
  const isCoverVajra = artwork.slug === COVER_VAJRA_SLUG;
  const image = isCoverVajra
    ? COVER_VAJRA_IMAGE
    : resolveArtworkPrimaryImage(artwork);
  const status = getArtworkStatusText(artwork.status);
  return (
    <article className={styles.artwork}>
      <Link href={`/collection/${artwork.slug}`}>
        <div
          className={styles.artworkImageFrame}
          style={
            isCoverVajra ? { backgroundColor: COVER_VAJRA_BACKDROP } : undefined
          }
        >
          <ProtectedImage
            src={withImageVersion(image)}
            alt={`${artwork.title.zh} ${artwork.title.en}`}
            width={960}
            height={1200}
            quality={84}
            sizes="(min-width: 1100px) 300px, (min-width: 768px) 360px, 300px"
            className={styles.artworkImage}
            style={isCoverVajra ? { clipPath: COVER_VAJRA_CLIP } : undefined}
          />
        </div>
        <div className={styles.artworkInfo}>
          <h3>{artwork.title.zh}</h3>
          <p className={styles.artworkEnglish} lang="en">
            {artwork.title.en}
          </p>
          <p className={styles.artworkPeriod}>
            <span>{artwork.period.zh}</span>
            <span lang="en">{artwork.period.en}</span>
          </p>
          <p className={styles.artworkStatus}>
            <span>{status.zh}</span>
            <span lang="en">{status.en}</span>
          </p>
        </div>
      </Link>
    </article>
  );
}

function ReadingMeta({ article }: { article: Article }) {
  return (
    <div className={styles.readingMeta}>
      <time dateTime={article.date}>{article.date.replaceAll("-", ".")}</time>
      <DirectionalArrow />
    </div>
  );
}

export default async function HomePage() {
  const content = await loadSiteContent();
  const { brandIntro, homeContent } = content;
  const exhibition = getCurrentExhibition(content);
  const artworks = getFeaturedArtworks(content).slice(0, 4);
  const heroLines = homeContent.heroTitle.zh
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const heroEnglish =
    homeContent.heroTitle.en === "LET THE WORK SPEAK FOR ITSELF"
      ? "Let the work speak for itself"
      : homeContent.heroTitle.en;
  const publicArticles = getPublicArticles(content);
  // Keep one editorial recommendation; all published articles remain in the journal.
  const feature = publicArticles.find((article) => article.slug === "form-and-devotion-2026")
    ?? publicArticles[0];
  const cover = feature ? resolveArticleCover(feature) : "";
  const exhibitionTitle = exhibition?.title.zh.replace(
    /^竹[瑾璟]居\s*[|｜]\s*/,
    "",
  );
  const exhibitionEnglish = exhibition?.title.en.replace(
    /^Zhu\s*Jin\s*Ju\s*[|｜]\s*/i,
    "",
  );

  return (
    <div className={styles.home}>
      <section className={`${styles.wrap} ${styles.hero}`}>
        <div className={styles.heroPicture}>
          <ProtectedImage
            src={
              brandIntro.heroImage ??
              "/api/placeholder/home-hero?kind=landscape"
            }
            alt={`${brandIntro.heroAlt?.zh ?? "竹瑾居首页主视觉"} ${brandIntro.heroAlt?.en ?? "Zhu Jin Ju homepage hero"}`}
            width={1600}
            height={1080}
            priority
            quality={85}
            sizes="(min-width: 1366px) 648px, (min-width: 768px) 55vw, 100vw"
            className={styles.heroImage}
          />
        </div>
        <div className={styles.heroCopy}>
          <h1>
            {heroLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <p className={styles.heroEnglish} lang="en">
            {heroEnglish}
          </p>
          <p className={styles.heroDescription}>
            {homeContent.heroEyebrow.zh}
            <span lang="en">{homeContent.heroEyebrow.en}</span>
          </p>
          <HomeAction
            href="/collection"
            text={{
              zh: homeContent.heroPrimaryAction.zh,
              en: "Explore the collection",
            }}
          />
        </div>
      </section>

      {exhibition ? (
        <section
          className={`${styles.wrap} ${styles.exhibition}`}
          id="exhibition"
        >
          <SectionHeading
            title={{ zh: "近期展览", en: "Recent Exhibition" }}
            href="/exhibitions"
            action={{ zh: "往期展览", en: "Exhibition archive" }}
          />
          <div className={styles.exhibitionGrid}>
            <Link
              href={`/exhibitions/${exhibition.slug}`}
              className={styles.coverLink}
            >
              <ProtectedImage
                src={exhibition.coverAsset?.card ?? exhibition.cover}
                alt={`${exhibition.title.zh} ${exhibition.title.en}`}
                width={1600}
                height={1000}
                quality={86}
                sizes="(min-width: 1366px) 648px, (min-width: 768px) 55vw, 100vw"
                className={styles.cover}
              />
            </Link>
            <div className={styles.exhibitionCopy}>
              <h3>
                {exhibitionTitle?.replace(/\s*\d{4}$/, "")}{" "}
                <span>{exhibitionTitle?.match(/\d{4}$/)?.[0]}</span>
              </h3>
              <p className={styles.exhibitionEnglish} lang="en">
                {exhibitionEnglish}
              </p>
              <div className={styles.exhibitionFacts}>
                <p>
                  {exhibition.period.zh}
                  <span lang="en">{exhibition.period.en}</span>
                </p>
                <p>
                  {exhibition.venue.zh}
                  <span lang="en">{exhibition.venue.en}</span>
                </p>
              </div>
              <div className={styles.exhibitionActions}>
                <HomeAction
                  href={`/exhibitions/${exhibition.slug}`}
                  text={{ zh: "查看展览", en: "View exhibition" }}
                />
                {exhibition.cataloguePages > 0 ? (
                  <HomeAction
                    href={`/exhibitions/${exhibition.slug}#catalogue`}
                    text={{ zh: "阅读电子图录", en: "Read the catalogue" }}
                    catalogue
                  />
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {artworks.length ? (
        <section
          className={`${styles.wrap} ${styles.highlights}`}
          id="highlights"
        >
          <SectionHeading
            title={{ zh: "部分藏品赏析", en: "Selected Highlights" }}
            href="/collection"
            action={{ zh: "全部藏品", en: "View collection" }}
          />
          <HomeHighlights count={artworks.length}>
            {artworks.map((artwork) => (
              <HomeArtwork key={artwork.slug} artwork={artwork} />
            ))}
          </HomeHighlights>
        </section>
      ) : null}

      {feature ? (
        <section className={`${styles.wrap} ${styles.journal}`} id="reading">
          <SectionHeading
            title={{ zh: "文章与动态", en: "Journal" }}
            href="/journal"
            action={{ zh: "更多阅读", en: "Read more" }}
          />
          <div className={styles.journalGrid}>
            <article className={styles.readingFeature}>
              <Link href={`/journal/${feature.slug}`}>
                {cover ? (
                  <div className={styles.readingImage} data-editorial={feature.editorial ? "exhibition" : undefined}>
                    <ProtectedImage
                      src={cover}
                      alt={feature.title.zh}
                      width={900}
                      height={580}
                      sizes="(min-width: 1366px) 540px, (min-width: 768px) 45vw, 100vw"
                      quality={84}
                    />
                  </div>
                ) : null}
                <div>
                  <h3>{feature.title.zh}</h3>
                  <p className={styles.readingEnglish} lang="en">
                    {feature.title.en}
                  </p>
                  <p className={styles.readingExcerpt}>
                    {getArticleDisplayExcerpt(feature).zh}
                  </p>
                  <ReadingMeta article={feature} />
                </div>
              </Link>
            </article>

          </div>
        </section>
      ) : null}

      <section className={`${styles.wrap} ${styles.contact}`}>
        <div>
          <h2>与竹瑾居联系</h2>
          <p lang="en">Contact Zhu Jin Ju</p>
        </div>
        <HomeAction
          href="/contact"
          text={{ zh: "作品洽询与联系", en: "Inquiries & contact" }}
        />
      </section>
    </div>
  );
}
