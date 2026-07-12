---
name: "竹瑾居视觉设计基准"
description: "以真实作品、研究资料和克制温度构成的当代喜马拉雅艺术网站基准。"
colors:
  wall-current: "#f4f0e8"
  surface-current: "#f7f3ec"
  surface-strong-current: "#fbf8f2"
  ink: "#171512"
  muted: "#5b554d"
  accent: "#85715a"
  accent-text: "#6f5d48"
  error: "#87372f"
  success: "#356247"
  warning: "#71521b"
  line: "#1715121f"
  line-strong: "#17151247"
typography:
  display:
    fontFamily: "Songti SC, STSong, SimSun, Noto Serif CJK SC, Source Han Serif SC, serif"
    fontSize: "clamp(2.5rem, 5vw, 4rem)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Songti SC, STSong, SimSun, Noto Serif CJK SC, Source Han Serif SC, serif"
    fontSize: "clamp(2rem, 3vw, 3rem)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  body:
    fontFamily: "PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, Source Han Sans SC, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.85
    letterSpacing: "normal"
  label:
    fontFamily: "PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, Source Han Sans SC, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.12em"
rounded:
  none: "0px"
  soft: "12px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  section: "64px"
components:
  action-link:
    backgroundColor: "{colors.wall-current}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "8px 0"
  button-outline:
    backgroundColor: "{colors.wall-current}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "12px 24px"
    height: "44px"
  filter-chip:
    backgroundColor: "{colors.surface-current}"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
    height: "36px"
  input-field:
    backgroundColor: "{colors.wall-current}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "44px"
  status-chip:
    backgroundColor: "{colors.surface-current}"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
---

# Design System: 竹瑾居

## Overview

**Creative North Star: "让作品先说话"**

竹瑾居的界面是一座当代研究展厅。作品图像承担第一视觉判断，标题和资料紧随其后，界面只负责建立顺序、尺度和可信度。它既不表演传统，也不借冷白和空旷扮演西方画廊。

这份文档是从当前线上系统、干净代码基线和已确认的视觉审核中提炼出的重设计基准。前置 YAML 是后续预览的规范层，不代表当前每个组件已经达到标准。当前令牌保留品牌连续性，已识别的小字、低对比、大圆角和过度阴影属于待修正的旧表现，不得被当作新组件依据。

首页的板块、顺序、中英文文案和真实图片完全锁定。成都研究空间方向不能把空间照片加入首页。三套预览都必须在当前无 `current` 展览时显示真实的近期展览状态，并直接读取线上真实内容，不使用模拟记录。

**Key Characteristics:**

- 真实作品和资料优先，装饰退后。
- 浅色但不冷白，温和但不泛黄成仿古纸。
- 中文标题有书卷气，正文和数据使用清晰无衬线。
- 以细线、比例和间距建立层级，平面化优先。
- 动效克制，只承担反馈和层级提示。
- 信息密度按页面任务分配：首页约 4，藏品列表约 6，作品与展览详情约 7，文章列表约 5，文章阅读约 4。数值只描述相对密度，不写入全站统一常量。
- 布局必须适应藏品、展览、文章、相关推荐和图录页数持续增长。

## Colors

当前源码中的暖米色只作为 **current baseline** 记录，不是最终目标色。三套预览可以分别探索不同程度的去黄和矿物白，但必须保持有人情温度，不能转为冷白西方画廊。任何新背景色都要作为预览方案单独验证，不能默认为全站最终令牌。

### Primary

- **石褐强调色** (`accent`): 保留用于非文字强调，例如焦点轮廓、选中边界、图形标记和短暂状态指示。它不是正文或 12px 标签颜色。
- **石褐文字色** (`accent-text`): 所有需要石褐语气的标签、英文辅助层和功能文字。它在三种 current baseline 浅色表面上的最低对比度为 5.54:1。

### Semantic

- **错误红** (`error`): 仅用于验证失败、保存失败、上传失败和阻断性错误文字或图标。
- **成功绿** (`success`): 仅用于保存成功、上传完成和状态确认。
- **警告赭** (`warning`): 仅用于需要注意但不阻断的内容风险、过期状态和发布前提醒。
- 语义颜色不得成为品牌装饰、分类配色、藏品状态美化或页面背景。

### Neutral

