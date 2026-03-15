import { bt } from "../bilingual";
import type { HomeContent } from "./types";

export const homeContent: HomeContent = {
  heroEyebrow: bt("喜马拉雅艺术与亚洲古代艺术", "Himalayan Art and Asian Antiquities"),
  heroTitle: bt("让作品先说话。", "Let the Work Speak First."),
  heroSubtitle: bt(
    "以作品、展览、图录与研究建立长期判断。",
    "Building long-term discernment through works, exhibitions, catalogues, and research."
  ),
  heroPrimaryAction: bt("浏览藏品", "Browse Collection"),
  heroSecondaryAction: bt("查看展览与图录", "View Exhibitions & Catalogues"),
  focusCurrent: {
    eyebrow: bt("当前专题", "Current Exhibition"),
    description: bt(
      "围绕当前正在进行的专题展览，继续呈现重点作品、图录整理与观看方法。",
      "A current exhibition continuing Zhu Jin Ju's object-centered approach through selected works, catalogues, and ways of looking."
    ),
  },
  focusRecent: {
    eyebrow: bt("近期展览", "Recent Exhibition"),
    description: bt(
      "近期展览延续了竹瑾居以作品为核心的研究路径，相关图录与文章仍可继续索取与查阅。",
      "A recent exhibition continuing Zhu Jin Ju's object-centered approach, with related catalogues and texts still available on request."
    ),
  },
  focusSummaryLine: {
    highlightUnit: bt("件重点作品", "highlighted works"),
    catalogueUnit: bt("页图录", "catalogue pages"),
  },
  focusAction: bt("进入专题详情", "View Exhibition"),
  selectedWorks: {
    eyebrow: bt("精选作品", "Selected Works"),
    title: bt("以作品为核心组织观看顺序", "A Viewing Order Built Around the Object"),
    description: bt(
      "优先呈现具有风格代表性、可比较性与观看张力的作品。",
      "Prioritize works that are stylistically representative, comparable, and visually compelling."
    ),
  },
  collectingDirections: {
    eyebrow: bt("收藏方向", "Collecting Directions"),
    title: bt("围绕明确而长期的研究线索展开", "Structured by Clear and Long-Term Research Lines"),
    description: bt(
      "竹瑾居不追求门类堆叠，而是在少数真正重要的方向上持续积累判断、图像档案与展览经验。",
      "Zhu Jin Ju does not pursue breadth for its own sake, but builds judgement, image archives, and exhibition experience within a few important fields."
    ),
  },
  operationalFacts: {
    eyebrow: bt("专业信任", "Professional Trust"),
    title: bt("由展览、图录与研究累积出的公开方法", "A Public Method Built Through Exhibitions, Catalogues, and Research"),
    description: bt(
      "对藏家、机构与研究者而言，可信赖并不来自夸张表达，而来自判断的一致性、公开资料的清晰度与持续积累。",
      "For collectors, institutions, and researchers, trust comes not from spectacle but from consistent judgement, clear public documentation, and sustained work."
    ),
  },
  contact: {
    eyebrow: bt("联系", "Contact"),
    title: bt("欢迎藏家、机构、策展人与研究者联系。", "Collectors, Institutions, Curators, and Researchers Are Welcome."),
    description: bt(
      "如需咨询具体作品、专题合作、机构借展、图录交换或研究交流，可通过联系页面提交信息。",
      "For inquiries about individual works, collaborations, institutional loans, catalogue exchange, or research discussion, please use the contact page."
    ),
  },
  contactPrimaryAction: bt("前往联系页面", "Contact Us"),
  contactSecondaryAction: bt("查看文章与研究", "Read Journal"),
};
