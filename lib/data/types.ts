export type ArtworkStatus = "可洽询" | "已售" | "暂留";

export type Artwork = {
  slug: string;
  title: string;
  subtitle: string;
  period: string;
  region: string;
  origin: string;
  material: string;
  category: string;
  dimensions: string;
  status: ArtworkStatus;
  excerpt: string;
  statement: string[];
  provenance: string[];
  exhibitions: string[];
  publications: string[];
  image: string;
  featured?: boolean;
};

export type Exhibition = {
  slug: string;
  title: string;
  subtitle: string;
  period: string;
  venue: string;
  intro: string;
  description: string[];
  highlightArtworkSlugs: string[];
  catalogueTitle: string;
  catalogueIntro: string;
  cover: string;
  current?: boolean;
};

export type Article = {
  slug: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  body: string[];
  cover: string;
};
