# 内容维护与发布运维

本文件合并并取代原来的 `PROJECT_HANDOFF_CN.md`、`MAINTENANCE_CN.md`、`DEPLOY_CN.md`。协作与发布的规则以 `AGENTS.md` 为准，本文件只说明系统怎样运作、出了问题怎样排查。

## 1. 内容在哪里改

同一类内容只在一处维护，不要代码和后台各改一遍。

| 内容 | 在哪里改 |
| --- | --- |
| 首页固定文案、关于、联系、页脚、品牌信息、SEO、页面固定标题与说明 | 代码：`lib/site-config.ts`、`lib/data/home-content.ts`、`lib/data/page-copy.ts`、`lib/data/brand.ts` 等 |
| 藏品、展览与图录、文章（文字、状态、图片、排序） | 后台 `/admin`，写入 `content/site-content.json` |

`content/site-content.json` 只保存 `artworks`、`exhibitions`、`articles` 三类内容。不要把静态页面字段写回这个文件，否则后台保存时可能覆盖代码中的定稿文案。

## 2. 正式站读取哪份内容

- 生产环境配置了 GitHub 内容源时，优先读取远程仓库的 `content/site-content.json`，经 `unstable_cache` 缓存，缓存键含 `VERCEL_GIT_COMMIT_SHA`。
- 非生产环境优先读本地文件，本地不可用时按配置回退到远程。
- 实现在 `lib/content-store.ts`、`lib/github-repo.ts`。

## 3. 图片从上传到在页面上显示

这是四个独立的环节，每一步成功不代表下一步已完成：

1. **上传**：后台把文件写入仓库的 `public/uploads/...`（`app/api/admin/upload/route.ts`）。
2. **绑定**：把图片路径写进对应记录的字段（主图、`imageAsset`、`galleryAssets`、封面等，见 `app/api/admin/media-field/route.ts`、`lib/admin-media.ts`）。
3. **部署**：上传或修改图片字段后，`lib/vercel-deploy.ts` 通过 `VERCEL_DEPLOY_HOOK_URL` 触发一次正式部署，把新文件放进线上产物。
4. **可见**：记录本身处于发布状态，部署完成后页面才会显示。

换图时使用新文件名并更新所有引用，不沿用旧 URL（`public/uploads/` 在线上是长期缓存）。

## 4. 前台没显示时的排查顺序

1. 线上能否直接打开该图片 URL。
2. 图片路径是否真的写进了对应记录的字段（`content/site-content.json` 远程版本）。
3. 该记录是否为发布状态（`draft | published`），不要与销售状态（`inquiry | sold | reserved`）混淆。
4. 最新部署是否完成，`/api/version` 显示的提交是否包含这次改动。

只是内容没有绑定时，重新部署没有意义，应先修正字段。

## 5. 部署

- Vercel 项目 `zhujinju`，通过 GitHub 集成部署：合并到 `main` 自动发布正式站，每个 PR 生成预览地址。
- 正式域名 `www.zhujinju.com`（`zhujinju.com` 跳转到它）。域名与 DNS 已配置完成，不更改。
- `/api/version` 返回线上的提交、分支和 deployment id，发布后用它确认版本。
- 需要命令行核对时（需已登录 Vercel CLI）：`npx vercel@latest ls zhujinju`、`npx vercel@latest inspect <deployment-url>`。

## 6. 环境变量

变量名以 `.env.example` 为准，分为后台登录（`ADMIN_*`）、GitHub 写回（`GITHUB_*`）、`VERCEL_DEPLOY_HOOK_URL`、自动翻译（`OPENAI_*`）、联系邮件（`RESEND_API_KEY`、`INQUIRY_*`）。

生产值只配置在 Vercel 项目设置中。变量名存在不代表生产已经配置或功能已经验收。不回显密钥，不把生产凭据放到本机开发环境。
