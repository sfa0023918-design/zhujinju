import Link from "next/link";
import { Fragment } from "react";

import { ActionLabel } from "@/components/action-label";
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
      sizes="(min-width: 1100px) 52vw, (min-width: 720px) 60vw, 100vw"
      wrapperClassName={styles.coverImage}
      className={styles.coverImageElement}
    />
  );
}

function ArticleMeta({ article }: { article: Article }) {
  const items = [
    article.date.trim() ? <span key="date">{article.date}</span> : null,
    article.author.zh.trim() || article.author.en.trim() ? (
      <BilingualText
        key="author"
        as="span"
        text={article.author}
        mode="inline"
        zhClassName={styles.inlineZh}
        enClassName={styles.inlineEn}
      />
    ) : null,
    article.column.zh.trim() || article.column.en.trim() ? (
      <BilingualText
        key="column"
        as="span"
        text={article.column}
        mode="inline"
        zhClassName={styles.inlineZh}
        enClassName={styles.inlineEn}
      />
    ) : null,
  ].filter(Boolean);

  return (
    <div className={styles.metaLine}>
      {items.map((item, index) => (
        <Fragment key={index}>
          {index > 0 ? <span className={styles.metaDivider} aria-hidden="true" /> : null}
          {item}
        </Fragment>
      ))}
    </div>
  );
}

function collapsedExcerptClass(index: number) {
  if (index === 0) {
    return "max-h-[10.5rem] md:max-h-[11rem]";
  }

  if (index < 3) {
    return "max-h-[8.8rem] md:max-h-[9.4rem]";
  }

  return "max-h-[7.2rem] md:max-h-[7.8rem]";
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
    <article className={styles.card} data-layout={index === 0 ? "lead" : index < 3 ? "paired" : "index"}>
      <Link href={href} className={styles.cardMedia} aria-label={article.title.zh}>
        <JournalCover article={article} priority={index === 0} />
      </Link>
      <div className={styles.cardCopy}>
        <BilingualText
          as="p"
          text={article.category}
          mode="inline"
          className={styles.kicker}
          zhClassName={styles.inlineZh}
          enClassName={styles.inlineEn}
        />
        <Link href={href} className={styles.titleLink}>
          <BilingualText
            as="h2"
            text={article.title}
            className={styles.cardTitle}
            zhClassName={styles.zh}
            enClassName={styles.en}
          />
        </Link>
        <div className={styles.expandableExcerpt}>
          <ExpandableBilingualCopy
            text={excerpt}
            collapsedClassName={collapsedExcerptClass(index)}
            zhClassName={styles.zh}
            enClassName={styles.en}
          />
        </div>
        <div className={styles.cardFooter}>
          <ArticleMeta article={article} />
          <Link href={href} className={styles.readLink}>
            <ActionLabel text={readAction} align="start" />
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
            as="p"
            text={pageCopy.journal.hero.eyebrow}
            mode="inline"
            className={styles.kicker}
            zhClassName={styles.inlineZh}
            enClassName={styles.inlineEn}
          />
          <BilingualText
            as="h1"
            text={pageCopy.journal.hero.title}
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
