import type { Exhibition } from "./types";

export const exhibitions: Exhibition[] = [
  {
    slug: "silent-radiance",
    title: "寂照：喜马拉雅造像与图像的观看",
    subtitle: "专题展览",
    period: "2025.10.18 - 2025.12.28",
    venue: "竹瑾居 · 上海预约制空间",
    intro:
      "以造像与绘画并置的方式重新建立观看路径，讨论图像秩序、材质语汇与近距离观察的重要性。",
    description: [
      "展览以“观看方式”而非年代排序为结构核心，将铜造像、唐卡与工艺器物放在同一叙事之中，强调作品之间的呼应。",
      "重点作品围绕观音、释迦牟尼与护法图像展开，既关注图像学，也关注物质与工艺的细部判断。",
      "配套图录整理了作品基础信息、参考对照与简要研究摘要，构成后续持续扩展的研究框架。",
    ],
    highlightArtworkSlugs: [
      "ekadasamukha-avalokiteshvara",
      "shakyamuni-bhumisparsha",
      "vajrapani-thangka",
    ],
    catalogueTitle: "《寂照》展览图录",
    catalogueIntro: "收录 18 件重点作品，附研究短文与图像索引。",
    cover: "/api/placeholder/silent-radiance?kind=landscape",
    current: true,
  },
  {
    slug: "between-gilding-and-pigment",
    title: "金铜之间：十三至十八世纪藏传佛教艺术",
    subtitle: "研究型展览",
    period: "2024.05.12 - 2024.07.30",
    venue: "竹瑾居 · 上海",
    intro:
      "从金铜造像到设色唐卡，讨论材质与图像如何共同塑造宗教艺术的观看经验。",
    description: [
      "展览以材质为切入点，将造像、绘画与器物纳入同一条研究线索，尝试打破常见的门类分割。",
      "策展重点不在数量，而在作品之间的风格差异与工艺共性，从而让观者建立更清晰的比较能力。",
      "同期发布的图录以简洁结构呈现核心信息，形成便于引用与后续研究的基础资料。",
    ],
    highlightArtworkSlugs: [
      "green-tara-malla",
      "manjushri-thangka",
      "ritual-conch-set",
    ],
    catalogueTitle: "《金铜之间》展览图录",
    catalogueIntro: "围绕材料、区域与图像关系展开的专题图录。",
    cover: "/api/placeholder/between-gilding-and-pigment?kind=landscape",
  },
];
