import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";

import { ActionLabel } from "@/components/action-label";
import { ArticleReadingContent } from "@/components/article-reading-content";
import { BilingualText } from "@/components/bilingual-text";
import { HistoryBackLink } from "@/components/history-back-link";
import { MediaPlaceholder } from "@/components/media-placeholder";
import { ProtectedImage } from "@/components/protected-image";
import { getAdminSession } from "@/lib/admin-auth";
import { getArticleDisplayExcerpt, getRenderableArticleContentBlocks, resolveArticleCover } from "@/lib/article-content";
import { withImageVersion } from "@/lib/image-url";
import { buildMetadata } from "@/lib/metadata";
import type { Article } from "@/lib/site-data";
import {
  getArticleBySlug,
  getExhibitionsBySlugs,
  getHighlightedArtworks,
  getPublicArticles,
  loadSiteContent,
} from "@/lib/site-data";

import styles from "../journal.module.css";

type ArticleDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    preview?: string;
  }>;
};

export async function generateStaticParams() {
  const content = await loadSiteContent();

  return getPublicArticles(content).map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
  searchParams,
}: ArticleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const query = (await searchParams) ?? {};
  const content = await loadSiteContent();
  const includeDrafts = query.preview === "1" ? Boolean(await getAdminSession()) : false;
  const article = getArticleBySlug(content, slug, { includeDrafts });

  if (!article) {
    return buildMetadata({
      title: content.pageCopy.articleDetail.errorTitle,
      description: content.pageCopy.articleDetail.errorDescription,
      path: "/journal",
      site: content.siteConfig,
    });
  }

  return buildMetadata({
    title: article.title,
    description: getArticleDisplayExcerpt(article),
    path: `/journal/${article.slug}`,
    type: "article",
    site: content.siteConfig,
  });
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

function ArticleCover({ article }: { article: Article }) {
  const cover = resolveArticleCover(article);

  if (!cover || cover.startsWith("/api/placeholder/")) {
    return <MediaPlaceholder eyebrow="Journal Image" title={article.title.zh} />;
  }

  return (
    <ProtectedImage
      src={withImageVersion(cover)}
      alt={`${article.title.zh} ${article.title.en}`}
      width={1600}
      height={1200}
      priority
      unoptimized
      wrapperClassName={styles.coverImage}
      className={styles.coverImageElement}
    />
  );
}

export default async function ArticleDetailPage({ params, searchParams }: ArticleDetailPageProps) {
  const { slug } = await params;
  const query = (await searchParams) ?? {};
  const content = await loadSiteContent();
  const includeDrafts = query.preview === "1" ? Boolean(await getAdminSession()) : false;
  const article = getArticleBySlug(content, slug, { includeDrafts });

  if (!article) {
    notFound();
  }

  const relatedExhibitions = getExhibitionsBySlugs(content, article.relatedExhibitionSlugs);
  const relatedArtworks = getHighlightedArtworks(content, article.relatedArtworkSlugs);
  const detailCopy = content.pageCopy.articleDetail;
  const blocks = getRenderableArticleContentBlocks(article);
  const excerpt = getArticleDisplayExcerpt(article);

  return (
    <div className={styles.journalShell}>
      <div className={styles.backRow}>
        <HistoryBackLink fallbackHref="/journal" className={styles.backLink}>
          <ActionLabel text={detailCopy.backAction} align="start" />
        </HistoryBackLink>
      </div>

      <article className={styles.detailArticle}>
        <header className={styles.detailHeader}>
          <BilingualText
            as="p"
            text={article.category}
            mode="inline"
            className={styles.kicker}
            zhClassName={styles.inlineZh}
            enClassName={styles.inlineEn}
          />
          <BilingualText
            as="h1"
            text={article.title}
            className={styles.detailTitle}
            zhClassName={styles.zh}
            enClassName={styles.en}
          />
          <ArticleMeta article={article} />
          <div className={styles.keywords}>
            {article.keywords
              .filter((keyword) => keyword.zh.trim() || keyword.en.trim())
              .map((keyword) => (
                <span key={`${keyword.zh}-${keyword.en}`}>{keyword.zh || keyword.en}</span>
              ))}
          </div>
        </header>

        <div className={styles.detailCover}>
          <ArticleCover article={article} />
        </div>

        <ArticleReadingContent className={styles.readingFrame} excerpt={excerpt} blocks={blocks} />

        {relatedExhibitions.length || relatedArtworks.length ? (
          <section className={styles.related}>
            {relatedExhibitions.length ? (
              <div>
                <BilingualText
                  as="h2"
                  text={detailCopy.relatedExhibitions}
                  mode="inline"
                  className={styles.relatedTitle}
                  zhClassName={styles.inlineZh}
                  enClassName={styles.inlineEn}
                />
                {relatedExhibitions.map((exhibition) => (
                  <Link key={exhibition.slug} href={`/exhibitions/${exhibition.slug}`} className={styles.relatedLink}>
                    <BilingualText
                      as="span"
                      text={exhibition.title}
                      className={styles.relatedLinkText}
                      zhClassName={styles.zh}
                      enClassName={styles.en}
                    />
                  </Link>
                ))}
              </div>
            ) : null}
            {relatedArtworks.length ? (
              <div>
                <BilingualText
                  as="h2"
                  text={detailCopy.relatedWorks}
                  mode="inline"
                  className={styles.relatedTitle}
                  zhClassName={styles.inlineZh}
                  enClassName={styles.inlineEn}
                />
                {relatedArtworks.map((artwork) => (
                  <Link key={artwork.slug} href={`/collection/${artwork.slug}`} className={styles.relatedLink}>
                    <BilingualText
                      as="span"
                      text={artwork.title}
                      className={styles.relatedLinkText}
                      zhClassName={styles.zh}
                      enClassName={styles.en}
                    />
                  </Link>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}
      </article>
    </div>
  );
}