- **暖展墙 current baseline** (`wall-current`): 当前源码背景和品牌连续性的起点，不是最终目标色。
- **安静表面 current baseline** (`surface-current`): 当前菜单、筛选展开层和轻量分组的表面快照。
- **作品衬底 current baseline** (`surface-strong-current`): 当前图片加载区和内容面的表面快照。
- **墨色正文** (`ink`): 标题、正文、关键数据和主要操作。
- **研究灰** (`muted`): 次级正文、说明和非主导元数据。
- **结构线** (`line`, `line-strong`): 分节、字段和控件边界。线条组织内容，不承担装饰。

**The Warmth Without Parchment Rule.** 温度由真实作品、空间经验、文字和比例产生。禁止用泛黄、纸纹、木纹或铜金色替代品牌温度。

**The Accent Split Rule.** `accent` 只做非文字强调，`accent-text` 承担石褐文字。任何 12px 标签都禁止继续使用 `#85715a`，也禁止通过透明度降低 `accent-text` 的对比度。

**The Functional Semantics Rule.** `error`、`success` 和 `warning` 只表达功能状态，不参与品牌装饰和内容分类。

## Typography

**Display Font:** Songti SC 系统宋体栈。

**Body Font:** PingFang SC 系统无衬线栈。

**Character:** 中文标题保留竹瑾居现有的书卷与图录气质，正文和字段保持直接、清晰、可核对。英文是完整信息层，不是装饰性微文字。

### Hierarchy

- **Display** (400, 40-64px, 1.08): 首页主标题和少量一级标题，桌面最大 64px，手机控制在 40-46px。
- **Headline** (400, 32-48px, 1.08): 展览、文章和内容区标题，字距不得小于 -0.04em。
- **Title** (400, 20-32px, 1.2): 作品名、列表标题和字段组标题。
- **Body** (400, 16-18px 中文，15-17px 英文): 中文长文行高约 1.75-1.95，英文约 1.55-1.75。中文阅读宽度约 32-38字，英文约 60-70字符。
- **Label** (400, 最低 12px, 最大 0.12em): 字段、状态和双语辅助层。大写只用于短英文标签，不得承担正文。石褐标签必须使用 `accent-text`，不得使用 `accent`。

**The Readable Scholarship Rule.** 资料可信度首先取决于可读性。禁止 6-10px 英文、低于 4.5:1 的功能文字，以及依靠过宽字距掩盖字号不足。

**The Two-Family Rule.** 除品牌图片字标外，页面只使用一套中文显示字体和一套正文无衬线。不得为了显得编辑化而继续叠加衬线、等宽或手写字体。

## Elevation

系统默认平面化。层级通过图片尺度、内容顺序、背景色微差和细线完成。阴影只允许用于移动导航遮罩、模态灯箱和真正浮出文档流的临时界面，静态卡片和普通按钮不使用宽模糊阴影。

### Shadow Vocabulary

- **临时浮层** (`0 8px 24px rgba(23, 21, 18, 0.10)`): 仅用于菜单、弹层和灯箱。
- **焦点轮廓** (`0 0 0 2px rgba(133, 113, 90, 0.42)`): 用于键盘焦点，不与装饰阴影叠加。

**The Flat Archive Rule.** 数字图录应像清晰的档案桌面，不像带柔光、厚阴影和 24-34px 圆角的消费产品卡片。

**The Border Or Shadow Rule.** 同一静态元素不得同时使用 1px 边框和 16px 以上模糊阴影。结构边界与浮层高度只能选择一种主要表达。

## Components

### Buttons

- **Shape:** 主要和次要按钮使用直角或极轻微圆角，当前基准为直角 (`0px`)。只有短标签型控件允许全圆角。
- **Primary:** 透明暖展墙背景、墨色文字、清晰边框，最小高度 44px，单行标签。
- **Hover / Focus:** 150-240ms 的颜色或 1px 位移反馈。键盘焦点必须清楚，减少动态模式下取消位移。
- **Secondary:** 文本链接和细边框按钮，不使用实心金色、黑色或暗红背景。

### Chips

- **Style:** 仅用于真实状态、筛选和语言切换。全圆角边界必须配合至少 12px 信息文字和 36-44px 触控高度。
- **State:** 选中状态通过文字、边框和轻微表面色共同表达，不只依赖颜色。

### Cards / Containers

