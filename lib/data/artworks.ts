import { bt } from "../bilingual";
import type { Artwork } from "./types";

export const artworks: Artwork[] = [
  {
    slug: "ekadasamukha-avalokiteshvara",
    title: bt("十一面观音坐像", "Seated Ekadasamukha Avalokiteshvara"),
    subtitle: bt("西藏中部鎏金铜造像", "Gilt Bronze Sculpture, Central Tibet"),
    period: bt("十六世纪", "16th century"),
    region: bt("西藏中部", "Central Tibet"),
    origin: bt("西藏", "Tibet"),
    material: bt("鎏金铜", "Gilt copper alloy"),
    category: bt("铜造像", "Bronze Sculpture"),
    dimensions: bt("高 42 cm", "Height 42 cm"),
    status: "inquiry",
    excerpt: bt(
      "造像比例修长，面部与台座处理克制，呈现中后期西藏金铜造像成熟的静观气质。",
      "Elegant in proportion and restrained in both face and lotus base, the sculpture reflects the poised maturity of later Tibetan gilt bronze production."
    ),
    statement: [
      bt(
        "本件十一面观音坐像整体铸造精整，主面相宽额细目，鼻梁挺直，保留了十六世纪西藏中部造像偏向内敛的面容处理。",
        "The sculpture is crisply cast overall, with a broad brow, narrow eyes, and a straight nose, preserving the inward facial restraint often found in 16th-century Central Tibetan bronzes."
      ),
      bt(
        "胸前饰链、帔帛翻折与莲座覆莲瓣起伏之间维持着稳定而克制的装饰节奏，显示工匠对图像秩序的熟悉。",
        "The chest ornaments, folded scarves, and lotus petals sustain a stable decorative rhythm, suggesting an assured command of iconographic order."
      ),
      bt(
        "在同类题材中，此件并不依赖夸张姿态取胜，而以整体比例、鎏金质感与安定的图像结构建立观看分量。",
        "Rather than relying on dramatic gesture, the work establishes presence through proportion, gilded surface, and a calm structural clarity."
      ),
    ],
    provenance: [
      bt("欧洲旧藏", "European private collection"),
      bt("二十世纪末进入私人收藏体系", "Entered a private collection in the late 20th century"),
    ],
    exhibitions: [
      bt(
        "《寂照：喜马拉雅造像与图像的观看》，竹瑾居，2025",
        "Silent Radiance: Ways of Seeing Himalayan Sculpture and Image, Zhu Jin Ju, 2025"
      ),
    ],
    publications: [
      bt("《竹瑾居图录一：铜造像》，2025，页 18-21", "Zhu Jin Ju Catalogue I: Bronze Sculpture, 2025, pp. 18-21"),
    ],
    image: "/api/placeholder/ekadasamukha-avalokiteshvara?kind=portrait",
    featured: true,
  },
  {
    slug: "green-tara-malla",
    title: bt("绿度母坐像", "Seated Green Tara"),
    subtitle: bt("尼泊尔马拉时期金铜造像", "Gilt Bronze Sculpture, Malla Period Nepal"),
    period: bt("十五世纪", "15th century"),
    region: bt("尼泊尔谷地", "Kathmandu Valley"),
    origin: bt("尼泊尔", "Nepal"),
    material: bt("鎏金铜嵌松石", "Gilt copper alloy with turquoise inlay"),
    category: bt("尼泊尔造像", "Nepalese Sculpture"),
    dimensions: bt("高 31 cm", "Height 31 cm"),
    status: "inquiry",
    excerpt: bt(
      "体态轻盈，手指修长，珠饰与冠叶处理显现尼瓦尔工匠体系的精细工艺。",
      "Graceful in pose and refined in detail, the work exemplifies the precision of Newar metal craftsmanship."
    ),
    statement: [
      bt(
        "此件绿度母坐像保留典型尼泊尔谷地金铜造像的工艺语汇，冠叶、耳珰与璎珞层次分明，边缘锐利。",
        "The sculpture preserves the characteristic technical language of Kathmandu Valley bronzes, with sharply articulated crown leaves, earrings, and jewelry."
      ),
      bt(
        "腹部转折与坐姿收束紧密，整体节奏轻而不浮，体现马拉时期造像在精密与庄重之间的平衡。",
        "The transition through the torso and the compact seated posture create a rhythm that is light yet grounded, balancing precision and gravity in the Malla idiom."
      ),
      bt(
        "嵌饰虽不繁复，却恰到好处地强化了作品的仪轨属性与视觉焦点。",
        "The restrained inlay enhances both ritual character and visual focus without excess."
      ),
    ],
    provenance: [
      bt("亚洲私人收藏", "Asian private collection"),
      bt("二十一世纪初见诸市场记录", "Appeared in the market in the early 21st century"),
    ],
    exhibitions: [
      bt(
        "《金铜之间：十三至十八世纪藏传佛教艺术》，竹瑾居，2024",
        "Between Gilding and Pigment: Tibetan Buddhist Art, 13th-18th Century, Zhu Jin Ju, 2024"
      ),
    ],
    publications: [
      bt("《金铜之间》展览图录，2024，页 34-37", "Between Gilding and Pigment, Exhibition Catalogue, 2024, pp. 34-37"),
    ],
    image: "/api/placeholder/green-tara-malla?kind=portrait",
    featured: true,
  },
  {
    slug: "shakyamuni-bhumisparsha",
    title: bt("释迦牟尼成道像", "Shakyamuni in Bhumisparsha Mudra"),
    subtitle: bt("后藏合金铜造像", "Copper Alloy Sculpture, Tsang"),
    period: bt("十四世纪", "14th century"),
    region: bt("后藏", "Tsang"),
    origin: bt("西藏", "Tibet"),
    material: bt("合金铜", "Copper alloy"),
    category: bt("铜造像", "Bronze Sculpture"),
    dimensions: bt("高 28 cm", "Height 28 cm"),
    status: "reserved",
    excerpt: bt(
      "地触印清晰，衣纹处理简约，呈现早期西藏造像由尼泊尔语汇向本地风格转化的线索。",
      "The earth-touching gesture and restrained drapery offer a clear view of how Nepalese vocabulary was transformed within early Tibetan style."
    ),
    statement: [
      bt(
        "造像面容沉静，肩部宽展，坐姿稳固，具有十四世纪后藏地区常见的结构感。",
        "The quiet face, broad shoulders, and stable seated posture convey the structural solidity often associated with 14th-century Tsang bronzes."
      ),
      bt(
        "衣缘线条收束有度，未作过多细碎装饰，使作品重心集中于胸腹与双手印相之间。",
        "The hemline is tightly controlled and avoids excessive embellishment, keeping the visual weight centered on the torso and mudra."
      ),
      bt(
        "其风格位置对理解尼泊尔影响在西藏本地转化的过程具有参考意义。",
        "Its stylistic position is useful for understanding the local transformation of Nepalese influence in Tibet."
      ),
    ],
    provenance: [
      bt("日本旧藏", "Japanese private collection"),
      bt("附旧木座", "With an old wooden stand"),
    ],
    exhibitions: [
      bt(
        "《寂照：喜马拉雅造像与图像的观看》，竹瑾居，2025",
        "Silent Radiance: Ways of Seeing Himalayan Sculpture and Image, Zhu Jin Ju, 2025"
      ),
    ],
    publications: [
      bt("《竹瑾居图录一：铜造像》，2025，页 42-45", "Zhu Jin Ju Catalogue I: Bronze Sculpture, 2025, pp. 42-45"),
    ],
    image: "/api/placeholder/shakyamuni-bhumisparsha?kind=portrait",
    featured: true,
  },
  {
    slug: "manjushri-thangka",
    title: bt("文殊菩萨唐卡", "Thangka of Manjushri"),
    subtitle: bt("安多地区矿物彩绘画", "Mineral Pigment Painting, Amdo"),
    period: bt("十八世纪", "18th century"),
    region: bt("安多", "Amdo"),
    origin: bt("中国西北地区", "Northwest China"),
    material: bt("矿物彩、金粉、棉布", "Mineral pigment, gold, and cotton"),
    category: bt("唐卡", "Thangka"),
    dimensions: bt("画心 74 × 52 cm", "Painting 74 × 52 cm"),
    status: "inquiry",
    excerpt: bt(
      "构图清整，设色偏冷，金线节奏克制，具有后期唐卡中少见的学术气质。",
      "With clear composition, cool tonality, and disciplined gold-line work, the painting carries a rare scholarly character within later thangka production."
    ),
    statement: [
      bt(
        "主尊文殊端坐中央，周围眷属与供养图像布置清晰，保留较完整的图像阅读秩序。",
        "Manjushri sits centrally with attendant and offering figures arranged in a clear, legible iconographic order."
      ),
      bt(
        "矿物彩层次稳定，蓝绿与赭石之间的转换沉着，使整件作品具备安静而不单薄的视觉深度。",
        "The mineral pigments are layered steadily, and the movement between blue-green and ochre tones produces depth without visual heaviness."
      ),
      bt(
        "与同时期商业化倾向更强的唐卡相比，此件在笔触控制与图像布局上显得更为收敛。",
        "Compared with more commercial thangkas of the same period, this work is notably more controlled in brushwork and image layout."
      ),
    ],
    provenance: [
      bt("北美私人收藏", "North American private collection"),
      bt("曾由旧装裱保存", "Preserved in an earlier mounting"),
    ],
    exhibitions: [
      bt(
        "《金铜之间：十三至十八世纪藏传佛教艺术》，竹瑾居，2024",
        "Between Gilding and Pigment: Tibetan Buddhist Art, 13th-18th Century, Zhu Jin Ju, 2024"
      ),
    ],
    publications: [
      bt("《金铜之间》展览图录，2024，页 76-79", "Between Gilding and Pigment, Exhibition Catalogue, 2024, pp. 76-79"),
    ],
    image: "/api/placeholder/manjushri-thangka?kind=portrait",
    featured: true,
  },
  {
    slug: "vajrapani-thangka",
    title: bt("金刚手菩萨唐卡", "Thangka of Vajrapani"),
    subtitle: bt("西藏中部设色唐卡", "Painted Thangka, Central Tibet"),
    period: bt("十七世纪", "17th century"),
    region: bt("西藏中部", "Central Tibet"),
    origin: bt("西藏", "Tibet"),
    material: bt("矿物彩、金粉、棉布", "Mineral pigment, gold, and cotton"),
    category: bt("唐卡", "Thangka"),
    dimensions: bt("画心 82 × 58 cm", "Painting 82 × 58 cm"),
    status: "sold",
    excerpt: bt(
      "形象力量充足，色层厚重而不浊，适合作为风格比较中的关键参照。",
      "Strong in iconographic force and dense in color without becoming heavy, the work serves as a key comparative reference."
    ),
    statement: [
      bt(
        "主尊的动态与火焰纹外围形成强烈张力，但整幅仍以清楚的图像秩序维系观看。",
        "The deity's motion and the surrounding flame pattern create strong tension, while the composition remains visually ordered."
      ),
      bt(
        "设色层次在深蓝与赭红之间保持足够透明度，使厚重题材不至于沉闷。",
        "The chromatic layering sustains enough transparency between deep blues and ochres to keep the subject from becoming ponderous."
      ),
      bt(
        "这类作品在展览中常成为理解护法图像体系的重要入口。",
        "Works of this kind often become essential entry points for understanding protector iconography within exhibition settings."
      ),
    ],
    provenance: [
      bt("欧洲私人收藏", "European private collection"),
      bt("旧题签保留", "With old inventory label preserved"),
    ],
    exhibitions: [
      bt(
        "《寂照：喜马拉雅造像与图像的观看》，竹瑾居，2025",
        "Silent Radiance: Ways of Seeing Himalayan Sculpture and Image, Zhu Jin Ju, 2025"
      ),
    ],
    publications: [
      bt("《图像与仪轨：竹瑾居专题文集》，2025，页 10-13", "Image and Ritual: Zhu Jin Ju Essays, 2025, pp. 10-13"),
    ],
    image: "/api/placeholder/vajrapani-thangka?kind=portrait",
  },
  {
    slug: "ritual-conch-set",
    title: bt("法螺与供养器组合", "Ritual Conch and Offering Set"),
    subtitle: bt("藏传佛教工艺器物", "Tibetan Buddhist Ritual Object Group"),
    period: bt("十八至十九世纪", "18th-19th century"),
    region: bt("拉达克", "Ladakh"),
    origin: bt("喜马拉雅地区", "Himalayan region"),
    material: bt("银、铜、贝、嵌饰", "Silver, copper, shell, and inlay"),
    category: bt("佛教工艺", "Ritual Objects"),
    dimensions: bt("法螺长 27 cm", "Conch length 27 cm"),
    status: "inquiry",
    excerpt: bt(
      "兼具实用与礼仪属性，适合在专题陈列中构成图像之外的物质补充。",
      "Combining practical and liturgical functions, the set offers a material counterpoint to painted and sculpted imagery."
    ),
    statement: [
      bt(
        "法螺口沿与托座结构完整，局部银饰与嵌饰处理呈现出区域工艺传统中的审美取向。",
        "The conch mouth and supporting mount remain structurally coherent, while silver fittings and inlay reflect the aesthetic preferences of a regional workshop tradition."
      ),
      bt(
        "与绘画及造像并置时，此类器物能够补充宗教现场与仪轨使用的维度。",
        "Placed beside painting and sculpture, such objects restore the dimension of ritual setting and actual use."
      ),
      bt(
        "在收藏层面，其意义并不止于稀见，更在于帮助理解物质文化的完整生态。",
        "Its value lies not only in rarity, but in helping reconstruct the larger ecology of material culture."
      ),
    ],
    provenance: [
      bt("藏家旧藏", "From an established private collection"),
      bt("附早期收藏标签", "With an early collection label"),
    ],
    exhibitions: [
      bt(
        "《金铜之间：十三至十八世纪藏传佛教艺术》，竹瑾居，2024",
        "Between Gilding and Pigment: Tibetan Buddhist Art, 13th-18th Century, Zhu Jin Ju, 2024"
      ),
    ],
    publications: [
      bt("《金铜之间》展览图录，2024，页 92-95", "Between Gilding and Pigment, Exhibition Catalogue, 2024, pp. 92-95"),
    ],
    image: "/api/placeholder/ritual-conch-set?kind=portrait",
  },
  {
    slug: "amitayus-western-tibet",
    title: bt("无量寿佛坐像", "Seated Amitayus"),
    subtitle: bt("西藏西部鎏金铜造像", "Gilt Bronze Sculpture, Western Tibet"),
    period: bt("十六世纪", "16th century"),
    region: bt("西藏西部", "Western Tibet"),
    origin: bt("西藏", "Tibet"),
    material: bt("鎏金铜", "Gilt copper alloy"),
    category: bt("铜造像", "Bronze Sculpture"),
    dimensions: bt("高 24 cm", "Height 24 cm"),
    status: "inquiry",
    excerpt: bt(
      "造像体量不大，但莲座、手印与冠饰比例整肃，具有精炼的收藏级完成度。",
      "Though modest in scale, the lotus base, mudra, and crown are disciplined in proportion and finished to a collector's standard."
    ),
    statement: [
      bt(
        "该像肩部与胸腹关系清晰，双手托宝瓶的姿态稳定，显示西藏西部造像常见的凝练结构。",
        "The relation between shoulders and torso is clearly built, and the steady gesture of holding the vase reflects the condensed structure typical of western Tibetan bronzes."
      ),
      bt(
        "局部鎏金保存较佳，光泽温润，不流于炫目，适合近距离观看其细部起伏。",
        "The surviving gilding is warm rather than flashy, rewarding close inspection of its subtle surface transitions."
      ),
      bt(
        "这种尺度的精品常见于私人收藏系统，对陈列环境要求相对友好。",
        "Refined works of this scale are particularly suited to private collections and adaptable display environments."
      ),
    ],
    provenance: [
      bt("欧洲旧藏", "European private collection"),
      bt("二十世纪九十年代入藏", "Acquired into a collection in the 1990s"),
    ],
    exhibitions: [
      bt(
        "《寂照：喜马拉雅造像与图像的观看》，竹瑾居，2025",
        "Silent Radiance: Ways of Seeing Himalayan Sculpture and Image, Zhu Jin Ju, 2025"
      ),
    ],
    publications: [
      bt("《竹瑾居图录一：铜造像》，2025，页 54-57", "Zhu Jin Ju Catalogue I: Bronze Sculpture, 2025, pp. 54-57"),
    ],
    image: "/api/placeholder/amitayus-western-tibet?kind=portrait",
  },
  {
    slug: "newar-shakyamuni",
    title: bt("释迦牟尼坐像", "Seated Shakyamuni"),
    subtitle: bt("尼泊尔早期金铜造像", "Early Nepalese Gilt Bronze Sculpture"),
    period: bt("十三至十四世纪", "13th-14th century"),
    region: bt("尼泊尔谷地", "Kathmandu Valley"),
    origin: bt("尼泊尔", "Nepal"),
    material: bt("鎏金铜", "Gilt copper alloy"),
    category: bt("尼泊尔造像", "Nepalese Sculpture"),
    dimensions: bt("高 22 cm", "Height 22 cm"),
    status: "reserved",
    excerpt: bt(
      "尺寸精巧，面相与台座兼具早期风格信息，适合纳入跨区域风格比较。",
      "Compact in scale yet rich in early stylistic information, the work is highly useful in cross-regional comparison."
    ),
    statement: [
      bt(
        "本件释迦牟尼坐像规模虽小，但台座比例与衣纹布局均具备早期尼泊尔金铜造像的重要特征。",
        "Though modest in size, the sculpture preserves important early Nepalese features in its lotus base proportions and drapery arrangement."
      ),
      bt(
        "其面部处理偏向平静而不追求夸饰，形成一种收敛的庄严感。",
        "Its facial treatment tends toward calm reserve rather than elaboration, creating a restrained solemnity."
      ),
      bt(
        "作为喜马拉雅艺术观看路径中的关键样本，此类作品常具有超过尺寸的研究价值。",
        "As a key type within Himalayan art, works of this class often carry research value disproportionate to their scale."
      ),
    ],
    provenance: [
      bt("香港私人收藏", "Hong Kong private collection"),
      bt("附旧拍卖来源信息", "With previous auction provenance"),
    ],
    exhibitions: [
      bt(
        "《金铜之间：十三至十八世纪藏传佛教艺术》，竹瑾居，2024",
        "Between Gilding and Pigment: Tibetan Buddhist Art, 13th-18th Century, Zhu Jin Ju, 2024"
      ),
    ],
    publications: [
      bt("《金铜之间》展览图录，2024，页 22-25", "Between Gilding and Pigment, Exhibition Catalogue, 2024, pp. 22-25"),
    ],
    image: "/api/placeholder/newar-shakyamuni?kind=portrait",
  },
];
