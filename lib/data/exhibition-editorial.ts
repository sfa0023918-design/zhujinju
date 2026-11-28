import type { BilingualText } from "./types";

export type EditorialImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
  altEn?: string;
};

export type ExhibitionEditorial = {
  title: BilingualText;
  subtitle: BilingualText;
  eventLine: string;
  eventLineEn?: string;
  cover: EditorialImage;
  prefaceTitle: string;
  prefaceTitleEn?: string;
  prefacePortrait: EditorialImage;
  prefaceLead: string;
  prefaceLeadEn?: string;
  prefaceFirst: string[];
  prefaceFirstEn?: string[];
  prefaceLandscape: EditorialImage;
  prefaceSecond: string[];
  prefaceSecondEn?: string[];
  introduction: string;
  introductionEn?: string;
  chapters: {
    id: string;
    title: BilingualText;
    introduction: string;
    introductionEn?: string;
    tone: "cinnabar" | "plum" | "green";
    image?: EditorialImage;
    works: {
      id: string;
      title: BilingualText;
      period: BilingualText;
      region: BilingualText;
      material: BilingualText;
      technique?: BilingualText;
      dimensions: string;
      dimensionLabel?: "Height" | "Dimensions";
      basicFacts?: BilingualText[];
      records: {
        label: BilingualText;
        lines: string[];
        linesEn?: string[];
        translations?: (string | null)[];
      }[];
      image: EditorialImage;
      detail?: EditorialImage;
      heading: string;
      headingEn?: string;
      paragraphs: string[];
      paragraphsEn?: string[];
      collectionSlug?: string;
    }[];
  }[];
  closingTitle: string;
  closingTitleEn?: string;
  closing: string[];
  closingEn?: string[];
  exhibitionSlug: string;
  event: string[];
  eventEn?: string[];
  eventDetails?: { label: BilingualText; value: BilingualText }[];
  pdf?: string;
  contactImage: EditorialImage;
  contactText: string;
  contactTextEn?: string;
};
