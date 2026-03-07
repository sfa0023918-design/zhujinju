import { bt } from "../bilingual";
import type { Article } from "./types";

export const articles: Article[] = [
  {
    slug: "how-to-look-at-a-bronze",
    title: bt("一件铜造像为何值得反复观看", "Why a Bronze Deserves Repeated Looking"),
    category: bt("研究短文", "Research Note"),
    column: bt("观看方法", "Ways of Looking"),
    author: bt("竹瑾居研究部", "Zhu Jin Ju Research Desk"),
    date: "2025.11.06",
    excerpt: bt(
      "真正重要的观看，不是迅速确认题材，而是在比例、体量与工艺节奏里建立判断。",
      "The most important act of looking is not quick identification, but judgement built through proportion, mass, and the rhythm of workmanship."
    ),
    body: [
      bt(
        "观看金铜造像时，最先进入视线的往往是题材与姿态，但真正构成作品层次的，是比例、结构与细部处理之间的内在关系。",
        "When looking at gilt bronze sculpture, subject and pose are often the first things seen, yet what truly gives a work depth is the internal relation between proportion, structure, and detail."
      ),
      bt(
        "例如肩部如何展开、胸腹如何起伏、手指与莲座是否保持稳定节奏，这些因素共同决定了一件作品的时代气息与完成度。",
        "How the shoulders open, how the torso rises and settles, and whether the fingers and lotus base maintain a steady rhythm all contribute to a work's period character and level of completion."
      ),
      bt(
        "因此，竹瑾居在呈现造像时更重视近距离观看与并置比较，而不是以单一标签替代完整判断。",
        "For this reason, Zhu Jin Ju favors close viewing and comparative display rather than allowing a single label to stand in for complete judgement."
      ),
    ],
    keywords: [
      bt("铜造像", "Bronze Sculpture"),
      bt("观看方法", "Close Looking"),
      bt("比例判断", "Proportion"),
    ],
    relatedArtworkSlugs: [
      "ekadasamukha-avalokiteshvara",
      "green-tara-malla",
      "shakyamuni-bhumisparsha",
    ],
    relatedExhibitionSlugs: ["silent-radiance"],
    cover: "/api/placeholder/how-to-look-at-a-bronze?kind=landscape",
  },
  {
    slug: "thangka-as-structure",
    title: bt("唐卡的价值，不只在设色", "The Value of a Thangka Is Not Only Color"),
    category: bt("市场观察", "Market Observation"),
    column: bt("作品判断", "Object Judgement"),
    author: bt("竹瑾居", "Zhu Jin Ju"),
    date: "2025.08.14",
    excerpt: bt(
      "设色只是表层入口，图像秩序、尺幅关系与保存状态同样决定作品能否成立。",
      "Color is only the surface entry point; iconographic order, scale, and condition are equally decisive."
    ),
    body: [
      bt(
        "在市场讨论中，唐卡常被简化为颜色是否鲜明、金线是否充足，但真正构成作品品质的，是图像系统是否完整、笔法是否稳定，以及画面各部分是否保持必要的秩序。",
        "In the market, thangkas are often reduced to brightness of color or abundance of gold line, yet true quality rests on a complete iconographic system, stable brushwork, and overall pictorial order."
      ),
      bt(
        "尤其在高等级作品中，设色并不追求炫目，而是服务于图像结构与观看节奏。",
        "In higher-level works, color rarely aims for spectacle; it serves structure and the pacing of vision."
      ),
      bt(
        "这也是我们在展览与图录中强调局部细节与整体布局并重的原因。",
        "This is why our exhibitions and catalogues give equal weight to details and the total composition."
      ),
    ],
    keywords: [
      bt("唐卡", "Thangka"),
      bt("设色", "Pigment"),
      bt("保存状态", "Condition"),
    ],
    relatedArtworkSlugs: ["manjushri-thangka", "vajrapani-thangka"],
    relatedExhibitionSlugs: ["between-gilding-and-pigment"],
    cover: "/api/placeholder/thangka-as-structure?kind=landscape",
  },
  {
    slug: "why-exhibitions-matter",
    title: bt("为什么我们持续做展览与图录", "Why We Continue to Make Exhibitions and Catalogues"),
    category: bt("展览札记", "Exhibition Note"),
    column: bt("策展工作", "Curatorial Practice"),
    author: bt("竹瑾居", "Zhu Jin Ju"),
    date: "2025.03.21",
    excerpt: bt(
      "展览不是销售陈列的延伸，而是把判断公开、把研究组织成可被观看的方式。",
      "An exhibition is not an extension of display for sale, but a way of making judgement public and research visible."
    ),
    body: [
      bt(
        "对古代艺术而言，展览的意义不只是集中呈现作品，更在于建立清晰的观看结构，让作品之间形成可比较、可讨论的关系。",
        "For historical art, the value of an exhibition lies not only in gathering works, but in creating a clear structure of viewing through which works can be compared and discussed."
      ),
      bt(
        "图录则承担另一层功能，它把现场经验沉淀为可检索、可引用的文字与图像档案。",
        "The catalogue serves another purpose, condensing the exhibition experience into searchable, citable texts and images."
      ),
      bt(
        "竹瑾居把展览与图录视为品牌工作的核心，因为它们直接决定专业判断是否能够被长期保存与传递。",
        "Zhu Jin Ju treats exhibitions and catalogues as central to its practice because they directly determine whether professional judgement can be preserved and transmitted over time."
      ),
    ],
    keywords: [
      bt("展览", "Exhibition"),
      bt("图录", "Catalogue"),
      bt("研究输出", "Research Output"),
    ],
    relatedArtworkSlugs: ["ekadasamukha-avalokiteshvara", "manjushri-thangka", "ritual-conch-set"],
    relatedExhibitionSlugs: ["silent-radiance", "between-gilding-and-pigment"],
    cover: "/api/placeholder/why-exhibitions-matter?kind=landscape",
  },
];
