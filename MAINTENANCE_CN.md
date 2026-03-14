# 竹瑾居网站维护说明

这份说明用于避免以后再次出现“前端已经改定稿，但后台一保存又回退”的情况。

## 现在的维护原则

从当前版本开始，这个项目采用下面的单一来源规则：

- 前台定稿内容：只在代码里改
- 高频更新内容：只在后台里改
- `content/site-content.json`：只保存后台真正需要维护的动态内容

请不要再同时在“代码”和“后台”各改一遍同一类内容。

## 哪些内容在代码里修改

以下内容已经固定为代码管理，不再通过后台编辑：

- 首页定稿文案与静态模块文案
- 关于页文案
- 联系页说明文案
- 页脚文案
- 品牌基础信息与 SEO 文案
- 首页品牌主视觉默认值
- 收藏方向与专业信任模块文案
- 其他页面的固定标题、说明、按钮文字

常见文件位置：

- `/Users/zhangmi/竹瑾居网站/lib/site-config.ts`
- `/Users/zhangmi/竹瑾居网站/lib/data/home-content.ts`
- `/Users/zhangmi/竹瑾居网站/lib/data/page-copy.ts`
- `/Users/zhangmi/竹瑾居网站/lib/data/brand.ts`

如果这些页面已经视觉定稿，后续就应该直接改上面的代码文件，不要去后台找对应输入框。

## 哪些内容在后台修改

后台现在只保留 3 类高频内容：

- 藏品 `artworks`
- 展览与图录 `exhibitions`
- 文章 `articles`

后台入口：

- `/admin/content/artworks`
- `/admin/content/exhibitions`
- `/admin/content/articles`

适合在后台做的事情：

- 新增藏品
- 修改藏品文字、状态、图片、排序
- 新增展览、更新图录页、设置是否为当前专题
- 新增文章、修改文章内容与关联关系

## 数据文件现在是什么作用

`/Users/zhangmi/竹瑾居网站/content/site-content.json` 现在只保存：

- `artworks`
- `exhibitions`
- `articles`

也就是说：

- 这个文件不再保存首页、关于、联系、页脚、SEO 这些静态定稿字段
- 后台保存时，也不会再把这些静态字段写回去

这样做的目的，就是防止后台保存动态内容时把前台定稿内容覆盖回旧版本。

## 正确的修改方式

### 情况 1：改首页、关于、联系、页脚、SEO

请改代码，不要进后台。

通常改这些文件：

- `/Users/zhangmi/竹瑾居网站/lib/site-config.ts`
- `/Users/zhangmi/竹瑾居网站/lib/data/home-content.ts`
- `/Users/zhangmi/竹瑾居网站/lib/data/page-copy.ts`
- `/Users/zhangmi/竹瑾居网站/lib/data/brand.ts`

### 情况 2：新增或更新藏品

请进后台：

- `/admin/content/artworks`

### 情况 3：新增或更新展览 / 图录

请进后台：

- `/admin/content/exhibitions`

### 情况 4：新增或更新文章

请进后台：

- `/admin/content/articles`

## 修改前建议

在开始改之前，先问自己一句：

“这次改的是定稿页面文案，还是运营内容数据？”

判断方法：

- 如果它属于页面固定结构的一部分，改代码
- 如果它属于经常新增、上下架、替换、发布的内容，改后台

## 本地检查建议

每次改完，建议至少执行：

```bash
npm run lint
npm run build
```

如果是代码层面的页面文案调整，建议再打开这些页面人工检查：

- `/`
- `/about`
- `/contact`
- `/collection`
- `/exhibitions`
- `/journal`

如果是后台内容调整，建议再检查：

- `/admin`
- `/admin/content/artworks`
- `/admin/content/exhibitions`
- `/admin/content/articles`

## 不建议做的事

- 不要把静态定稿文案重新接回后台
- 不要手动把首页、关于、联系等静态字段重新写回 `content/site-content.json`
- 不要在代码和后台同时维护同一批字段

## 一句话版本

以后维护时请记住：

- 页面定稿内容改代码
- 藏品 / 展览 / 文章改后台

