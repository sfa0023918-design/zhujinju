# 项目交接说明（请先读）

本文件给下一个接手账号使用。建议在开始任何修改、部署、后台排查前，先完整阅读本文件，再看 `README.md`、`DEPLOY_CN.md`、`MAINTENANCE_CN.md`。

## 1. 项目是什么

- 项目名称：竹瑾居官网
- 正式域名：`https://www.zhujinju.com`
- 业务定位：喜马拉雅艺术、藏传佛教艺术及相关亚洲古代艺术网站
- 站点形态：Next.js 正式站 + `/admin` 内容后台

当前网站已经不是单纯的静态展示站，而是“前端定稿页面 + 后台可维护内容 + GitHub 同步 + Vercel 正式部署”的组合结构。

## 2. 当前技术结构

- 框架：Next.js 15 + TypeScript + Tailwind CSS 4
- 路由：App Router
- 正式部署：Vercel
- 内容存储：
  - 代码里固定的信息：`/Users/zhangmi/竹瑾居网站/lib/data/`、`/Users/zhangmi/竹瑾居网站/lib/site-config.ts`、`/Users/zhangmi/竹瑾居网站/lib/data/page-copy.ts`、`/Users/zhangmi/竹瑾居网站/lib/data/home-content.ts`
  - 后台可编辑内容：`/Users/zhangmi/竹瑾居网站/content/site-content.json`
- GitHub 读写：
  - 正式站内容读取和后台保存，依赖 `GitHub Contents API`
  - 相关核心文件：`/Users/zhangmi/竹瑾居网站/lib/github-repo.ts`

## 3. 这次已经确定的内容策略

这是本项目最重要的业务决策之一，后续不要随意反过来做：

- 前端已经定稿的固定板块，不要再交回后台管理
- 不经常修改的内容，固定在前端代码中维护
- 后台只保留“经常需要新增、编辑、替换”的内容项
- 这样做的目的，是避免“前端昨晚改了，后台一保存又回退到旧版本”的情况再次发生

当前已落实的原则：

- 静态品牌信息、部分页面文案、公共配置，已经改为以代码为准
- 后台主要保留：
  - 藏品
  - 展览与图录
  - 文章
  - 对应图片、封面、画廊等高频维护内容

## 4. 正式站内容来源规则

一定要理解这部分，否则后面会误判“为什么线上没更新”。

### 4.1 文字和结构内容

- 正式环境优先读取 GitHub 仓库里的 `content/site-content.json`
- 后台保存后，会把内容写回 GitHub
- 正式站重新读取后，文字和结构内容会更新

核心文件：

- `/Users/zhangmi/竹瑾居网站/lib/content-store.ts`

### 4.2 图片内容

- 后台上传图片后，图片会写入仓库的 `public/uploads/...`
- 但图片真正出现在正式站，仍然需要新的 Vercel 部署产物
- 所以“图片已经上传成功”不代表“前端页面已经显示”

这就是之前出现“后台上传了图片，但前端页面不显示”的根本原因之一。

## 5. 现在图片自动上线机制已经做好的部分

这部分已经配置完成，不需要重复从零再做。

### 5.1 已完成的能力

- 后台上传图片后，系统会尝试自动触发 Vercel 正式部署
- 后台直接修改图片字段时，也会自动触发 Vercel 正式部署
- 这样做是为了让 `public/uploads` 下的新图片尽快进入正式产物

### 5.2 已改过的代码文件

- `/Users/zhangmi/竹瑾居网站/app/api/admin/upload/route.ts`
- `/Users/zhangmi/竹瑾居网站/app/api/admin/media-field/route.ts`
- `/Users/zhangmi/竹瑾居网站/lib/vercel-deploy.ts`
- `/Users/zhangmi/竹瑾居网站/lib/admin-media.ts`
- `/Users/zhangmi/竹瑾居网站/components/admin-media-field.tsx`
- `/Users/zhangmi/竹瑾居网站/components/admin-cms-editor.tsx`
- `/Users/zhangmi/竹瑾居网站/app/admin/actions.ts`
- `/Users/zhangmi/竹瑾居网站/.env.example`
- `/Users/zhangmi/竹瑾居网站/README.md`

### 5.3 已完成的线上配置

- Vercel Deploy Hook 已创建
- 正式环境变量 `VERCEL_DEPLOY_HOOK_URL` 已配置
- 对应代码已经同步到 GitHub `main`

结论：

- 现在的目标链路应该是“后台上传图片 -> 自动触发正式部署 -> 前台几分钟后更新”
- 理论上不需要再额外依赖人工重新部署

## 6. 一个非常关键的排查结论

