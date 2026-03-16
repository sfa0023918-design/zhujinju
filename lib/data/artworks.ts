import { bt } from "../bilingual";
import type { Artwork } from "./types";

export const artworks: Artwork[] = [
  {
    slug: "ekadasamukha-avalokiteshvara",
    title: bt("十一面观音坐像", "Seated Ekadasamukha Avalokiteshvara"),
    subtitle: bt("西藏中部鎏金铜造像", "Gilt Bronze Sculpture, Central Xizang"),
    period: bt("十六世纪", "16th century"),
    region: bt("西藏中部", "Central Xizang"),
    origin: bt("西藏", "Xizang"),
    material: bt("鎏金铜", "Gilt copper alloy"),
    category: bt("铜造像", "Bronze Sculpture"),
    dimensions: bt("高 42 cm", "Height 42 cm"),
    status: "inquiry",
    excerpt: bt(
      "造像比例修长，主面相与莲座处理收敛而稳定，呈现西藏中后期金铜造像成熟的静观气质。",
      "Elegant in proportion and restrained in facial treatment and lotus base, the sculpture reflects the poised maturity of later Central Xizang gilt bronze production."
    ),
    viewingNote: bt(
      "本件十一面观音坐像整体铸造精整，主面相宽额细目，鼻梁挺直，胸前饰链、帔帛翻折与覆莲瓣起伏之间维持着稳定而克制的装饰节奏。其观看重点不在繁缛细节，而在比例、光泽与图像秩序如何共同建立一件造像的静定感。",
      "The sculpture is crisply cast overall, with a broad brow, narrow eyes, and a straight nose. Ornaments, scarf folds, and lotus petals maintain a disciplined decorative rhythm. Its force lies less in ornate detail than in the way proportion, gilding, and iconographic order produce stillness."
    ),
    comparisonNote: bt(
      "与依赖夸张姿态取胜的同类题材相比，此件更接近十六世纪西藏中部造像偏向内敛的面容处理与结构控制，对理解晚期西藏金铜造像如何在庄严与装饰之间取得平衡具有参考意义。",
      "Compared with related examples that rely on emphatic gesture, this work aligns more closely with the inward facial handling and structural control found in 16th-century Central Xizang bronzes, making it a useful point of reference for how later Xizang sculpture balanced solemnity and ornament."
    ),
    provenance: [
      {
        label: bt("欧洲私人收藏", "European private collection"),
        note: bt("二十世纪末入藏，后保持于同一收藏体系。", "Acquired in the late 20th century and retained within the same collection thereafter."),
      },
      {
        label: bt("竹瑾居档案整理", "Documented by Zhu Jin Ju"),
        note: bt("附高清图、细部图与尺寸记录。", "Accompanied by high-resolution images, detail views, and dimensional records."),
      },
    ],
    exhibitions: [
      {
        title: bt("寂照：喜马拉雅造像与图像的观看", "Silent Radiance: Ways of Seeing Himalayan Sculpture and Image"),
        venue: bt("竹瑾居 · 成都预约制空间", "Zhu Jin Ju, Appointment Space, Chengdu"),
        year: "2025",
      },
    ],
    publications: [
      {
        title: bt("《竹瑾居图录一：铜造像》", "Zhu Jin Ju Catalogue I: Bronze Sculpture"),
        year: "2025",
        pages: bt("图录页 18-21", "Catalogue pp. 18-21"),
        note: bt("附局部对照图与尺寸页。", "With comparative details and dimension sheet."),
      },
    ],
    inquirySupport: [
      bt("可索取高清图", "High-resolution images available"),
      bt("可索取品相信息", "Condition report available"),
      bt("可索取图录页", "Catalogue pages available"),
    ],
    relatedArticleSlugs: ["how-to-look-at-a-bronze", "why-exhibitions-matter"],
    relatedExhibitionSlugs: ["silent-radiance"],
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
      "体态轻盈，手指修长，珠饰与冠叶处理精细，显现尼瓦尔工匠体系的成熟工艺。",
      "Graceful in pose and refined in detail, the work exemplifies the mature precision of Newar metal craftsmanship."
    ),
    viewingNote: bt(
      "冠叶、耳珰与璎珞层次清楚，边缘锐利而不失柔和，腹部转折与坐姿收束紧密，形成轻而不浮的整体节奏。嵌饰虽不繁复，却恰到好处地强化了作品的仪轨属性与视觉焦点。",
      "Crown leaves, earrings, and jewelry are sharply articulated yet remain supple, while the torso and compact seated pose produce a rhythm that is light without becoming insubstantial. The restrained inlay strengthens both ritual character and visual focus."
    ),
    comparisonNote: bt(
      "与更强调表面繁饰的马拉时期造像相比，此件在精密与庄重之间保持了更好的平衡，尤其适合作为尼瓦尔工艺系统进入西藏语境前后的比较参照。",
      "Compared with Malla-period bronzes that lean more heavily on surface ornament, this work sustains a stronger balance between precision and gravity, making it an effective comparative example for the Newar idiom before and after its movement into Xizang."
    ),
    provenance: [
      {
        label: bt("亚洲私人收藏", "Asian private collection"),
        note: bt("二十一世纪初见于市场记录，后进入现藏。", "Recorded on the market in the early 21st century before entering the present collection."),
      },
      {
        label: bt("旧标签保存", "Old collection labels retained"),
      },
    ],
    exhibitions: [
      {
        title: bt("金铜之间：十三至十八世纪藏传佛教艺术", "Between Gilding and Pigment: Xizang Buddhist Art, 13th-18th Century"),
        venue: bt("竹瑾居 · 成都预约制空间", "Zhu Jin Ju, Appointment Space, Chengdu"),
        year: "2024",
      },
    ],
    publications: [
      {
        title: bt("《金铜之间》展览图录", "Between Gilding and Pigment, Exhibition Catalogue"),
        year: "2024",
        pages: bt("图录页 34-37", "Catalogue pp. 34-37"),
        note: bt("附冠饰与台座局部图。", "Including detail images of crown and lotus base."),
      },
    ],
    inquirySupport: [
      bt("可索取高清图", "High-resolution images available"),
      bt("可索取品相信息", "Condition report available"),
      bt("可索取图录页", "Catalogue pages available"),
    ],
    relatedArticleSlugs: ["how-to-look-at-a-bronze"],
    relatedExhibitionSlugs: ["between-gilding-and-pigment"],
    image: "/api/placeholder/green-tara-malla?kind=portrait",
    featured: true,
  },
  {
    slug: "shakyamuni-bhumisparsha",
    title: bt("释迦牟尼成道像", "Shakyamuni in Bhumisparsha Mudra"),
    subtitle: bt("后藏合金铜造像", "Copper Alloy Sculpture, Tsang"),
    period: bt("十四世纪", "14th century"),
    region: bt("后藏", "Tsang"),
    origin: bt("西藏", "Xizang"),
    material: bt("合金铜", "Copper alloy"),
    category: bt("铜造像", "Bronze Sculpture"),
    dimensions: bt("高 28 cm", "Height 28 cm"),
    status: "reserved",
    excerpt: bt(
      "地触印清晰，衣纹处理简约，呈现早期西藏造像由尼泊尔语汇向本地风格转化的线索。",
      "The earth-touching gesture and restrained drapery offer a clear view of how Nepalese vocabulary was transformed within early Xizang style."
    ),
    viewingNote: bt(
      "造像面容沉静，肩部宽展，坐姿稳固，衣缘线条收束有度，未作过多细碎装饰，使观看重心集中于胸腹与双手印相之间。整体结构感明确，是一件更适合近距离观察而非远观炫示的作品。",
      "The quiet face, broad shoulders, and stable seated posture give the work clear structural weight. Drapery lines are tightly controlled and avoid excessive detail, concentrating attention on the torso and mudra. It is a work suited more to close examination than distant spectacle."
    ),
    comparisonNote: bt(
      "其风格位置对于理解尼泊尔影响在后藏地区的本地化转化尤具参考价值，与同时期更强调装饰的作品相比，此件的学术意义大于视觉修辞。",
      "Its stylistic position is especially useful for understanding the local transformation of Nepalese influence in Tsang. Compared with contemporaneous works that emphasize ornament, its scholarly value outweighs rhetorical display."
    ),
    provenance: [
      {
        label: bt("日本私人收藏", "Japanese private collection"),
        note: bt("附旧木座与旧装藏记录。", "With an old wooden stand and earlier housing records."),
      },
    ],
    exhibitions: [
      {
        title: bt("寂照：喜马拉雅造像与图像的观看", "Silent Radiance: Ways of Seeing Himalayan Sculpture and Image"),
        venue: bt("竹瑾居 · 成都预约制空间", "Zhu Jin Ju, Appointment Space, Chengdu"),
        year: "2025",
      },
    ],
    publications: [
      {
        title: bt("《竹瑾居图录一：铜造像》", "Zhu Jin Ju Catalogue I: Bronze Sculpture"),
        year: "2025",
        pages: bt("图录页 42-45", "Catalogue pp. 42-45"),
      },
    ],
    inquirySupport: [
      bt("可索取高清图", "High-resolution images available"),
      bt("可索取品相信息", "Condition report available"),
      bt("可索取图录页", "Catalogue pages available"),
    ],
    relatedArticleSlugs: ["how-to-look-at-a-bronze", "why-exhibitions-matter"],
    relatedExhibitionSlugs: ["silent-radiance"],
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
    viewingNote: bt(
      "主尊文殊端坐中央，周围眷属与供养图像布置清晰，图像阅读秩序完整。矿物彩层次稳定，蓝绿与赭石之间的转换沉着，使整件作品具备安静而不单薄的视觉深度。",
      "Manjushri sits centrally with attendant and offering figures arranged in a coherent iconographic order. The mineral pigments are layered steadily, and movement between blue-green and ochre tones creates depth without excess."
    ),
    comparisonNote: bt(
      "与同时期更趋商业化的唐卡相比，此件在笔触控制、图像布局与设色收束方面更为克制，适合作为晚期唐卡中高等级学术型作品的比较案例。",
      "Compared with more commercial thangkas of the same period, this work is notably more restrained in brushwork, composition, and chromatic control, making it a useful comparative case among high-level later thangkas."
    ),
    provenance: [
      {
        label: bt("北美私人收藏", "North American private collection"),
        note: bt("旧装裱保存，画心状态稳定。", "Preserved in an earlier mounting, with the painted surface in stable condition."),
      },
    ],
    exhibitions: [
      {
        title: bt("金铜之间：十三至十八世纪藏传佛教艺术", "Between Gilding and Pigment: Xizang Buddhist Art, 13th-18th Century"),
        venue: bt("竹瑾居 · 成都预约制空间", "Zhu Jin Ju, Appointment Space, Chengdu"),
        year: "2024",
      },
    ],
    publications: [
      {
        title: bt("《金铜之间》展览图录", "Between Gilding and Pigment, Exhibition Catalogue"),
        year: "2024",
        pages: bt("图录页 76-79", "Catalogue pp. 76-79"),
        note: bt("附主尊局部与设色放大图。", "Including enlarged details of the main deity and pigments."),
      },
    ],
    inquirySupport: [
      bt("可索取高清图", "High-resolution images available"),
      bt("可索取品相信息", "Condition report available"),
      bt("可索取图录页", "Catalogue pages available"),
    ],
    relatedArticleSlugs: ["thangka-as-structure", "why-exhibitions-matter"],
    relatedExhibitionSlugs: ["between-gilding-and-pigment"],
    image: "/api/placeholder/manjushri-thangka?kind=portrait",
    featured: true,
  },
  {
    slug: "vajrapani-thangka",
    title: bt("金刚手菩萨唐卡", "Thangka of Vajrapani"),
    subtitle: bt("西藏中部设色唐卡", "Painted Thangka, Central Xizang"),
    period: bt("十七世纪", "17th century"),
    region: bt("西藏中部", "Central Xizang"),
    origin: bt("西藏", "Xizang"),
    material: bt("矿物彩、金粉、棉布", "Mineral pigment, gold, and cotton"),
    category: bt("唐卡", "Thangka"),
    dimensions: bt("画心 82 × 58 cm", "Painting 82 × 58 cm"),
    status: "sold",
    excerpt: bt(
      "形象力量充足，色层厚重而不浊，适合作为风格比较中的关键参照。",
      "Strong in iconographic force and dense in color without becoming heavy, the work serves as a key comparative reference."
    ),
    viewingNote: bt(
      "主尊的动态与火焰纹外围形成强烈张力，但整幅仍以清楚的图像秩序维系观看。设色层次在深蓝与赭红之间保持足够透明度，使厚重题材不至于沉闷。",
      "The deity's motion and surrounding flame motif create strong tension, while the composition remains visually ordered. Color layers preserve enough transparency between deep blues and ochres to keep the subject from becoming ponderous."
    ),
    comparisonNote: bt(
      "这类作品常成为理解护法图像体系的重要入口。相较于同类更重笔墨装饰的例子，此件更强调图像张力与结构清晰度之间的平衡。",
      "Works of this kind often provide an entry point into protector iconography. Compared with examples that rely more heavily on decorative brushwork, this one places greater emphasis on the balance between visual force and structural clarity."
    ),
    provenance: [
      {
        label: bt("欧洲私人收藏", "European private collection"),
        note: bt("旧题签与收藏编号保留。", "With earlier inventory label and collection number retained."),
      },
    ],
    exhibitions: [
      {
        title: bt("寂照：喜马拉雅造像与图像的观看", "Silent Radiance: Ways of Seeing Himalayan Sculpture and Image"),
        venue: bt("竹瑾居 · 成都预约制空间", "Zhu Jin Ju, Appointment Space, Chengdu"),
        year: "2025",
      },
    ],
    publications: [
      {
        title: bt("《图像与仪轨：竹瑾居专题文集》", "Image and Ritual: Zhu Jin Ju Essays"),
        year: "2025",
        pages: bt("文集页 10-13", "Essay pp. 10-13"),
      },
    ],
    inquirySupport: [
      bt("可索取高清图", "High-resolution images available"),
      bt("可索取品相信息", "Condition report available"),
      bt("可索取图录页", "Catalogue pages available"),
    ],
    relatedArticleSlugs: ["thangka-as-structure", "why-exhibitions-matter"],
    relatedExhibitionSlugs: ["silent-radiance"],
    image: "/api/placeholder/vajrapani-thangka?kind=portrait",
  },
  {
    slug: "ritual-conch-set",
    title: bt("法螺与供养器组合", "Ritual Conch and Offering Set"),
    subtitle: bt("藏传佛教工艺器物", "Xizang Buddhist Ritual Object Group"),
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
    viewingNote: bt(
      "法螺口沿与托座结构完整，局部银饰与嵌饰处理呈现出区域工艺传统中的审美取向。与绘画及造像并置时，此类器物能够补充宗教现场与仪轨使用的维度。",
      "The conch mouth and supporting mount remain structurally coherent, while silver fittings and inlay reflect the aesthetic preferences of a regional workshop tradition. Placed beside painting and sculpture, such objects restore the dimension of ritual setting and actual use."
    ),
    comparisonNote: bt(
      "在收藏层面，这类作品的价值并不止于稀见，更在于帮助理解喜马拉雅物质文化的完整生态。相较单件供器，成组保存更有研究意义。",
      "Its value lies not only in rarity, but in helping reconstruct the larger ecology of Himalayan material culture. Compared with isolated ritual objects, a preserved group offers stronger research value."
    ),
    provenance: [
      {
        label: bt("藏家旧藏", "Established private collection"),
        note: bt("附早期收藏标签与器物清单。", "With early collection labels and object list."),
      },
    ],
    exhibitions: [
      {
        title: bt("金铜之间：十三至十八世纪藏传佛教艺术", "Between Gilding and Pigment: Xizang Buddhist Art, 13th-18th Century"),
        venue: bt("竹瑾居 · 成都预约制空间", "Zhu Jin Ju, Appointment Space, Chengdu"),
        year: "2024",
      },
    ],
    publications: [
      {
        title: bt("《金铜之间》展览图录", "Between Gilding and Pigment, Exhibition Catalogue"),
        year: "2024",
        pages: bt("图录页 92-95", "Catalogue pp. 92-95"),
      },
    ],
    inquirySupport: [
      bt("可索取高清图", "High-resolution images available"),
      bt("可索取品相信息", "Condition report available"),
      bt("可索取图录页", "Catalogue pages available"),
    ],
    relatedArticleSlugs: ["why-exhibitions-matter"],
    relatedExhibitionSlugs: ["between-gilding-and-pigment"],
    image: "/api/placeholder/ritual-conch-set?kind=portrait",
  },
  {
    slug: "amitayus-western-xizang",
    title: bt("无量寿佛坐像", "Seated Amitayus"),
    subtitle: bt("西藏西部鎏金铜造像", "Gilt Bronze Sculpture, Western Xizang"),
    period: bt("十六世纪", "16th century"),
    region: bt("西藏西部", "Western Xizang"),
    origin: bt("西藏", "Xizang"),
    material: bt("鎏金铜", "Gilt copper alloy"),
    category: bt("铜造像", "Bronze Sculpture"),
    dimensions: bt("高 24 cm", "Height 24 cm"),
    status: "inquiry",
    excerpt: bt(
      "造像体量不大，但莲座、手印与冠饰比例整肃，具有精炼的收藏级完成度。",
      "Though modest in scale, the lotus base, mudra, and crown are disciplined in proportion and finished to a collector's standard."
    ),
    viewingNote: bt(
      "该像肩部与胸腹关系清晰，双手托宝瓶的姿态稳定，局部鎏金保存较佳，光泽温润，不流于炫目。其尺度适中，更能在近距离观看中呈现手部、冠饰与莲座的细部起伏。",
      "The relation between shoulders and torso is clearly built, the gesture of holding the vase is steady, and the surviving gilding is warm rather than flashy. Its moderate scale rewards close viewing of the hands, crown, and lotus base."
    ),
    comparisonNote: bt(
      "相较同时期体量更大的西藏西部造像，此件的分量来自比例与完成度，而非尺寸本身。对私人收藏和预约制陈列环境而言，它具有更友好的观看尺度。",
      "Compared with larger western Xizang bronzes of the same period, its presence derives from proportion and finish rather than scale itself. It is particularly well suited to private collections and appointment-based display settings."
    ),
    provenance: [
      {
        label: bt("欧洲旧藏", "European private collection"),
        note: bt("二十世纪九十年代入藏。", "Acquired into a collection in the 1990s."),
      },
    ],
    exhibitions: [
      {
        title: bt("寂照：喜马拉雅造像与图像的观看", "Silent Radiance: Ways of Seeing Himalayan Sculpture and Image"),
        venue: bt("竹瑾居 · 成都预约制空间", "Zhu Jin Ju, Appointment Space, Chengdu"),
        year: "2025",
      },
    ],
    publications: [
      {
        title: bt("《竹瑾居图录一：铜造像》", "Zhu Jin Ju Catalogue I: Bronze Sculpture"),
        year: "2025",
        pages: bt("图录页 54-57", "Catalogue pp. 54-57"),
      },
    ],
    inquirySupport: [
      bt("可索取高清图", "High-resolution images available"),
      bt("可索取品相信息", "Condition report available"),
      bt("可索取图录页", "Catalogue pages available"),
    ],
    relatedArticleSlugs: ["how-to-look-at-a-bronze"],
    relatedExhibitionSlugs: ["silent-radiance"],
    image: "/api/placeholder/amitayus-western-xizang?kind=portrait",
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
    viewingNote: bt(
      "本件释迦牟尼坐像规模虽小，但台座比例与衣纹布局均具备早期尼泊尔金铜造像的重要特征，面部处理偏向平静而不追求夸饰，形成一种收敛的庄严感。",
      "Though modest in size, the sculpture preserves important early Nepalese features in the lotus base proportions and drapery arrangement. Its facial treatment tends toward calm reserve rather than elaboration, creating restrained solemnity."
    ),
    comparisonNote: bt(
      "作为喜马拉雅艺术观看路径中的关键样本，这类作品常具有超过尺寸的研究价值。与晚期尼瓦尔工艺相比，其重点在早期结构信息而非表面华丽程度。",
      "As a key type within Himalayan art, works of this class often carry research value disproportionate to their scale. Compared with later Newar workmanship, its importance lies in early structural information rather than surface richness."
    ),
    provenance: [
      {
        label: bt("香港私人收藏", "Hong Kong private collection"),
        note: bt("附旧拍卖来源信息。", "With previous auction provenance."),
      },
    ],
    exhibitions: [
      {
        title: bt("金铜之间：十三至十八世纪藏传佛教艺术", "Between Gilding and Pigment: Xizang Buddhist Art, 13th-18th Century"),
        venue: bt("竹瑾居 · 成都预约制空间", "Zhu Jin Ju, Appointment Space, Chengdu"),
        year: "2024",
      },
    ],
    publications: [
      {
        title: bt("《金铜之间》展览图录", "Between Gilding and Pigment, Exhibition Catalogue"),
        year: "2024",
        pages: bt("图录页 22-25", "Catalogue pp. 22-25"),
      },
    ],
    inquirySupport: [
      bt("可索取高清图", "High-resolution images available"),
      bt("可索取品相信息", "Condition report available"),
      bt("可索取图录页", "Catalogue pages available"),
    ],
    relatedArticleSlugs: ["how-to-look-at-a-bronze"],
    relatedExhibitionSlugs: ["between-gilding-and-pigment"],
    image: "/api/placeholder/newar-shakyamuni?kind=portrait",
  },
];
