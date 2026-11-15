// Presentation only: original images, titles and sales states come from site data.
// Background samples follow each photograph's left edge at its displayed scale.
type HomeHeroConfig = {
  slug: string;
  fade: string;
  height: string;
  colors: readonly string[];
  topFade?: boolean;
  bottomFade?: boolean;
  lightInk?: boolean;
  shaded?: boolean;
  framed?: boolean;
  imageShift?: string;
  mobileHeight?: string;
  mobileShift?: string;
};

export const homeHeroSlides: readonly HomeHeroConfig[] = [
  {
    slug: "artwork-1773412663200", // 世尊观音
    fade: "12%",
    height: "96%",
    topFade: true,
    bottomFade: true,
    lightInk: true,
    shaded: true,
    colors: [
      "#886545", "#8b6848", "#8e6a48", "#906c4a", "#906c4a",
      "#906c4a", "#8e6a4a", "#896646", "#ad927f",
    ],
  },
  {
    slug: "artwork-1790512216778", // 释迦牟尼
    fade: "10%",
    height: "96%",
    topFade: true,
    colors: [
      "#e2bc78", "#e3be7d", "#e3be7c", "#e4bd78", "#e4bd77",
      "#e3bd77", "#dfb565", "#e2b662", "#f1cd8c",
    ],
  },
  {
    slug: "artwork-1790500845359", // 说法文殊
    fade: "12%",
    height: "132%",
    imageShift: "10%",
    mobileHeight: "132%",
    mobileShift: "-2%",
    colors: [
      "#e4c6a2", "#e5c8a8", "#e6c8a6", "#e4c6a2", "#e2c4a0",
      "#ddbd97", "#d4b48e", "#e0c5a7", "#dec3a6",
    ],
  },
  {
    slug: "artwork-1790513079613", // 扎巴坚赞
    fade: "8%",
    height: "100%",
    colors: [
      "#b78fab", "#b891ae", "#b591ae", "#b690b2", "#b892b5",
      "#bd99ba", "#c7a5c0", "#cbacc6", "#c7adc7",
    ],
  },
  {
    slug: "artwork-1790510327321", // 大轮金刚手曼荼罗唐卡
    fade: "0%",
    height: "80%",
    framed: true,
    lightInk: true,
    // A quiet blue-grey drawn from the painting; preserve every painted edge.
    colors: ["#303d44", "#303d44", "#303d44", "#303d44", "#303d44",
      "#303d44", "#303d44", "#303d44", "#303d44"],
  },
];
