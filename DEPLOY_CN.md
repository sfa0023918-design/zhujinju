# 竹瑾居网站部署说明

这份文档写给非技术用户。你不需要懂编程，只要按步骤操作，就可以把竹瑾居网站发布到线上。

---

## 一、上线前先知道两件事

1. 网站代码已经准备好，可以直接部署。
2. 你需要准备两个账号：
   - GitHub：用来保存网站代码
   - Vercel：用来把网站发布到线上

建议你使用电脑操作，不要只用手机。

---

## 二、注册 GitHub 并创建仓库

### 1. 注册 GitHub

1. 打开 [https://github.com](https://github.com)
2. 点击右上角 `Sign up`
3. 按提示填写邮箱、密码、用户名
4. 完成邮箱验证

### 2. 新建仓库

1. 登录 GitHub 后，点击右上角 `+`
2. 选择 `New repository`
3. 仓库名称填写：`zhujinju-site`
4. 选择 `Public` 或 `Private`
   - 如果只是自己使用，选 `Private` 也可以
5. 不要勾选自动生成 README、`.gitignore` 或 License
   - 因为项目里已经有这些文件或已有结构
6. 点击 `Create repository`

创建完成后，GitHub 会显示一个空仓库页面。

---

## 三、把项目上传到 GitHub

推荐使用最简单的方法：GitHub Desktop。

### 方法 A：推荐，用 GitHub Desktop 上传

#### 1. 安装 GitHub Desktop

1. 打开 [https://desktop.github.com](https://desktop.github.com)
2. 下载并安装
3. 用你的 GitHub 账号登录

#### 2. 把项目加入 GitHub Desktop

1. 打开 GitHub Desktop
2. 点击 `File` → `Add local repository`
3. 选择你的项目文件夹：
   `竹瑾居网站`
4. 如果提示“这不是一个 Git 仓库”，点击 `create a repository`
5. 填写仓库名称：`zhujinju-site`
6. 点击 `Create repository`

#### 3. 发布到 GitHub

1. 在 GitHub Desktop 左侧确认文件列表正常
2. 在左下角填写提交说明，例如：
   `网站第一版`
3. 点击 `Commit to main`
4. 再点击顶部 `Publish repository`
5. 选择是否公开
6. 点击 `Publish repository`

完成后，代码就上传到 GitHub 了。

### 方法 B：网页上传（只适合完全不会用 Git 的情况）

1. 打开刚才创建的 GitHub 仓库页面
2. 点击 `uploading an existing file`
3. 把项目文件拖进去
4. 注意不要上传这些目录：
   - `node_modules`
   - `.next`
5. 填写提交说明
6. 点击 `Commit changes`

如果项目文件较多，网页上传容易出错，所以仍然建议使用 GitHub Desktop。

---

## 四、注册 / 登录 Vercel

### 1. 注册 Vercel

1. 打开 [https://vercel.com](https://vercel.com)
2. 点击 `Sign Up`
3. 选择 `Continue with GitHub`
4. 用刚才的 GitHub 账号登录

这样做的好处是：以后 Vercel 可以直接读取你的 GitHub 仓库并自动部署。

---

## 五、把 GitHub 项目导入到 Vercel

### 1. 导入项目

1. 登录 Vercel 后，进入控制台
2. 点击 `Add New...`
3. 选择 `Project`
4. 在项目列表里找到 `zhujinju-site`
5. 点击 `Import`

### 2. 检查部署设置

通常 Vercel 会自动识别这是一个 Next.js 项目。

你只需要确认这些内容：

- Framework Preset：`Next.js`
- Root Directory：保持默认
- Build Command：保持默认即可
- Output Directory：保持默认

如果看到了 Node 版本设置，建议选择 `22.x`。

### 3. 环境变量

当前这个项目首版不依赖环境变量，所以这里可以先不填任何内容，直接部署。

### 4. 开始第一次部署

点击 `Deploy`

等待 1 到 3 分钟左右，Vercel 会自动完成构建和发布。

---

## 六、如何查看线上预览地址

部署完成后，Vercel 会给你一个默认地址，通常长这样：

`https://zhujinju-site-xxxxx.vercel.app`

你可以在以下位置找到它：

1. 部署成功页面
2. 项目首页顶部
3. `Domains` 页面中的默认域名

这个地址已经可以直接打开网站，用来预览和分享都可以。

---

## 七、以后如何更新网站

以后你只需要更新 GitHub 仓库，Vercel 就会自动重新部署。

如果你使用 GitHub Desktop，流程是：

1. 修改项目文件
2. 打开 GitHub Desktop
3. 填写提交说明
4. 点击 `Commit to main`
5. 点击 `Push origin`

推送完成后，Vercel 会自动开始新一轮部署。

---

## 八、如何购买域名

你可以在这些常见平台购买域名：

- 阿里云万网
- 腾讯云
- Namecheap
- GoDaddy
- Squarespace Domains

建议优先购买：

- `zhujinju.com`
- 如果已被注册，再考虑：
  - `zhujinju.art`
  - `zhujinju.cn`
  - `zhujinju.co`

如果你希望与当前站点默认设置保持一致，建议购买：

`zhujinju.com`

---

## 九、如何把域名绑定到 Vercel

这里以希望使用以下两个地址为例：

- 主域名：`zhujinju.com`
- 常用访问域名：`www.zhujinju.com`

### 1. 在 Vercel 添加域名

1. 打开你的 Vercel 项目
2. 点击 `Settings`
3. 点击 `Domains`
4. 在输入框中先添加：
   - `zhujinju.com`
5. 再添加：
   - `www.zhujinju.com`

添加后，Vercel 会告诉你应该如何配置 DNS。

---

## 十、DNS 应该怎么配

DNS 是“域名指向哪里”的设置。你需要回到购买域名的平台去配置。

### 情况 1：配置主域名 `zhujinju.com`

主域名也叫 apex 域名，意思是不带 `www` 的域名。

通常这样配置：

- 记录类型：`A`
- 主机记录：`@`
- 记录值：`76.76.21.21`

这是 Vercel 常用的 apex 域名指向方式。

### 情况 2：配置 `www.zhujinju.com`

通常这样配置：

- 记录类型：`CNAME`
- 主机记录：`www`
- 记录值：`cname.vercel-dns.com`

---

## 十一、建议的最终访问方式

推荐做法是：

- 让 `www.zhujinju.com` 成为主要对外网址
- 让 `zhujinju.com` 自动跳转到 `www.zhujinju.com`

这样更统一，也更容易管理。

在 Vercel 的 `Domains` 页面里，你可以把 `www.zhujinju.com` 设置为主域名。

---

## 十二、DNS 配完后多久生效

一般是几分钟到几小时。

常见情况：

- 很快：5 到 15 分钟
- 正常：30 分钟到 2 小时
- 偶尔较慢：最长 24 小时

---

## 十三、怎么检查域名是否已经生效

### 方法 1：直接打开浏览器访问

依次测试：

- `https://zhujinju.com`
- `https://www.zhujinju.com`

如果能打开网站，就说明已经生效。

### 方法 2：看 Vercel 后台状态

进入：

`Project` → `Settings` → `Domains`

如果域名旁边显示：

- `Valid Configuration`

就说明 DNS 配置正确了。

---

## 十四、常见报错与排查方法

### 1. Vercel 提示构建失败

排查顺序：

1. 确认 GitHub 仓库代码已经完整上传
2. 确认没有把 `node_modules` 和 `.next` 当成必须文件
3. 确认 Vercel 识别为 `Next.js`
4. 确认没有额外环境变量缺失
5. 重新点击 `Redeploy`

### 2. 域名添加后一直打不开

常见原因：

1. DNS 记录填错了
2. 主机记录写错了
   - `@` 代表主域名
   - `www` 代表 `www` 子域名
3. 还在等待 DNS 生效
4. 域名没有完成实名认证或未正式生效

### 3. 打开 `zhujinju.com` 可以，`www.zhujinju.com` 不可以

通常是 `www` 的 `CNAME` 记录没有配好。

检查：

- 类型是否为 `CNAME`
- 主机记录是否为 `www`
- 记录值是否为 `cname.vercel-dns.com`

### 4. 打开 `www.zhujinju.com` 可以，主域名不可以

通常是 apex 域名的 `A` 记录没有配好。

检查：

- 类型是否为 `A`
- 主机记录是否为 `@`
- 记录值是否为 `76.76.21.21`

### 5. GitHub 更新了，但 Vercel 没自动更新

检查：

1. 你是否真的把修改推送到了 GitHub
2. 打开 Vercel 项目首页，看最新部署是否触发
3. 如果没有触发，点击 `Redeploy`

---

## 十五、正式上线前建议再做一次检查

上线前请逐项确认：

- 网站每个页面都能打开
- 手机和电脑都能正常浏览
- 联系方式已换成真实信息
- 域名已绑定成功
- 首页标题、描述、分享图已确认
- 所有占位图片是否要替换为正式图片
- 联系表单是否要接入真实邮箱或客服系统

---

## 十六、当前项目里哪些地方以后最常改

你最常改的通常是下面这些位置：

- 网站名、域名、联系方式：
  `lib/site-config.ts`
- 品牌简介、作品、展览、文章：
  `lib/data/`
- 页面结构与样式：
  `app/` 与 `components/`

---

## 十七、建议的真实上线顺序

1. 先把网站部署到 Vercel 默认地址
2. 自己检查页面是否正常
3. 再购买域名
4. 再绑定自定义域名
5. 再替换真实联系方式与正式图片
6. 最后正式对外发布
