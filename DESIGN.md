---
name: "竹瑾居视觉设计基准（当代版）"
description: "以真实作品、研究资料和克制温度构成的当代喜马拉雅艺术网站基准。2026-11-15 当代版上线后的现行基线。"
colors:
  paper: "#f3f1ec"
  panel: "#e9e6df"
  ink: "#141311"
  muted: "#5c5852"
  accent: "#8f3b2b"
  accent-text: "#8f3b2b"
  season-rust: "#9d4432"
  rust-ink: "#f4ede4"
  rust-muted: "#ead9cf"
  display-ink: "#e6e1da"
  dark-ink: "#efeae2"
  dark-muted: "#a9a39a"
  catalogue-surface: "#504d45"
  status-available: "#356247"
  status-acquired: "#984438"
  error: "#87372f"
  success: "#356247"
  warning: "#71521b"
  line: "rgba(20, 19, 17, 0.2)"
  line-strong: "#141311"
typography:
  song:
    fontFamily: "Zhujinju Song, Source Han Serif SC, Noto Serif SC, Songti SC, serif"
    fontWeight: "400 / 500"
  serif-en:
    fontFamily: "Instrument Serif, Source Serif 4, serif"
    fontWeight: 400
  sans:
    fontFamily: "Instrument Sans, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans SC, sans-serif"
    fontSize: "15px"
    fontWeight: "400–600"
    lineHeight: 1.7
  display:
    fontFamily: "Anton, Arial Narrow, sans-serif"
    fontWeight: 400
  reading:
    fontSize: "17px desktop / 16px ≤860px"
    lineHeight: "1.9 中文 / 1.8 英文"
rounded:
  none: "0px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  section: "64px"
---

# Design System: 竹瑾居（当代版）

## 状态与依据

- 本文件记录 2026-11-15 当代版合并（PR #35）及后续 #36–#40 之后的**现行视觉基线**，取代 2026-07-12 的旧基线。
- 数值的最终依据是代码：前台令牌在 `app/(site)/site-layout.module.css` 的 `.siteTheme`，组件细节在各 `*.module.css`。本文件与代码不一致时以代码为准，并修正本文件。
- 每一项调整的来由和站主确认记录见 `docs/records/2026-11-15-contemporary-upgrade-review.md`。原始参考页与设计规范是交接资料，不在仓库内。
- 产品定位与反面参照见 `PRODUCT.md`；协作与保护规则见 `AGENTS.md`。

**创作北极星：“让作品先说话”。** 作品图像承担第一视觉判断，标题和资料紧随其后，界面只负责顺序、尺度和可信度。设计出发点是把 2026 图录的气质搬到网页：作品按原始比例完整呈现，当季主色取自图录封面，中英文并置。

## 范围

| 区域 | 主题 |
| --- | --- |
| 公开页面（首页、藏品、作品详情、展览与图录、文章、关于、联系、404） | 当代版 `.siteTheme` |
| “形有所寄”专题 `/journal/form-and-devotion-2026` | 独立的 `.legacyEditorial` 主题与 `exhibition-journal.module.css`，章节色只属于该专题，不随全站令牌变化 |
| 后台 `/admin` | `app/globals.css` 的原始基准，前台改动不修改它 |

## 断点与栅格

| 档位 | 宽度 |
| --- | --- |
| 手机 | ≤ 860px |
| 平板 | 861–1279px |
| 电脑 | ≥ 1280px |

- 主要页面内容区最大宽度 1600px，居中；页边距手机 24px（< 768px），其余 40px。头部、首页、作品详情、藏品列表、展览与阅读组件都对齐到 1600px。
- 1440px 以上字号与高度停在 1440px 时的数值，不再放大；整屏色块继续铺满。
- 部分令牌在 768px、1100px 处分档（见下方字号表），这是令牌的细分，不是新的版式档位。

## 颜色

