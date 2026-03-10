import { bt } from "../bilingual";
import type { Exhibition } from "./types";

export const exhibitions: Exhibition[] = [
  {
    slug: "silent-radiance",
    title: bt("寂照：喜马拉雅造像与图像的观看", "Silent Radiance: Ways of Seeing Himalayan Sculpture and Image"),
    subtitle: bt("专题展览", "Special Exhibition"),
    period: bt("2025.10.18 - 2025.12.28", "18 Oct 2025 - 28 Dec 2025"),
    venue: bt("竹瑾居 · 上海预约制空间", "Zhu Jin Ju, Appointment Space, Shanghai"),
    intro: bt(
      "以造像与绘画并置的方式重新建立观看路径，讨论图像秩序、材质语汇与近距离观察的重要性。",
      "By placing sculpture and painting in dialogue, the exhibition reconsiders how image order, material language, and close looking shape understanding."
    ),
    description: [
      bt(
        "展览以“观看方式”而非年代排序为结构核心，将铜造像、唐卡与工艺器物置于同一叙事中，强调作品之间的呼应与尺度转换。",
        "The exhibition is structured around modes of looking rather than chronology, bringing bronzes, thangkas, and ritual objects into a single visual narrative."
      ),
      bt(
        "重点作品围绕观音、释迦牟尼与护法图像展开，既讨论图像学，也关注物质与工艺的细部判断，使展览成为一种公开的研究方法。",
        "Key works revolve around Avalokiteshvara, Shakyamuni, and protector imagery, balancing iconographic reading with close material and technical observation."
      ),
      bt(
        "配套图录整理了作品基础信息、对照图版与研究摘要，使现场观看得以转化为可引用、可检索的图像文献。",
        "The accompanying catalogue gathers object data, comparative plates, and research summaries, allowing the exhibition experience to become citable visual documentation."
      ),
    ],
    highlightArtworkSlugs: [
      "ekadasamukha-avalokiteshvara",
      "shakyamuni-bhumisparsha",
      "vajrapani-thangka",
    ],
    highlightCount: 18,
    featuredWorksCount: 18,
    catalogueTitle: bt("《寂照》展览图录", "Catalogue for Silent Radiance"),
    catalogueIntro: bt(
      "收录 18 件重点作品，附策展前言、作品页与图像索引。",
      "Including 18 key works with a curatorial preface, object entries, and image index."
    ),
    cataloguePages: 96,
    cataloguePageCount: 96,
    catalogueNote: bt(
      "收录 18 件重点作品，附策展前言、作品页与图像索引。",
      "Including 18 key works with a curatorial preface, object entries, and image index."
    ),
    curatorialLead: bt(
      "展览不追求门类堆叠，而是让作品之间形成可比较的观看关系。",
      "The exhibition avoids category accumulation and instead lets works form a comparable field of looking."
    ),
    curatorialNote: bt(
      "展览不追求门类堆叠，而是让作品之间形成可比较的观看关系。",
      "The exhibition avoids category accumulation and instead lets works form a comparable field of looking."
    ),
    relatedArticleSlugs: ["how-to-look-at-a-bronze", "why-exhibitions-matter"],
    cover: "/api/placeholder/silent-radiance?kind=landscape",
  },
  {
    slug: "between-gilding-and-pigment",
    title: bt("金铜之间：十三至十八世纪藏传佛教艺术", "Between Gilding and Pigment: Tibetan Buddhist Art, 13th-18th Century"),
    subtitle: bt("研究型展览", "Research Exhibition"),
    period: bt("2024.05.12 - 2024.07.30", "12 May 2024 - 30 Jul 2024"),
    venue: bt("竹瑾居 · 上海预约制空间", "Zhu Jin Ju, Appointment Space, Shanghai"),
    intro: bt(
      "从金铜造像到设色唐卡，讨论材质与图像如何共同塑造宗教艺术的观看经验。",
      "From gilt bronzes to painted thangkas, the exhibition considers how material and image together shape the experience of sacred art."
    ),
    description: [
      bt(
        "展览以材质为切入点，将造像、绘画与器物纳入同一条研究线索，尝试打破常见的门类分割。",
        "Beginning with materiality, the exhibition places sculpture, painting, and objects within a shared research line rather than conventional categories."
      ),
      bt(
        "策展重点不在数量，而在作品之间的风格差异与工艺共性，使观者可以通过局部与整体的对照建立更清晰的比较能力。",
        "Its curatorial emphasis lies not in quantity but in stylistic difference and technical affinity, allowing sharper comparison between works."
      ),
      bt(
        "同期发布的图录以简洁结构呈现核心信息，并通过页码索引与图版顺序建立便于引用的基础资料。",
        "The accompanying catalogue presents core information in a compact structure, using pagination and image order to create a stable basis for citation."
      ),
    ],
    highlightArtworkSlugs: [
      "green-tara-malla",
      "manjushri-thangka",
      "ritual-conch-set",
    ],
    highlightCount: 16,
    featuredWorksCount: 16,
    catalogueTitle: bt("《金铜之间》展览图录", "Catalogue for Between Gilding and Pigment"),
    catalogueIntro: bt(
      "围绕材料、区域与图像关系展开，收录 16 件重点作品与一篇研究前言。",
      "Focused on material, region, and image, with 16 key works and a research preface."
    ),
    cataloguePages: 88,
    cataloguePageCount: 88,
    catalogueNote: bt(
      "围绕材料、区域与图像关系展开，收录 16 件重点作品与一篇研究前言。",
      "Focused on material, region, and image, with 16 key works and a research preface."
    ),
    curatorialLead: bt(
      "材质并非附属信息，而是理解图像与时代判断的第一入口。",
      "Material is not secondary information but one of the first entries into image and period judgement."
    ),
    curatorialNote: bt(
      "材质并非附属信息，而是理解图像与时代判断的第一入口。",
      "Material is not secondary information but one of the first entries into image and period judgement."
    ),
    relatedArticleSlugs: ["thangka-as-structure", "why-exhibitions-matter"],
    cover: "/api/placeholder/between-gilding-and-pigment?kind=landscape",
  },
];
