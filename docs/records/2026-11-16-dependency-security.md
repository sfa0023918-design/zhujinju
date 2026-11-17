# 依赖安全与金刚手立像错图修复记录

日期：2026-11-16。基线：远程 main / 正式版 `982c288a024c7d5399d70353d62fa8da5203be58`。

## 结论与范围

原先 4 个生产依赖告警条目来自 PostCSS、Nano ID、source-map-js，以及依赖 PostCSS 而被连带标记的 Next.js。它们不是 4 处页面故障。完整审计包含开发工具时共有 15 个条目；修复后，生产依赖与完整依赖审计均为 0。

代码检查未发现访客能够提交任意 CSS、source map 或 Nano ID 长度参数的处理入口，因此未发现这些告警影响当前正常浏览的触发路径。这不等同于对整站所有安全问题的保证。本次是依赖告警的定向修复，没有扩大到认证架构或生产配置改造。

用户追加指出的 24 厘米金刚手立像错图也已修正：第二张换成同件、同组摄影的原始照片；作品主图、资料、销售状态及其他 65 件作品的数据保持不变。

**本报告记录发布前验证：本地修复、生产构建及浏览器回归已完成。后续发布状态以正式域名 `/api/version` 和发布验收记录为准。浏览器模拟不等于真机验收。**

## 高风险依赖条目

### 1. PostCSS：恶意 CSS 输出与 source map 读取

- 审计严重度：high。原版本：根依赖 8.5.8，Next 内部依赖 8.4.31。
- 条件及影响：处理恶意 CSS 并嵌入 HTML style 时可能产生脚本注入；处理攻击者控制的 sourceMappingURL 时可能读取不应读取的本地 map 文件。
- 本仓库用途：`postcss.config.mjs:3` 配置 Tailwind 构建处理；没有找到公开的任意 CSS/source-map 处理接口。
- 修复：`package.json:32` 固定 8.5.33，`package.json:37` 统一覆盖嵌套版本，确保 Next 的依赖链也使用修复版。
- 验证：从 Next 实际解析到的 PostCSS 实例执行 style 结束标签转义、越界 map 路径和无 from 路径测试；正常 CSS 输出保持一致。
- 来源：[PostCSS XSS 公告](https://github.com/postcss/postcss/security/advisories/GHSA-qx2v-qp2m-jg93)、[source map 路径公告](https://github.com/advisories/GHSA-r28c-9q8g-f849)、[无 from 绕过公告](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp)。

### 2. Nano ID：异常长度导致循环或整数溢出

- 审计严重度：high。3.3.11 升级至 3.3.20。
- 条件及影响：调用方把不可信的负数、零或极大数作为长度传入受影响 API，可能引发进程无响应或随机池损坏。
- 本仓库没有直接调用该依赖；作品 ID 使用 `lib/content-store.ts:222` 的 Node randomUUID，后台签名使用 `lib/admin-auth.ts:35` 的 HMAC。Next 请求 ID 调用不传入用户控制的长度参数。
- 验证：独立限时子进程检查极大长度抛错、随后正常 ID 生成，以及受影响生成器对零和负长度的安全完成。
- 来源：[负长度公告](https://github.com/advisories/GHSA-28wg-ghj8-5hjv)、[零长度公告](https://github.com/advisories/GHSA-2v37-7h3g-55p8)、[整数溢出公告](https://github.com/advisories/GHSA-xwg4-73v4-xw9w)。

### 3. source-map-js：恶意索引偏移导致拒绝服务

- 审计严重度：high。1.2.1 升级至 1.2.2。
- 条件及影响：解析含极大 section offset 的 source map 可能阻塞事件循环。
- 本项目由 CSS 构建链引入，没有公开的任意 source-map 处理入口。
- 验证：独立限时子进程确认超限偏移被拒绝，允许范围内但超出输入文本长度的映射能够完成并保留输入。
- 来源：[source-map-js 公告](https://github.com/advisories/GHSA-68fv-2mgg-jv7q)。

## 连带与开发工具条目

### 4. Next.js 连带告警

原审计 `next.via` 仅为 `postcss`，不是该报告中另一项独立的 Next 漏洞。PostCSS 覆盖后该条目消失。Next 保持 15.5.29，React、React DOM、Tailwind 版本也保持原样。

### 5. 开发工具依赖

完整审计另外涉及 humanfs、brace-expansion、flatted、js-yaml、picomatch、minimatch 及连带的 TypeScript ESLint 条目。其风险涉及恶意路径、序列化输入或 glob 模式造成越界、污染或资源耗尽；不是前台界面的组件错误。

按锁文件升级对应修复版本。TypeScript ESLint 升级至兼容的 8.72.2；其 typescript-estree 仍声明有告警的 minimatch 10，因此仅在该父依赖下覆盖至 11.0.1（`package.json:38`），未全局替换其他 minimatch 主版本。核对其 CJS/ESM 导出和项目中的匹配调用方式，并完成 Node 22 全新安装、lint 和构建验证。

参考：[minimatch 公告](https://github.com/advisories/GHSA-g3hv-75wg-m249)、[npm overrides 规则](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#overrides)。

## 错图修正

- 页面：`/collection/artwork-1773132602982`，金刚手立像，24 厘米，黑色方座。
- 错图：带莲座的另一件金刚手立像，原 URL 含 `1773898130449`。
- 正确来源：既有原片 `public/uploads/artworks/1773146989353-l1000793.jpg`，已目视比对冠饰、右手、腰带、表面斑驳及黑色方座，属于目标作品。
- 采用新文件名 `public/uploads/artworks/20261116-standing-vajrapani-24cm-view-2.jpg`；文件字节与原片完全相同，无裁切、重绘或重新压缩。
- 同步修正 `content/site-content.json:3045` 的 gallery 及 `content/site-content.json:3055` 的全部 galleryAssets 引用，并填写真实 1200 × 1500 尺寸。旧资产文件保留，另一件作品不改动。

## 验证结果

| 验证 | 结果 |
| --- | --- |
| Node 22 全新 npm ci | 通过 |
| npm audit / npm audit --omit=dev | 均为 0 告警 |
| npm run lint / npm run build / git diff --check | 通过 |
| Node 测试 | 59/59，通过；含 4 项新增依赖安全回归 |
| 编译后 CSS | 8/8 文件 SHA-256 与原发布构建一致 |
| 页面与菜单 | 14 路由 × 390/820/1180/1440px，56/56 通过，无横向溢出、斜体英文回退或页面脚本异常 |
| 触滑 | Hero 双向及循环、作品及放大图浏览、电子图录翻页及缩略条，共 9/9 通过 |
| 错图专项 | 四种宽度下正确附图及放大查看全部通过 |
| 原有 artwork audit | 远程基线 66 件通过；脚本读取 origin/main，不用于证明未发布修复 |
| 本地修复内容核验 | 66 件页面与静态资源核对通过；仅目标作品 gallery/galleryAssets 改动 |

验证使用 Chromium 与 WebKit；实际查看了手机放大图、iPad 附图及桌面放大图截图。此次未做线上修改，不把本地验证表述为生产或真机验收。

原始审计、构建日志、样式哈希、页面结果和截图保存在 `output/security-20261116/`。生产版本仍需在获准发布后，通过 `/api/version`、正式详情页图片 URL 和三端回归再次核验。
