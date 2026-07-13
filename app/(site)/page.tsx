import Link from "next/link";

import { ProtectedImage } from "@/components/protected-image";
import { getArtworkStatusText } from "@/lib/bilingual";
import { resolveArtworkPrimaryImage, withImageVersion } from "@/lib/image-url";
import {
  getCurrentExhibition,
  getFeaturedArtworks,
  loadSiteContent,
  type Artwork,
  type BilingualText as BilingualValue,
} from "@/lib/site-data";

import styles from "./home.module.css";

type BilingualPairProps = {
  text: BilingualValue;
  className?: string;
};

const archiveEntryCopy = { zh: "往期展览", en: "Exhibition Archive" };
const worksSectionCopy = { zh: "部分藏品赏析", en: "Selected Highlights" };

function BilingualPair({ text, className = "" }: BilingualPairProps) {
  return (
    <span className={`${styles.bilingualPair} ${className}`}>
      <span className={styles.zh}>{text.zh}</span>
      <span className={styles.en}>{text.en}</span>
    </span>
  );
}

function HomeAction({ href, text }: { href: string; text: BilingualValue }) {
  return (
    <Link href={href} className={styles.action}>
      <BilingualPair text={text} />
    </Link>
  );
}

function HomeArtwork({ artwork, priority }: { artwork: Artwork; priority: boolean }) {
  const image = resolveArtworkPrimaryImage(artwork);
  const status = getArtworkStatusText(artwork.status);

  return (
    <article className={styles.artwork}>
      <Link href={`/collection/${artwork.slug}`} className={styles.artworkLink}>
        <div className={styles.artworkImageFrame}>
          <ProtectedImage
            src={withImageVersion(image)}
            alt={`${artwork.title.zh} ${artwork.title.en}`}
            width={960}
            height={1200}
            priority={priority}
            quality={84}
            sizes="(min-width: 1024px) 42vw, (min-width: 768px) 44vw, 100vw"
            wrapperClassName={styles.artworkImageWrapper}
            className={styles.artworkImage}
          />
        </div>
        <div className={styles.artworkInfo}>
          <div className={styles.artworkMeta}>
            <BilingualPair text={artwork.period} className={styles.period} />
            <BilingualPair text={status} className={styles.status} />
          </div>
          <BilingualPair text={artwork.title} className={styles.artworkTitle} />
        </div>
      </Link>
    </article>
  );
}

export default async function HomePage() {
  const content = await loadSiteContent();
  const { brandIntro, homeContent } = content;
  const exhibition = getCurrentExhibition(content);
  const exhibitionImage = exhibition
    ? exhibition.coverAsset?.card ?? exhibition.cover
    : "";
  const featuredArtworks = getFeaturedArtworks(content);
  const focusCopy = exhibition?.current
    ? homeContent.focusCurrent
    : homeContent.focusRecent;
  const heroTitleLines = homeContent.heroTitle.zh
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className={styles.home}>
      <section className={`${styles.section} ${styles.hero}`}>
        <div className={styles.heroGrid}>
          <div className={styles.heroImageFrame}>
            <ProtectedImage
              src={brandIntro.heroImage ?? "/api/placeholder/home-hero?kind=landscape"}
              alt={`${brandIntro.heroAlt?.zh ?? "竹瑾居首页主视觉"} ${brandIntro.heroAlt?.en ?? "Zhu Jin Ju homepage hero"}`}
              width={1600}
              height={1080}
              priority
              quality={85}
              sizes="(min-width: 1024px) 58vw, 100vw"
              wrapperClassName={styles.heroImageWrapper}
              className={styles.heroImage}
            />
          </div>
          <div className={styles.heroCopy}>
            <BilingualPair text={homeContent.heroEyebrow} className={styles.eyebrow} />
            <div className={styles.heroTitleGroup}>
              <h1 className={styles.heroTitle}>
                {(heroTitleLines.length > 0 ? heroTitleLines : [homeContent.heroTitle.zh]).map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </h1>
              <p className={styles.heroTitleEn}>{homeContent.heroTitle.en}</p>
            </div>
            <div className={styles.actions}>
              <HomeAction href="/collection" text={homeContent.heroPrimaryAction} />
              <HomeAction href="/exhibitions" text={homeContent.heroSecondaryAction} />
            </div>
          </div>
        </div>
      </section>

      {exhibition ? (
        <section className={`${styles.section} ${styles.exhibition}`}>
          <div className={styles.exhibitionGrid}>
            <div className={styles.exhibitionImageFrame}>
              <ProtectedImage
                src={exhibitionImage}
                alt={`${exhibition.title.zh} ${exhibition.title.en}`}
                width={1600}
                height={1000}
                quality={86}
                sizes="(min-width: 1024px) 62vw, 100vw"
                wrapperClassName={styles.exhibitionImageWrapper}
                className={styles.exhibitionImage}
              />
            </div>
            <div className={styles.exhibitionCopy}>
              <BilingualPair text={focusCopy.eyebrow} className={styles.eyebrow} />
              <h2 className={styles.exhibitionHeading}>
                <BilingualPair text={exhibition.title} className={styles.exhibitionTitle} />
              </h2>
              <div className={styles.exhibitionFacts}>
                <BilingualPair text={exhibition.period} className={styles.fact} />
                <BilingualPair text={exhibition.venue} className={styles.fact} />
              </div>
              <div className={styles.actions}>
                <HomeAction
                  href={`/exhibitions/${exhibition.slug}`}
                  text={homeContent.focusAction}
                />
                <HomeAction href="/exhibitions" text={archiveEntryCopy} />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className={`${styles.section} ${styles.works}`}>
        <div className={styles.sectionHeading}>
          <h2>{worksSectionCopy.zh}</h2>
          <p>{worksSectionCopy.en}</p>
        </div>
        <div className={styles.artworksGrid}>
          {featuredArtworks.slice(0, 4).map((artwork, index) => (
            <HomeArtwork key={artwork.slug} artwork={artwork} priority={index < 2} />
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.contact}`}>
        <BilingualPair text={homeContent.contact.eyebrow} className={styles.contactLabel} />
        <HomeAction href="/contact" text={homeContent.contactPrimaryAction} />
      </section>
    </div>
  );
}
