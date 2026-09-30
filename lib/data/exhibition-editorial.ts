import type { BilingualText } from "./types";

export type EditorialImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

export type ExhibitionEditorial = {
  title: BilingualText;
  subtitle: BilingualText;
  eventLine: string;
  cover: EditorialImage;
  prefaceTitle: string;
  prefacePortrait: EditorialImage;
  prefaceLead: string;
  prefaceFirst: string[];
  prefaceLandscape: EditorialImage;
  prefaceSecond: string[];
  introduction: string;
  chapters: {
    id: string;
    title: BilingualText;
    introduction: string;
    tone: "cinnabar" | "plum" | "green";
    image?: EditorialImage;
    works: {
      id: string;
      title: BilingualText;
      period: BilingualText;
      region: BilingualText;
      material: BilingualText;
      dimensions: string;
      basicFacts?: BilingualText[];
      records: { label: BilingualText; lines: string[]; translations?: (string | null)[] }[];
      image: EditorialImage;
      detail?: EditorialImage;
      heading: string;
      paragraphs: string[];
      collectionSlug?: string;
    }[];
  }[];
  closingTitle: string;
  closing: string[];
  exhibitionSlug: string;
  event: string[];
  eventDetails?: { label: BilingualText; value: BilingualText }[];
  pdf?: string;
  contactImage: EditorialImage;
  contactText: string;
};