- **Corner Style:** 藏品、文章和展览列表默认无卡片外壳，使用图片、间距和分隔线。真正需要容器时最大 12px。
- **Background:** current baseline 使用 `wall-current`、`surface-current` 或 `surface-strong-current`。预览可探索去黄和矿物白，但不使用独立的奶油色家族，也不转为冷白。
- **Shadow Strategy:** 静态内容无阴影。
- **Border:** 单条细线或完整 1px 边界，禁止每一行同时上下双线。
- **Internal Padding:** 16-24px 控件内容，40-64px 页面分节。

### Inputs / Fields

- **Style:** 44px 以上高度，直角细边框，标签位于字段上方，不使用占位符代替标签。
- **Focus:** 墨色或石褐实线焦点，满足可见性要求。
- **Error / Disabled:** 错误信息使用 `error` 并紧邻字段；成功和非阻断提醒分别使用 `success`、`warning`。禁用状态仍保留文本识别度。

### Navigation

- 桌面导航单行显示，目标高度 72-80px。品牌标识保持完整但不挤压首屏。
- 手机导航使用清晰遮罩和 44px 以上链接行。关闭操作与品牌标识保持空间关系，英文标签不得缩成装饰点。

### Bilingual Content

- 中文是主要阅读入口，英文是完整的第二信息层。
- 标题、字段、按钮、筛选和文章都保留现有中英文内容，不删减、不改写。
- 同屏堆叠导致不可读时，可以通过层级、换行或语言切换改善，但不能把英文缩小到失去功能。

### Artwork Records

- 藏品列表以作品图像为主，筛选和分页必须支持动态记录数量。
- 作品详情保留现有字段、顺序和相关内容，使用字段组和阅读宽度处理高密度资料。
- 状态标签是信息，不是装饰，不叠加在作品图像上。

### Exhibition Catalogue Viewer

- 保留真实图录页、页码、翻页、缩略索引和移动触控逻辑。
- 视觉材料应回归平整档案界面，逐步移除大圆角、暖色渐变、模糊高光和厚阴影。

## Do's and Don'ts

### Do:

- **Do** 完整保留首页现有板块、顺序、中英文文案和真实图片。
- **Do** 在没有 `current` 展览时真实显示近期展览状态。
- **Do** 直接读取线上真实藏品、展览、文章和图录记录。
- **Do** 让网格、分页、筛选、相关推荐和图录索引适应未来内容增长。
- **Do** 分别设定首页、藏品列表、作品详情、展览详情、文章列表和长文阅读的视觉密度。
- **Do** 在减少背景泛黄时保留温度，使用暖展墙而不是冷白。
- **Do** 保留 CMS、上传、保存、API、内容字段和部署逻辑的完整边界。
- **Do** 保持正文、字段、状态和交互文字可读，并维持 44px 触控目标。
- **Do** 使用 `accent-text` 呈现 12px 石褐标签，并在每个预览背景上重新验证 4.5:1。
- **Do** 只在功能反馈中使用 `error`、`success` 和 `warning`。

### Don't:

- **Don't** 增加、删除、改写或重新命名首页板块和文案。
- **Don't** 在成都研究空间方向中擅自把空间照片加入首页。
- **Don't** 使用模拟藏品、模拟展览、模拟文章、模拟数量或占位记录。
- **Don't** 把当前 32 件藏品、3 个展览和 6 篇文章写死为布局容量。
- **Don't** 把 VISUAL_DENSITY 5 或任何单一密度值应用到全站。
- **Don't** 把背景改成冷白西方画廊，也不要使用仿古纸、泛黄纸纹、木纹或暖金商城色。
- **Don't** 使用黑金、暗红、莲花、祥云、印章、宗教光效或商业海报语言。
- **Don't** 使用巨大中文口号、无内容依据的过度空白、过小过淡正文或花哨视差。
- **Don't** 直接照搬 David Zwirner、Hauser & Wirth、Eskenazi 或 The Met 的品牌表面。
- **Don't** 将数字图录做成大圆角、宽阴影、玻璃感或消费产品式卡片。
- **Don't** 将 `#f4f0e8`、`#f7f3ec` 和 `#fbf8f2` 宣布为最终目标色，它们只是 current baseline。
- **Don't** 将 `#85715a` 用于 12px 标签或正文文字。
- **Don't** 把错误红、成功绿或警告赭扩展为品牌装饰、栏目配色或作品分类色。
