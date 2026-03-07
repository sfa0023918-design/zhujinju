# 竹瑾居网站

竹瑾居是一家专注于喜马拉雅艺术、藏传佛教艺术及相关亚洲古代艺术的品牌。本项目是竹瑾居中文官网的生产级版本，采用内容驱动、作品优先的结构，并内置一个可登录的内容后台。

## 技术栈

- Next.js 15
- TypeScript
- Tailwind CSS 4
- App Router
- GitHub Contents API（后台保存）

## 本地启动

1. 安装 Node.js 22 或更高版本。
2. 在项目目录执行：

```bash
npm install
npm run dev
```

3. 浏览器打开 [http://localhost:3000](http://localhost:3000)。

## 内容后台

- 登录地址：`/admin/login`
- 本地开发环境如果未配置环境变量，会自动启用一个仅本地可用的默认管理员账号。
- 生产环境必须配置 `.env.example` 中列出的后台变量。

后台工作方式：

1. 管理员在 `/admin` 登录。
2. 在网页中编辑各内容分区。
3. 点击保存后，系统会更新 `content/site-content.json`。
4. 如果已配置 GitHub 写回变量，后台会把变更提交回 GitHub 仓库。
5. Vercel 监听到 GitHub 更新后，会自动重新部署正式站点。

## 生产构建

```bash
npm run build
npm run start
```

## 项目目录

```text
app/                页面、路由、接口、SEO 文件
content/            后台写入后的内容文件
components/         通用界面组件
lib/
  data/             mock 数据与类型定义
  content-store.ts  内容读取、保存与 GitHub 写回
  metadata.ts       metadata 生成工具
  site-config.ts    域名、站点名、联系信息等集中配置
public/             预留静态资源目录
README.md           项目说明
DEPLOY_CN.md        中文部署文档
.env.example        环境变量示例
```

## 当前已实现内容

- 首页、藏品列表、藏品详情
- 展览与图录、文章、关于、联系
- 可替换的占位图片方案
- sitemap、robots、Open Graph、favicon
- 联系表单演示接口
- `/admin` 内容后台
- `content/site-content.json` 内容源

## 可替换项

以下内容已集中管理：

- 初始默认内容：`lib/data/`
- 后台实际写入内容：`content/site-content.json`
- 域名与基础链接默认值：`lib/site-config.ts`

## 注意事项

- 当前图片为稳定占位图，适合结构验证与部署演示，不代表最终作品图。
- 当前联系表单仍为本地演示接口，后续建议接入企业邮箱、表单服务或 CRM。
- 线上后台保存依赖 GitHub 写回变量，建议为 `GITHUB_CONTENTS_TOKEN` 使用单仓库、最小权限的 Fine-grained Token。
- Vercel 部署说明请查看 `DEPLOY_CN.md`。