如果以后再次出现“后台上传图片，但前台没显示”，优先按下面顺序排查：

1. 先确认图片 URL 在线上能不能直接打开
2. 再确认该图片路径有没有真的写入对应作品/展览/文章的正式字段
3. 再确认该记录是否是前台可见状态
4. 最后再看部署是否完成

已经验证过的事实：

- 有一批新图虽然线上文件已经能访问，但 `content/site-content.json` 并没有引用这些图片路径
- 这种情况下，图片文件是存在的，但页面仍然不会显示

也就是说：

- “图片上传成功” != “内容绑定成功”
- “内容绑定成功” != “正式站立即显示”

## 7. 后台图片不显示时，最常见的真实原因

后续接手时，优先考虑这几类情况，不要先怀疑前端显示组件：

- 图片只上传进素材路径，但没有绑定到具体记录字段
- 上传时没有带真实 `targetId`
- 当前记录还是临时状态，不能正确写回正式内容
- 只改了本地预览或输入框，没有真正写入 `image` / `gallery` / `cover` 字段
- GitHub 已写入，但正式部署还没完成

相关文件：

- `/Users/zhangmi/竹瑾居网站/components/admin-media-field.tsx`
- `/Users/zhangmi/竹瑾居网站/app/api/admin/upload/route.ts`
- `/Users/zhangmi/竹瑾居网站/app/api/admin/media-field/route.ts`
- `/Users/zhangmi/竹瑾居网站/lib/content-store.ts`

## 8. 已确认的正式部署状态

截至 2026-03-15，本轮关键部署链路已确认：

- GitHub `main` 已包含自动部署相关代码
- Vercel 最新生产部署已 `Ready`
- 自动 Deploy Hook 触发的新生产部署也已 `Ready`
- 正式域名别名已指向最新生产部署：
  - `https://zhujinju.com`
  - `https://www.zhujinju.com`

如果下一个账号接手时要再次核对，可优先执行：

```bash
npx vercel@latest ls zhujinju
npx vercel@latest inspect <deployment-url>
```

## 9. 内容和设计上的约束

这是用户明确表达过的要求，后续不要违背：

- 不要破坏现有正式网站页面
- 不要改前端目前已经定稿的板块结构
- 如需调整，优先改后台需要删除或收缩的板块，而不是改前台成品区块
- 进行性能优化时，必须以“保证全站图片清晰度和高质量”为前提
- 电子图录页面按用户当前确认的展示逻辑处理，不要擅自改回双页或其他布局

## 10. 建议下一个账号接手后的工作顺序

### 第一步：先看工作区状态

不要直接 reset 或覆盖。先看：

```bash
git status --short
```

这个项目最近有过多轮线上修正、部署和图片上传，工作区可能不是完全干净的。

### 第二步：先区分“代码问题”还是“内容绑定问题”

遇到前台没显示时，先看：

- 该内容是否在 `content/site-content.json`
- 该图片文件是否在 `public/uploads/...`
- 线上 URL 是否能直接打开

### 第三步：再判断是否需要部署

如果只是后台内容没绑定，重新部署没有意义；应先修正内容字段。

### 第四步：最后再做正式部署确认

如果改动涉及：

- `public/uploads`
- 正式内容
- Vercel 部署逻辑

则要核对正式部署是否已经 `Ready`。

## 11. 建议优先阅读的文件

按优先级建议：

1. `/Users/zhangmi/竹瑾居网站/PROJECT_HANDOFF_CN.md`
2. `/Users/zhangmi/竹瑾居网站/README.md`
3. `/Users/zhangmi/竹瑾居网站/DEPLOY_CN.md`
4. `/Users/zhangmi/竹瑾居网站/MAINTENANCE_CN.md`
5. `/Users/zhangmi/竹瑾居网站/lib/content-store.ts`
6. `/Users/zhangmi/竹瑾居网站/lib/admin-media.ts`
7. `/Users/zhangmi/竹瑾居网站/lib/github-repo.ts`
8. `/Users/zhangmi/竹瑾居网站/lib/vercel-deploy.ts`
9. `/Users/zhangmi/竹瑾居网站/app/api/admin/upload/route.ts`
10. `/Users/zhangmi/竹瑾居网站/app/api/admin/media-field/route.ts`

## 12. 给下一个账号的一句提醒

这个项目现在最容易踩坑的地方，不是页面样式本身，而是：

- 前端定稿内容与后台可编辑内容的边界
- GitHub 内容写回
- 图片文件上传和内容字段绑定不是同一件事
- Vercel 部署成功也不等于内容已经绑对

如果先把这四件事分开看，排查会快很多。
