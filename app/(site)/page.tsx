import Link from "next/link";

import { HomeArtworkGrid } from "@/components/home-artwork-grid";
import { HomeHero, type HomeHeroSlide } from "@/components/home-hero";
import { HomeAction, HomeArrow, HomeLabel } from "@/components/home-ui";
import { ProtectedImage } from "@/components/protected-image";
import {
  getArticleDisplayExcerpt,
  resolveArticleCover,
} from "@/lib/article-content";
import {
  COVER_VAJRA_CLIP,
  COVER_VAJRA_IMAGE,
} from "@/lib/artwork-presentation";
import { getArtworkStatusText } from "@/lib/bilingual";
import { homeHeroSlides } from "@/lib/data/home-hero-slides";
import { resolveArtworkPrimaryImage, withImageVersion } from "@/lib/image-url";
import {
  getCurrentExhibition,
  getFeaturedArtworks,
  getPublicArticles,
  getPublicArtworks,
  loadSiteContent,
  type BilingualText,
} from "@/lib/site-data";
import styles from "./home.module.css";

function SectionHeading({
  title,
  href,
  action,
  mobileAction,
}: {
  title: BilingualText;
  href: string;
  action: BilingualText;
  mobileAction: string;
}) {
  return (
    <div className={styles.sectionHeading}>
      <div className={styles.headingCopy}>
        <h2>{title.zh}</h2>
        <p lang="en">{title.en}</p>
      </div>
      <HomeAction
        href={href}
        text={action}
        subtle
        className={styles.desktopHeadingAction}
      />
      <Link href={href} className={styles.mobileHeadingAction}>
        <span className={styles.labelZh}>{mobileAction}</span>
        <HomeArrow />
      </Link>
    </div>
  );
}

