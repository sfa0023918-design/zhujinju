# 竹瑾居官网

竹瑾居官网（https://www.zhujinju.com）及其内容后台。技术栈：Next.js 15 App Router、React 19、TypeScript（strict）、Tailwind CSS 4 + CSS Modules、Node 22.x。

## 先读哪些文件

| 文件 | 内容 |
| --- | --- |
| [`AGENTS.md`](AGENTS.md) | Codex 与 Claude 共用的协作、开发、验证与发布规则（规则的唯一来源） |
| [`CLAUDE.md`](CLAUDE.md) | Claude 专属的环境事项 |
| [`docs/project-status.md`](docs/project-status.md) | 当前状态：已合并版本、当季专题、现行参数、待办。会变化的信息只写在这里 |
| [`PRODUCT.md`](PRODUCT.md) | 用户、定位与品牌原则 |
| [`DESIGN.md`](DESIGN.md) | 当前视觉基线（当代版） |
| [`docs/operations.md`](docs/operations.md) | 内容维护分工、图片上线链路、部署与排查 |
| [`docs/artwork-catalogue-mapping.md`](docs/artwork-catalogue-mapping.md) | 藏品与历年图录页码的对应 |
| [`docs/records/`](docs/records/) | 按日期保存的改动与验收记录。只作历史依据，不是现行规则 |

## 本地运行

```bash
nvm use        # Node 22，见 .nvmrc
npm ci         # 按 package-lock.json 安装
npm run dev    # http://localhost:3000
```

- 后台入口 `/admin/login`。非生产环境没有配置后台变量时，`lib/admin-auth.ts` 提供一个仅本地可用的开发账号；生产环境必须配置 `.env.example` 里的变量。
- 需要本地环境变量时，把 `.env.example` 复制为 `.env.local` 再填写。`.env.local` 已被 git 忽略；不要提交，也不要放入生产密钥。
- 非生产环境优先读本地 `content/site-content.json`。内容读取规则见 `AGENTS.md` 第六节。

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 开发服务器（先生成阅读字体样式） |
| `npm run check` | 依次运行 lint、typecheck、test，提交前必跑 |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript 类型检查（`tsc --noEmit`） |
| `npm test` | Node 内置测试，运行 `tests/*.test.mjs` |
| `npm run build` / `npm run start` | 生产构建 / 本地运行生产构建 |
| `npm run audit:artworks` | 作品数据与图片同步审计（只读） |
| `npm run cleanup:copy` | 规整双语文案。**会改写内容**，先读脚本确认范围 |
| `npm run catalogue:pages` | 把图录 PDF 转为页面图片（会写入文件） |
| `npm run backfill:image-assets` | 回填图片资产字段（python3，会改写内容） |

每次代码改动的最低验证：`npm run check`、`npm run build`、`git diff --check`。页面改动还要做三端预览，见 `AGENTS.md`。

`tests/security-dependencies.test.mjs` 检查已安装依赖的安全行为，必须先用 `npm ci` 按锁定版本安装，否则会因旧版本失败。

## 目录

```text
app/(site)/           公开页面与公开布局（视觉令牌在 site-layout.module.css）
app/admin/            内容后台页面
app/api/admin/        后台接口（保存、上传、排序、翻译、同步状态）
app/api/              其他接口：inquiry（联系表单）、version（线上版本）等
components/           界面组件与对应 *.module.css
lib/                  内容读写、图片路径、排版与拼排算法等工具
lib/data/             代码维护的固定内容、类型定义与生成数据
content/              site-content.json：藏品、展览、文章（后台写回）
public/uploads/       作品、文章、图录图片
public/fonts/         自托管子集字体及授权说明
scripts/              维护、迁移与字体生成脚本
tests/                Node 测试
docs/                 运维、状态与历史记录
```

## 发布

合并到 GitHub `main` 后由 Vercel 自动部署，线上版本用 `/api/version` 核对。合并和发布必须经站主确认，流程见 `AGENTS.md` 第十一节。
