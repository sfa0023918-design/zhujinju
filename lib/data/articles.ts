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
      "我们持续作展览与图录，并不是为了重复陈列，而是为了持续创造这样的时刻：让作品重新进入今天的生活，也让人在与作品的相遇中，重新靠近自己。",
      "We continue to make exhibitions and catalogues not to repeat display, but to keep creating moments like this: allowing works to re-enter life today, and allowing people, through encounter, to draw closer to themselves."
    ),
    body: [
      bt(
        "我们持续作展览与图录，并不只是为了呈现艺术品，更是为了保存一种与作品相遇的方式。",
        "We continue to make exhibitions and catalogues not only to present artworks, but to preserve a way of encountering them."
      ),
      bt(
        "于我们而言，这些雕塑与绘画从来不仅仅只是历史遗物。它们承载着信仰、情绪、记忆与时间，也在每一次凝视中，与今天的我们重新发生关系。展览让作品回到观看现场，图录则让这种相遇得以被记录、被延续、被反复思考。",
        "For us, these sculptures and paintings are never merely historical remnants. They carry faith, emotion, memory, and time, and in every sustained gaze they enter into renewed relation with us in the present. Exhibitions return works to the site of viewing, while catalogues allow these encounters to be recorded, extended, and revisited in thought."
      ),
      bt(
        "我们始终相信，真正优秀的艺术作品，不只是被看见，更能让人从纷杂现实中，重新触碰内心的清晰与安定。也正因如此，我们愿意持续以展览与图录为媒介，让古老的精神在今天继续发声，也让每一次观看，都成为一次与自我、与时间、与世界更深的相遇。",
        "We always believe that truly outstanding art should not only be seen, but should also help people recover inner clarity and steadiness amid the noise of reality. For this reason, we continue to use exhibitions and catalogues as our medium, so that ancient spirit can keep speaking in the present, and each act of viewing can become a deeper encounter with the self, with time, and with the world."
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