export default async function HomePage() {
  const content = await loadSiteContent();
  const { homeContent, siteConfig } = content;
  const exhibition = getCurrentExhibition(content);
  const artworks = getFeaturedArtworks(content).slice(0, 4);
  const publicArtworks = getPublicArtworks(content);
  const slides: HomeHeroSlide[] = homeHeroSlides.flatMap((config) => {
    const artwork = publicArtworks.find((work) => work.slug === config.slug);
    if (!artwork) return [];
    const regionPeriod = [artwork.region.zh, artwork.period.zh]
      .filter(Boolean)
      .join("，");
    return [
      {
        slug: artwork.slug,
        title: artwork.title,
        image: withImageVersion(resolveArtworkPrimaryImage(artwork)),
        width: artwork.imageAsset?.width ?? 800,
        height: artwork.imageAsset?.height ?? 1000,
        facts: [regionPeriod, artwork.material.zh, artwork.dimensions.zh]
          .filter(Boolean)
          .join(" · "),
        mobileFacts: regionPeriod,
        status: getArtworkStatusText(artwork.status).zh,
        statusKey: artwork.status,
        background: `linear-gradient(to bottom, ${config.colors.map((color, index) => `${color} ${6 + index * 11}%`).join(", ")})`,
        fade: config.fade,
        imageHeight: config.height,
        topFade: config.topFade ?? false,
        bottomFade: config.bottomFade ?? false,
        lightInk: config.lightInk ?? false,
        shaded: config.shaded ?? false,
        framed: config.framed ?? false,
        imageShift: config.imageShift ?? "0%",
        mobileHeight: config.mobileHeight ?? "100%",
        mobileShift: config.mobileShift ?? "0%",
      },
    ];
  });
  const heroEnglish =
    homeContent.heroTitle.en === "LET THE WORK SPEAK FOR ITSELF"
      ? "Let the work speak for itself"
      : homeContent.heroTitle.en;
  const publicArticles = getPublicArticles(content);
  const feature =
    publicArticles.find(
      (article) => article.slug === "christies-lecture-sonam-gyaltsen-2026",
    ) ?? publicArticles[0];
  const otherArticles = publicArticles
    .filter((article) => article.slug !== feature?.slug)
    .slice(0, 3);
  const featureTitleParts =
    feature?.slug === "form-and-devotion-2026"
      ? feature.title.zh.match(/^(.*?)\s+(.+)$/)
      : null;
  const excerpt = feature ? getArticleDisplayExcerpt(feature) : undefined;
  const exhibitionTitle = exhibition?.title.zh.replace(
    /^竹[瑾璟]居\s*[|｜]\s*/,
    "",
  );
  const exhibitionHref = exhibition
    ? `/exhibitions/${exhibition.slug}`
    : "/exhibitions";
  const workCount =
    exhibition?.featuredWorksCount ?? exhibition?.highlightCount ?? 0;
  const pageCount =
    exhibition?.cataloguePageCount ?? exhibition?.cataloguePages ?? 0;

  return (
    <div className={`${styles.home} zj`}>
      <HomeHero slides={slides}>
        <HomeLabel text={homeContent.heroEyebrow} stacked />
        <h1>{homeContent.heroTitle.zh.replace(/\n/g, "")}</h1>
        <p className={styles.heroEnglish} lang="en">
          {heroEnglish}
        </p>
        <div className={styles.heroActions}>
          <HomeAction
            href="/collection"
            text={{
              zh: homeContent.heroPrimaryAction.zh,
              en: "Explore the collection",
            }}
          />
          <HomeAction
            href={exhibitionHref}
            text={homeContent.heroSecondaryAction}
            subtle
            arrow={false}
            className={styles.heroSecondary}
          />
        </div>
      </HomeHero>

      <section id="about" className={`${styles.wrap} ${styles.statement}`}>
        <div className={styles.statementGrid}>
          <HomeLabel
            text={{ zh: "竹瑾居", en: "Zhu Jin Ju, Chengdu" }}
            stacked
            muted
          />
          <div className={styles.statementCopy}>
            <p className={styles.statementZh}>{siteConfig.homeIntro.zh}</p>
            <p className={styles.statementEn} lang="en">
              {siteConfig.homeIntro.en}
            </p>
            <HomeAction href="/about" text={siteConfig.about.title} subtle />
          </div>
        </div>
      </section>

      {exhibition ? (
        <section id="exhibition" className={styles.exhibition}>
          <div className={`${styles.wrap} ${styles.exhibitionTop}`}>
            <HomeLabel text={{ zh: "近期展览", en: "Recent Exhibition" }} />
            <Link href="/exhibitions" className={styles.archiveLink}>
              <HomeLabel text={{ zh: "往期展览", en: "Exhibition archive" }} />
              <HomeArrow />
            </Link>
          </div>
          <div className={`${styles.wrap} ${styles.exhibitionGrid}`}>
            <div className={styles.exhibitionGraphic}>
              <div className={styles.wordmark} aria-label="Himalayan Art">
                <div>Hima</div>
                <div>layan</div>
                <div>Art</div>
              </div>
              <div className={styles.wordmarkCaption}>{exhibitionTitle}</div>
            </div>
            <ProtectedImage
              src={COVER_VAJRA_IMAGE}
              alt="五股金刚杵，展览图录封面作品"
              width={900}
              height={1198}
              sizes="(max-width: 860px) 353px, 541px"
              quality={86}
              wrapperClassName={styles.vajraFrame}
              className={styles.vajra}
              style={{ clipPath: COVER_VAJRA_CLIP }}
            />
            <div className={styles.exhibitionCopy}>
              <div className={styles.exhibitionHeading}>
                <HomeLabel
                  text={{ zh: "专题展览", en: "Special Exhibition" }}
                />
                <h2>{exhibitionTitle}</h2>
                <p lang="en">{exhibition.title.en}</p>
              </div>
              <dl className={styles.exhibitionFacts}>
                <div>
                  <dt>
                    <HomeLabel text={{ zh: "展期", en: "Dates" }} stacked />
                  </dt>
                  <dd>
                    {exhibition.period.zh}
                    <span className={styles.desktopFact} lang="en">
                      {exhibition.period.en}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>
                    <HomeLabel text={{ zh: "地点", en: "Venue" }} stacked />
                  </dt>
                  <dd>
                    {exhibition.venue.zh}
                    <span className={styles.venueEnglish} lang="en">
                      {exhibition.venue.en}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>
                    <HomeLabel text={{ zh: "图录", en: "Catalogue" }} stacked />
                  </dt>
                  <dd>
                    {workCount} 件作品 · {pageCount} 页图录
                    <span className={styles.desktopFact} lang="en">
                      {workCount} works · {pageCount} catalogue pages
                    </span>
                  </dd>
                </div>
              </dl>
              <div className={styles.exhibitionActions}>
                <HomeAction
                  href={exhibitionHref}
                  text={{ zh: "查看展览", en: "View exhibition" }}
                />
                {pageCount > 0 ? (
                  <HomeAction
                    href={`${exhibitionHref}#catalogue`}
                    text={{ zh: "阅读电子图录", en: "Read the catalogue" }}
                    subtle
                    arrow={false}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {artworks.length ? (
        <section
          id="highlights"
          className={`${styles.wrap} ${styles.highlights}`}
        >
          <SectionHeading
            title={{ zh: "部分藏品赏析", en: "Selected Highlights" }}
            href="/collection"
            action={{
              zh: "全部藏品",
              en: `View collection · ${publicArtworks.length}`,
            }}
            mobileAction={`全部 ${publicArtworks.length}`}
          />
          <HomeArtworkGrid artworks={artworks} />
        </section>
      ) : null}

      {feature ? (
        <section id="journal" className={styles.journal}>
          <div className={`${styles.wrap} ${styles.journalInner}`}>
            <SectionHeading
              title={{ zh: "文章与动态", en: "Journal" }}
              href="/journal"
              action={{ zh: "更多阅读", en: "Read more" }}
              mobileAction="更多"
            />
            <div className={styles.journalGrid}>
              <Link
                href={`/journal/${feature.slug}`}
                className={styles.featureImage}
              >
                <ProtectedImage
                  src={withImageVersion(resolveArticleCover(feature))}
                  alt={feature.title.zh}
                  width={feature.coverAsset?.width ?? 1600}
                  height={feature.coverAsset?.height ?? 1792}
                  sizes="(max-width: 860px) 100vw, 42vw"
                  quality={84}
                  wrapperClassName={styles.featureImageFrame}
                  className={styles.featureCover}
                />
              </Link>
              <Link
                href={`/journal/${feature.slug}`}
                className={styles.featureCopy}
              >
                <div className={styles.featureMeta}>
                  <span className={styles.labelZh}>
                    {feature.category.zh} ·{" "}
                    <time dateTime={feature.date}>
                      {feature.date.replaceAll("-", ".")}
                    </time>
                  </span>
                  <span
                    className={`${styles.labelEn} ${styles.muted}`}
                    lang="en"
                  >
                    {feature.category.en}
                  </span>
                </div>
                <h3>
                  {featureTitleParts ? (
                    <>
                      {featureTitleParts[1]}
                      <br className={styles.desktopOnly} />
                      <span className={styles.mobileTitleSpace}> </span>
                      {featureTitleParts[2]}
                    </>
                  ) : (
                    feature.title.zh
                  )}
                </h3>
                <p className={styles.featureEnglish} lang="en">
                  {feature.title.en}
                </p>
                <p className={styles.featureExcerpt}>{excerpt?.zh}</p>
                <p className={styles.featureExcerptEn} lang="en">
                  {excerpt?.en}
                </p>
                <span className={styles.textLink}>
                  <span>
                    阅读全文<small lang="en">Read</small>
                  </span>
                  <HomeArrow />
                </span>
              </Link>
              <div className={styles.articleList}>
                {otherArticles.map((article) => (
                  <Link
                    href={`/journal/${article.slug}`}
                    className={styles.articleItem}
                    key={article.slug}
                  >
                    <ProtectedImage
                      src={withImageVersion(resolveArticleCover(article))}
                      alt={article.title.zh}
                      width={500}
                      height={400}
                      quality={84}
                      sizes="(max-width: 860px) 112px, 200px"
                      wrapperClassName={styles.articleImage}
                      className={styles.articleThumbnail}
                      style={{
                        objectPosition:
                          article.slug ===
                          "christies-lecture-sonam-gyaltsen-2026"
                            ? "78% 50%"
                            : article.slug === "article-1773838559083"
                              ? "62% 50%"
                              : "50% 50%",
                      }}
                    />
                    <span className={styles.articleCopy}>
                      <span className={styles.articleMeta}>
                        {article.category.zh} ·{" "}
                        <time dateTime={article.date}>
                          {article.date.replaceAll("-", ".")}
                        </time>
                      </span>
                      <span className={styles.articleTitle}>
                        {article.title.zh}
                      </span>
                      <span className={styles.articleEnglish} lang="en">
                        {article.title.en}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