页面只使用下列令牌，不另造颜色。

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--paper` / `--bg` | `#f3f1ec` | 页面底色 |
| `--panel` / `--surface-strong` | `#e9e6df` | 浅色区块底（文章区、记录区、往期展览等） |
| `--ink` | `#141311` | 标题、正文、强分隔线、页脚底色 |
| `--muted` | `#5c5852` | 次要文字 |
| `--accent` / `--accent-text` | `#8f3b2b` | 链接、悬停、当前栏目标识等功能文字 |
| `--line` | `rgba(20, 19, 17, 0.2)` | 细分隔线 |
| `--line-strong` | `#141311` | 表头线、筛选栏上沿、信息表上沿 |
| 当季主色 | `#9d4432` | 铁锈红区块。只在 `lib/artwork-presentation.ts` 的 `COVER_VAJRA_BACKDROP` 定义一次，换季只改这里 |
| `--rust-ink` / `--rust-muted` / `--rust-line` | `#f4ede4` / `#ead9cf` / `rgba(244,237,228,.42)` | 铁锈红上的文字、次要文字、分隔线 |
| `--display-ink` | `#e6e1da` | 铁锈红上的 Anton 大字 |
| `--dark-ink` / `--dark-muted` / `--dark-line` | `#efeae2` / `#a9a39a` / `rgba(239,234,226,.2)` | 深色区块与页脚上的文字和线 |
| `--catalogue-*` | 底 `#504d45`，字 `#f0ede4`，次要 `#d1cbbf` | 电子图录阅读区 |
| `--status-available` | `#356247` | 销售状态“可洽询”（文字与实心圆点） |
| `--status-acquired` | `#984438` | 销售状态“已洽购”（文字与空心圆点） |
| `--error` / `--success` / `--warning` | `#87372f` / `#356247` / `#71521b` | 只用于功能反馈 |

对比度（实测）：墨色在纸色上 16.45:1；次要文字在纸色上 6.26:1、在浅色区块上 5.67:1；`#8f3b2b` 在纸色上 6.58:1；两种状态色在纸色上分别为 6.22:1 和 5.78:1；铁锈红上的文字 5.47:1，次要文字 4.63:1。新增颜色组合必须达到 4.5:1。

规则：

- 销售状态用颜色加图形（实心/空心）共同表达，不只靠颜色；状态是信息，不叠加在作品图像上。
- 语义色只表达功能状态，不作品牌装饰或分类配色。
- 往届展览使用各自的原封面，不套用当季铁锈红和金刚杵主视觉。
- 首页轮播每件作品的背景渐变属于该作品的固定配置，不属于全站色板。

## 字体

全部自托管在 `public/fonts/`，来源与 SIL OFL 1.1 许可登记在 `public/fonts/README.md`。不使用外部字体服务，不加载大型原始字体。

| 角色 | 字体 | 用途 |
| --- | --- | --- |
| 中文宋体 `--font-song` / `--font-serif` | `Zhujinju Song`（思源宋体子集，400 与 500） | 中文标题、作品名、陈述句、观看描述与序言的中文正文 |
| 英文衬线 | Instrument Serif（多为斜体），Source Serif 4 作缺字后备（如带变音符的转写） | 英文标题、作品英文名 |
| 无衬线 `--font-sans` | Instrument Sans 400–600；中文落到系统字体 | 导航、按钮、标签、信息表、说明、英文长段正文、数字。全站默认 15px / 1.7 |
| 展览大字 `--font-display` | Anton | 只用于 “HIMALAYAN ART” 大字 |

首屏字体按页面子集与预加载生成，相关脚本见 `scripts/build-*-fonts.py`、`scripts/prepare-reading-fonts.mjs`；生成的 CSS 在 `app/(site)/*fonts*.css`。新增 CMS 文字所需的字形由分块子集按需加载。

## 字号

令牌（中文 / 英文，单位 px）：

