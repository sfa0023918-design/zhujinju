export type BilingualText = {
  zh: string;
  en: string;
};

export type ArtworkStatus = "inquiry" | "sold" | "reserved";
export type PublicationStatus = "draft" | "published";

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
  id?: string;
  slug: string;
  publicationStatus?: PublicationStatus;
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
  gallery?: string[];
  featured?: boolean;
};

export type Exhibition = {
  slug: string;
  publicationStatus?: PublicationStatus;
  title: BilingualText;
  subtitle: BilingualText;
  period: BilingualText;
  venue: BilingualText;
  intro: BilingualText;
  description: BilingualText[];
  highlightArtworkSlugs: string[];
  highlightCount: number;
  featuredWorksCount?: number;
  catalogueTitle: BilingualText;
  catalogueIntro: BilingualText;
  cataloguePages: number;
  cataloguePageCount?: number;
  catalogueNote?: BilingualText;
  curatorialLead: BilingualText;
  curatorialNote?: BilingualText;
  relatedArticleSlugs: string[];
  cover: string;
  current?: boolean;
};

export type Article = {
  slug: string;
  publicationStatus?: PublicationStatus;
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

export type ContactDetails = {
  email: string;
  phone: string;
  wechat: string;
  whatsapp: string;
  instagram: string;
  pdfRequest: string;
  address: BilingualText;
  replyWindow: BilingualText;
  collaborationNote: BilingualText;
  appointmentNote: BilingualText;
};

export type SiteConfigContent = {
  siteName: BilingualText;
  title: BilingualText;
  description: BilingualText;
  defaultDomain: string;
  protocol: "http" | "https";
  locale: string;
  ogImagePath: string;
  homeIntro: BilingualText;
  about: {
    eyebrow: BilingualText;
    title: BilingualText;
    subtitle: BilingualText;
    body: BilingualText[];
  };
  contactPage: {
    eyebrow: BilingualText;
    title: BilingualText;
    description: BilingualText;
    aside: BilingualText;
    infoLabels: {
      email: BilingualText;
      wechat: BilingualText;
      phoneWhatsapp: BilingualText;
    };
  };
  footer: {
    intro: BilingualText;
    appointment: BilingualText;
    copyrightLabel: BilingualText;
    contactHeading: BilingualText;
    informationHeading: BilingualText;
    collectionLink: BilingualText;
    exhibitionsLink: BilingualText;
    journalLink: BilingualText;
    pdfRequestLabel: BilingualText;
    instagramLabel: BilingualText;
    wechatLabel: BilingualText;
  };
  contact: ContactDetails;
};

export type HomeContent = {
  heroEyebrow: BilingualText;
  heroTitle: BilingualText;
  heroSubtitle: BilingualText;
  heroPrimaryAction: BilingualText;
  heroSecondaryAction: BilingualText;
  focusCurrent: {
    eyebrow: BilingualText;
    description: BilingualText;
  };
  focusRecent: {
    eyebrow: BilingualText;
    description: BilingualText;
  };
  focusSummaryLine: {
    highlightUnit: BilingualText;
    catalogueUnit: BilingualText;
  };
  focusAction: BilingualText;
  selectedWorks: PageIntroCopy;
  collectingDirections: PageIntroCopy;
  operationalFacts: PageIntroCopy;
  contact: PageIntroCopy;
  contactPrimaryAction: BilingualText;
  contactSecondaryAction: BilingualText;
};

export type BrandIntroContent = {
  statement: BilingualText;
  about: BilingualText;
  methodology: BilingualText[];
  heroImage?: string;
  heroAlt?: BilingualText;
};

export type CollectingDirection = {
  name: BilingualText;
  description: BilingualText;
};

export type OperationalFact = {
  title: BilingualText;
  value: BilingualText;
  description: BilingualText;
};

export type PageHeroCopy = {
  eyebrow: BilingualText;
  title: BilingualText;
  description: BilingualText;
  aside?: BilingualText;
};

export type PageIntroCopy = {
  eyebrow: BilingualText;
  title: BilingualText;
  description: BilingualText;
};

export type PageCopyContent = {
  siteChrome: {
    footer: {
      intro: BilingualText;
      appointment: BilingualText;
      copyrightLabel: BilingualText;
      contactHeading: BilingualText;
      informationHeading: BilingualText;
      collectionLink: BilingualText;
      exhibitionsLink: BilingualText;
      journalLink: BilingualText;
      pdfRequestLabel: BilingualText;
      instagramLabel: BilingualText;
      wechatLabel: BilingualText;
    };
    contactForm: {
      introIdle: BilingualText;
      introSubmitting: BilingualText;
      introSuccess: BilingualText;
      introError: BilingualText;
      nameLabel: BilingualText;
      emailLabel: BilingualText;
      organizationLabel: BilingualText;
      roleLabel: BilingualText;
      artworkLabel: BilingualText;
      messageLabel: BilingualText;
      submitLabel: BilingualText;
      submittingLabel: BilingualText;
      roleOptions: BilingualText[];
    };
  };
  home: {
    heroEyebrow: BilingualText;
    heroTitle: BilingualText;
    heroPrimaryAction: BilingualText;
    heroSecondaryAction: BilingualText;
    focusCurrent: {
      eyebrow: BilingualText;
      description: BilingualText;
    };
    focusRecent: {
      eyebrow: BilingualText;
      description: BilingualText;
    };
    focusSummaryLine: {
      highlightUnit: BilingualText;
      catalogueUnit: BilingualText;
    };
    focusAction: BilingualText;
    selectedWorks: PageIntroCopy;
    collectingDirections: PageIntroCopy;
    operationalFacts: PageIntroCopy;
    contact: PageIntroCopy;
    contactPrimaryAction: BilingualText;
    contactSecondaryAction: BilingualText;
  };
  about: {
    hero: PageHeroCopy;
    position: {
      eyebrow: BilingualText;
      title: BilingualText;
      paragraphTwo: BilingualText;
      paragraphThree: BilingualText;
    };
  };
  contact: {
    hero: PageHeroCopy;
    appointmentLine: BilingualText;
    cooperationLine: BilingualText;
    infoLabels: {
      email: BilingualText;
      wechat: BilingualText;
      phoneWhatsapp: BilingualText;
    };
  };
  collection: {
    hero: PageHeroCopy;
    emptyState: BilingualText;
    filters: {
      category: BilingualText;
      region: BilingualText;
      period: BilingualText;
      material: BilingualText;
      actions: BilingualText;
      apply: BilingualText;
      reset: BilingualText;
    };
  };
  artworkDetail: {
    errorTitle: BilingualText;
    errorDescription: BilingualText;
    breadcrumb: BilingualText;
    inquireAction: BilingualText;
    backAction: BilingualText;
    scholarlyNote: BilingualText;
    viewingNote: BilingualText;
    comparisonNote: BilingualText;
    provenance: BilingualText;
    exhibitions: BilingualText;
    publications: BilingualText;
    relatedExhibitions: BilingualText;
    relatedArticles: BilingualText;
    relatedWorks: BilingualText;
    relatedWorksTitle: BilingualText;
    fieldLabels: {
      period: BilingualText;
      regionOrigin: BilingualText;
      material: BilingualText;
      dimensions: BilingualText;
    };
  };
  exhibitions: {
    hero: PageHeroCopy;
    cardLabels: {
      highlightWorks: BilingualText;
      cataloguePages: BilingualText;
      catalogueTitle: BilingualText;
      viewAction: BilingualText;
    };
  };
  exhibitionDetail: {
    errorTitle: BilingualText;
    errorDescription: BilingualText;
    backAction: BilingualText;
    summaryLine: {
      highlightUnit: BilingualText;
      catalogueUnit: BilingualText;
    };
    catalogueNote: BilingualText;
    relatedWriting: BilingualText;
    highlightedWorks: BilingualText;
    highlightedWorksTitle: BilingualText;
  };
  journal: {
    hero: PageHeroCopy;
    readAction: BilingualText;
  };
  articleDetail: {
    errorTitle: BilingualText;
    errorDescription: BilingualText;
    backAction: BilingualText;
    relatedExhibitions: BilingualText;
    relatedWorks: BilingualText;
  };
};

export type SiteContent = {
  siteConfig: SiteConfigContent;
  homeContent: HomeContent;
  pageCopy: PageCopyContent;
  brandIntro: BrandIntroContent;
  collectingDirections: CollectingDirection[];
  operationalFacts: OperationalFact[];
  artworks: Artwork[];
  exhibitions: Exhibition[];
  articles: Article[];
};

export type EditableSectionKey =
  | "siteConfig"
  | "homeContent"
  | "artworks"
  | "exhibitions"
  | "articles";

export type HomeContentEditorValue = {
  intro: BilingualText;
  homeContent: HomeContent;
  collectingDirections: CollectingDirection[];
  operationalFacts: OperationalFact[];
  featuredArtworkIds: string[];
};

export type SiteConfigEditorValue = {
  siteConfig: SiteConfigContent;
  brandIntroHeroImage: string;
  brandIntroHeroAlt: BilingualText;
};

export type EditableSectionValueMap = {
  siteConfig: SiteConfigEditorValue;
  homeContent: HomeContentEditorValue;
  artworks: Artwork[];
  exhibitions: Exhibition[];
  articles: Article[];
};
