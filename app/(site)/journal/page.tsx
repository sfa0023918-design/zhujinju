import Link from "next/link";

import { DirectionalArrow } from "@/components/directional-arrow";
import { BilingualText } from "@/components/bilingual-text";
import { ExpandableBilingualCopy } from "@/components/expandable-bilingual-copy";
import { MediaPlaceholder } from "@/components/media-placeholder";
import { ProtectedImage } from "@/components/protected-image";
import { getArticleDisplayExcerpt, resolveArticleCover } from "@/lib/article-content";
import { bt } from "@/lib/bilingual";
import { withImageVersion } from "@/lib/image-url";
import { buildMetadata } from "@/lib/metadata";
import type { Article, BilingualText as BilingualValue } from "@/lib/site-data";
import { getPublicArticles, loadSiteContent } from "@/lib/site-data";

import styles from "./journal.module.css";

export async function generateMetadata() {
  const { siteConfig, pageCopy } = await loadSiteContent();

  return buildMetadata({
    title: bt("文章与动态", "Journal"),
    description: pageCopy.journal.hero.description,
    path: "/journal",
    site: siteConfig,
  });
}

function JournalCover({ article, priority = false }: { article: Article; priority?: boolean }) {
  const cover = resolveArticleCover(article);

  if (!cover || cover.startsWith("/api/placeholder/")) {
    return <MediaPlaceholder eyebrow="Journal Image" title={article.title.zh} />;
  }

  return (
    <ProtectedImage
      src={withImageVersion(cover)}
      alt={`${article.title.zh} ${article.title.en}`}
      width={1400}
      height={1050}
      priority={priority}
      quality={84}
      sizes={priority
        ? "(min-width: 1480px) 650px, (min-width: 681px) 46vw, 100vw"
        : "(min-width: 1480px) 445px, (min-width: 1100px) 31vw, (min-width: 681px) 46vw, 100vw"}
      wrapperClassName={styles.coverImage}
      className={styles.coverImageElement}
    />
  );
}

function ArticleCard({
  article,
  index,
  readAction,
}: {
  article: Article;
  index: number;
  readAction: BilingualValue;
}) {
  const href = `/journal/${article.slug}`;
  const excerpt = getArticleDisplayExcerpt(article);

  return (
    <article className={styles.card} data-layout={index === 0 ? "lead" : "regular"} data-editorial={article.editorial ? "exhibition" : undefined}>
      <Link href={href} className={styles.cardMedia} aria-label={article.title.zh}>
        <JournalCover article={article} priority={index === 0} />
      </Link>
      <div className={styles.cardCopy}>
        <Link href={href} className={styles.titleLink}>
          <BilingualText
            as="h2"
            text={article.title}
            className={styles.cardTitle}
            zhClassName={styles.zh}
            enClassName={styles.en}
          />
        </Link>
        <div className={styles.cardInfo}>
          {article.date.trim() ? <time dateTime={article.date}>{article.date}</time> : null}
          <BilingualText
            as="span"
            text={article.category}
            mode="inline"
            className={styles.cardCategory}
            zhClassName={styles.inlineZh}
            enClassName={styles.inlineEn}
          />
        </div>
        <div className={styles.expandableExcerpt}>
          <ExpandableBilingualCopy
            text={excerpt}
            collapsedClassName={index === 0 ? "max-h-[10.5rem] md:max-h-[11rem]" : "max-h-[8.8rem] md:max-h-[9.4rem]"}
            zhClassName={styles.zh}
            enClassName={styles.en}
          />
        </div>
        <div className={styles.cardFooter}>
          <Link href={href} className={styles.readLink}>
            <span>{readAction.zh}<small lang="en">{readAction.en}</small></span>
            <DirectionalArrow />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function JournalPage() {
  const content = await loadSiteContent();
  const articles = getPublicArticles(content);
  const { pageCopy } = content;

  return (
    <div className={styles.journalShell}>
      <section className={styles.indexHero}>
        <div>
          <BilingualText
            as="h1"
            text={bt("文章与动态", "Journal")}
            className={styles.pageTitle}
            zhClassName={styles.zh}
            enClassName={styles.en}
          />
        </div>
        <BilingualText
          as="div"
          text={pageCopy.journal.hero.description}
          className={styles.heroDescription}
          zhClassName={styles.zh}
          enClassName={styles.en}
        />
      </section>

      <section className={styles.articleGrid} aria-label={pageCopy.journal.hero.title.zh}>
        {articles.map((article, index) => (
          <ArticleCard
            key={article.slug}
            article={article}
            index={index}
            readAction={pageCopy.journal.readAction}
          />
        ))}
      </section>
    </div>
  );
}