| 令牌 | < 768 | 768–1099 | ≥ 1100 |
| --- | --- | --- | --- |
| `--type-hero` | 30 / 20 | 32 / 22 | 36 / 24 |
| `--type-page` | 26 / 17 | 30 / 18 | 32 / 20 |
| `--type-section` | 22 / 16 | 24 / 17 | 26 / 18 |
| `--type-feature` | 20 / 16 | 22 / 17 | 24 / 18 |
| `--type-card` | 16 / 14 | 18 / 15 | 19 / 16 |
| `--type-artwork` | 20 | 22 | 24 |
| `--type-reading-title` | 20 / 16 | 20 / 16 | 22 / 16 |

首页、展览首屏等少数大标题和 Anton 大字使用 `clamp()` 随屏宽收缩，各自定义在对应模块 CSS 中，1440px 时取上限。

**阅读正文**（展览序言、藏品观看描述与比较说明、普通文章、关于页理念）：

- 字号 `--reading-size`：桌面 17px，≤ 860px 为 16px。段间距 20px / 18px。
- 中文用宋体，行高 1.9，两端对齐；英文用 Instrument Sans，行高 1.8，左对齐。
- 不再放大首段，不用英文首句斜体冒充摘要。
- 电脑端中英双栏并列；手机端切换语言，切换后保持折叠位置和展开状态。
- 长文默认显示约 10 行，在完整句子处结束，用一个双语“阅读全文 / 收起”按钮。短文不折叠。展开后保留原文和段落，不改写、不删节。

## 版式与组件

- **平面化**：不加阴影、圆角、渐变、玻璃感和装饰性动效。层级靠图片尺度、顺序、背景色微差和细线。浮层（菜单、灯箱、微信二维码弹窗）用遮罩区分。
- **作品图像**：按原始比例完整显示，不裁切、不加滤镜，不用生成或放大图替代原图。详情页按宽高比分为竖幅（≤ 0.95）、横幅和长卷三种首屏。局部图标明“局部”。
- **等高成行拼排**（`lib/artwork-rows.ts`）：藏品列表与相关推荐按图片比例组成等高行，每行铺满内容区，不留空白占位列。目标行比例：电脑 2.75、平板 2.0、详情局部图 2.3；长卷单独成行。
- **藏品分页**：电脑每页 15 件，平板和手机每页 6 件（`components/collection-results.tsx`）。
- **首页精选**：≥ 861px 一行四件；≤ 860px 单行左右滑动，图片统一高度、宽度随原比例。
- **作品详情资料表**：中文在上、英文在下，标签与值对应。摘要与同语言标题完全相同时省略重复显示。已洽购作品不开放询洽。
- **栏目导航**（作品详情）：无外框，当前栏目用 `--accent` 文字加 1px 底线；手机和平板吸顶，窄屏横向滚动。
- **电子图录**：保留真实图录页、页码、翻页、缩略索引、全屏与缩放、页码地址，以及只预取相邻页组的有限预加载。
- **头部导航**：六项，首项“首页 Home”，Logo 回首页。手机菜单打开时背景不滚动。
- **页脚**：深色三栏紧凑排列；保留栏目链接、全部联系方式、地址、五个社交图标、微信二维码弹窗；手机两个折叠项。
- **按钮与输入**：直角细边框，最小触控 44px；表单输入字号 16px（避免 iOS 聚焦时自动放大）。

## 无障碍与动效

- 正文、字段、状态和交互文字对比度不低于 4.5:1。
- 键盘可达，焦点可见（`:focus-visible` 2px 墨色轮廓）。
- 触控目标不小于 44 × 44px。
- `prefers-reduced-motion` 下轮播不自动切换，取消位移动效。
- 英文是完整的第二信息层，不压缩成装饰性小字。

## 保持不变的约定

- 不使用模拟藏品、展览、文章或编造的数量；所有列表适应内容增长，不把当前数量写进布局。
- 不使用仿古纸、木纹、莲花、祥云、印章、宗教光效、黑金或商业海报语言。
- 页面视觉或交互变更须在约 390 / 820 / 1180 / 1440px 出三端可比预览，由站主确认；浏览器模拟不等于真机验收。
