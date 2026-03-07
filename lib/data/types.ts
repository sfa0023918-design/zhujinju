export type BilingualText = {
  zh: string;
  en: string;
};

export type ArtworkStatus = "inquiry" | "sold" | "reserved";

export type ProvenanceEntry = {
  label: BilingualText;
  note?: BilingualText;
};

export type ExhibitionReference = {
  title: BilingualText;
  venue: BilingualText;
  year: string;
};

export type PublicationReference = {
  title: BilingualText;
  year: string;
  pages: BilingualText;
  note?: BilingualText;
};

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
  viewingNote: BilingualText;
  comparisonNote: BilingualText;
  provenance: ProvenanceEntry[];
  exhibitions: ExhibitionReference[];
  publications: PublicationReference[];
  inquirySupport: BilingualText[];
  relatedArticleSlugs: string[];
  relatedExhibitionSlugs: string[];
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
  highlightCount: number;
  catalogueTitle: BilingualText;
  catalogueIntro: BilingualText;
  cataloguePages: number;
  curatorialLead: BilingualText;
  relatedArticleSlugs: string[];
  cover: string;
  current?: boolean;
};

export type Article = {
  slug: string;
  title: BilingualText;
  category: BilingualText;
  column: BilingualText;
  author: BilingualText;
  date: string;
  excerpt: BilingualText;
  body: BilingualText[];
  keywords: BilingualText[];
  relatedArtworkSlugs: string[];
  relatedExhibitionSlugs: string[];
  cover: string;
};
