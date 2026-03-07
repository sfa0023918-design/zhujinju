# 竹瑾居网站

竹瑾居是一家专注于喜马拉雅艺术、藏传佛教艺术及相关亚洲古代艺术的品牌。本项目是竹瑾居中文官网的生产级第一版，采用内容驱动、作品优先的结构，适合后续继续接入真实图像、CMS 与表单服务后直接上线。

## 技术栈

- Next.js 15
- TypeScript
- Tailwind CSS 4
- App Router

## 本地启动

1. 安装 Node.js 22 或更高版本。
2. 在项目目录执行：

```bash
npm install
npm run dev
```

3. 浏览器打开 [http://localhost:3000](http://localhost:3000)。

## 生产构建

```bash
npm run build
npm run start
```

## 项目目录

```text
app/                页面、路由、接口、SEO 文件
components/         通用界面组件
lib/
  data/             mock 数据与类型定义
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
- mock data 驱动的作品、展览、文章内容
- 可替换的占位图片方案
- sitemap、robots、Open Graph、favicon
- 联系表单演示接口

## 可替换项

以下内容已集中管理，后续替换真实信息时无需全站搜索：

- 站点域名与基础链接：`lib/site-config.ts`
- 联系方式：`lib/site-config.ts`
- 品牌文字与作品数据：`lib/data/`

## 注意事项

- 当前图片为稳定占位图，适合结构验证与部署演示，不代表最终作品图。
- 当前联系表单为本地演示接口，后续建议接入企业邮箱、表单服务或 CRM。
- Vercel 部署说明请查看 `DEPLOY_CN.md`。
