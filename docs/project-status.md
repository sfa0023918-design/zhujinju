# 当前状态

> 会变化的信息只写在这里：版本、当季专题、现行参数、待办。长期规则写在 `AGENTS.md`。
> 每次更新时修改下面的日期和依据；动手前仍要重新核对远程 `main` 和线上 `/api/version`。

更新：2026-11-17。依据远程 `main` 的 `39e8a38`（PR #40）。本文件没有做线上核验。

## 已合并的主要版本

- 2026-09-30　Vercel Web Analytics（PR #23）、共用协作规则（PR #24）。
- 2026-10-08　官网升级第 1–6 批（PR #32）：藏品筛选与分页提速、桌面图录全屏、分享预览图等。
- 2026-11-15　当代版整站视觉（PR #35）。验收记录见 `docs/records/2026-11-15-contemporary-upgrade-review.md`。
- 2026-11-16 至 11-17　手机布局、英文排版、依赖安全、iPad 与全站加载优化（PR #36–#40）。

## 现行参数

- 藏品分页：桌面每页 15 件，平板和手机每页 6 件（站主 2026-11-15 确认，2026-11-17 再次确认）。
- 藏品默认顺序：参考图四的 15 件在前，其余保持原相对顺序。此后通过后台排序管理，不在代码里写死顺序。
- 销售状态颜色：可洽询 `#356247`，已洽购 `#984438`。
- 当季主色：铁锈红 `#9d4432`，只在 `lib/artwork-presentation.ts` 的 `COVER_VAJRA_BACKDROP` 定义一次。
- 内容数量（动态快照，不是设计容量）：藏品 66 件（可洽询 36、已洽购 30），展览 4 个，文章 8 篇。

## 当季专题

- 年度展览“喜马拉雅艺术 2026”：`/exhibitions/himalayan-art-2026`，电子图录 `#catalogue`。展期 2026.10.20–25，北京·嘉德艺术中心，已结束。`/exhibitions` 直接呈现这一届的海报首屏、序言、图录与往期展览。
- 专题“形有所寄｜竹瑾居·喜马拉雅艺术2026 / Form & Devotion | Himalayan Art 2026”：`/journal/form-and-devotion-2026`，首页优先推荐（`app/(site)/page.tsx` 明确指定此 slug）。
  - 固定 12 件作品：材质与光 5 件、人物与气度 3 件、图像的展开 4 件，均链接 `/collection/<slug>`。不得恢复早期被替换的犍陀罗佛头或《佛说母鹿经》。检查时 12 个链接一个不漏。

## 待办

- 统一空间名称：把 “Art Space / 成都竹瑾居艺术空间” 改为 “竹瑾居艺术空间 / Zhu Jin Ju Gallery, Chengdu”。目前出现在 `components/site-footer.tsx`、`lib/site-config.ts`、`lib/data/page-copy.ts` 和 `content/site-content.json`。作为单独任务，经站主确认后进行。
- 清理已合并的远程与本地分支、Codex 工作区：由 Codex 列出分支、PR 与状态对照，站主确认后清理。
- 真机验收：现有验收记录都是浏览器模拟，iPhone 与 iPad 实机检查尚未记录。
- `.impeccable/design.json` 仍是 2026-07 旧基线生成的，需要时按新版 `DESIGN.md` 重新生成。
