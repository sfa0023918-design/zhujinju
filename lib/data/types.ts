export type BilingualText = {
  zh: string;
  en: string;
};

export type ArtworkStatus = "inquiry" | "sold" | "reserved";

export type Artwork = {
  slug: string;
  title: BilingualText;
  subtitle: BilingualText;
  period: BilingualText;
  region: BilingualText;
  origin: BilingualText;
  material: BilingualText;
  category: BilingualText;
  dimensions: BilingualText;
  status: ArtworkStatus;
  excerpt: BilingualText;
  statement: BilingualText[];
  provenance: BilingualText[];
  exhibitions: BilingualText[];
  publications: BilingualText[];
  image: string;
  featured?: boolean;
};

export type Exhibition = {
  slug: string;
  title: BilingualText;
  subtitle: BilingualText;
  period: BilingualText;
  venue: BilingualText;
  intro: BilingualText;
  description: BilingualText[];
  highlightArtworkSlugs: string[];
  catalogueTitle: BilingualText;
  catalogueIntro: BilingualText;
  cover: string;
  current?: boolean;
};

export type Article = {
  slug: string;
  title: BilingualText;
  category: BilingualText;
  date: string;
  excerpt: BilingualText;
  body: BilingualText[];
  cover: string;
};
