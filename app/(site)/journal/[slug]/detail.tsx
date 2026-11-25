import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  V3ArticleDetail,
  V3ExhibitionEditorial,
} from "@/components/v3/v3-journal";
import { getAdminSession } from "@/lib/admin-auth";
import {
  getArticleDisplayExcerpt,
  resolveArticleCover,
} from "@/lib/article-content";
import { buildMetadata } from "@/lib/metadata";
import {
  getArticleBySlug,
  getExhibitionsBySlugs,
  getHighlightedArtworks,
  getPublicArticles,
  getPublicArtworks,
  loadSiteContent,
} from "@/lib/site-data";

export async function getArticleDetailMetadata(
  slug: string,
  options?: { allowDraftPreview?: boolean },
): Promise<Metadata> {
  const content = await loadSiteContent();
  const includeDrafts = options?.allowDraftPreview
    ? Boolean(await getAdminSession())
    : false;
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
    image: { path: resolveArticleCover(article), alt: article.title },
  });
}

export async function renderArticleDetail(
  slug: string,
  options?: { allowDraftPreview?: boolean },
) {
  const content = await loadSiteContent();
  const includeDrafts = options?.allowDraftPreview
    ? Boolean(await getAdminSession())
    : false;
  const article = getArticleBySlug(content, slug, { includeDrafts });

  if (!article) {
    notFound();
  }

  const publicArticles = getPublicArticles(content);
  const idx = publicArticles.findIndex((item) => item.slug === article.slug);
  const nextArticle =
    publicArticles.length > 1
      ? publicArticles[((idx >= 0 ? idx : 0) + 1) % publicArticles.length]
      : undefined;

  if (article.editorial) {
    return (
      <V3ExhibitionEditorial
        article={article}
        editorial={article.editorial}
        nextArticle={nextArticle}
      />
    );
  }

  const relatedExhibitions = getExhibitionsBySlugs(
    content,
    article.relatedExhibitionSlugs,
  );
  const relatedArtworks = getHighlightedArtworks(
    content,
    article.relatedArtworkSlugs,
  );
  const publicArtworks = getPublicArtworks(content);
  const artworkIndexMap: Record<string, number> = {};
  publicArtworks.forEach((a, i) => {
    artworkIndexMap[a.slug] = i;
  });

  return (
    <V3ArticleDetail
      article={article}
      nextArticle={nextArticle}
      relatedWorks={relatedArtworks}
      relatedExhibitions={relatedExhibitions}
      artworkIndexMap={artworkIndexMap}
    />
  );
}
