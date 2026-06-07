# Typos

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/YOUR_GITHUB_USERNAME/typos)

Typos 是一个极简 HUD 风格的个人发布系统，基于 Next.js 16、React 19、Tailwind CSS 4、OpenNext、Cloudflare Workers 和 Cloudflare D1 构建。目标部署方式是：上传到公开 GitHub 仓库后，点击上方 Deploy to Cloudflare 按钮，由 Cloudflare 创建 Worker、绑定 D1、运行迁移并部署。

> 上方按钮里的 `https://github.com/YOUR_GITHUB_USERNAME/typos` 是占位地址。上传仓库后，把它替换成你的公开 GitHub 仓库 URL。

> 原创来源：<https://github.com/arkleselect/MiniLoad>。Typos 是在 MiniLoad 基础上整理、改名并适配 Cloudflare Workers + D1 一键部署的版本。

## 功能特点

- HUD 风格界面：暗色背景、Dither 动态纹理、终端信息块、像素字体和极简导航。
- 多内容类型：支持文章合集、日常时间线、照片瞬间瀑布流、关于页和首页项目展示。
- Markdown 写作：本地开发可读取 `content/` 下的 Markdown，生产环境优先读取 D1。
- 后台管理：内置 `/admin`，使用 HttpOnly cookie session，不再把后台密码保存到浏览器 `localStorage`。
- 评论系统：评论写入 Cloudflare D1，包含真实评论 `id`、回复关系、基础限流、蜜罐字段和管理员回复识别。
- Telegram 通知：评论提交后可选通过 Telegram Bot 推送通知。
- Cloudflare 一键部署：使用 Workers + `@opennextjs/cloudflare`，不依赖已弃用的 `@cloudflare/next-on-pages`。

## 技术栈

- Next.js 16 / App Router
- React 19
- TypeScript
- Tailwind CSS 4
- OpenNext Cloudflare adapter
- Cloudflare Workers / Workers Assets / D1
- Unified / Remark / Rehype
- GSAP、Motion、Three.js、OGL

## 页面结构

| 路径 | 说明 |
| --- | --- |
| `/` | 首页，包含动态背景、状态栏、精选信息、工具区和书架区 |
| `/posts` | 文章列表 |
| `/posts/[slug]` | 文章详情，包含 Markdown 渲染、目录和评论 |
| `/daily` | 日常日志时间线 |
| `/moments` | 照片瞬间瀑布流 |
| `/about` | 关于页 |
| `/admin` | 内容管理后台 |

## 一键部署到 Cloudflare

1. 把项目上传到一个公开 GitHub 仓库。
2. 修改 README 顶部按钮 URL，把 `YOUR_GITHUB_USERNAME/typos` 换成你的仓库地址。
3. 点击 Deploy to Cloudflare 按钮。
4. 在 Cloudflare 页面按提示连接仓库并确认创建资源。
5. 设置首次部署变量。`ADMIN_PASSWORD` 和 `ADMIN_SESSION_SECRET` 需要手动填写，项目不提供默认值；非生产分支构建建议先关闭。

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `ADMIN_PASSWORD` | 是 | `/admin` 后台登录密码。Cloudflare 不会自动生成，项目也不提供默认值；使用你自己保存的长随机值。 |
| `ADMIN_SESSION_SECRET` | 是 | 后台 session 签名密钥。Cloudflare 不会自动生成，项目也不提供默认值；可用 `openssl rand -hex 32` 或 Node crypto 生成。 |

`SITE_URL` 不是首次部署必填项，也不应放进 Deploy to Cloudflare 表单。部署成功拿到 Cloudflare URL 或绑定自定义域名后，再到 Cloudflare dashboard 的 runtime variables 中设置；未设置时评论通知会使用当前请求来源作为链接前缀。

Telegram 评论通知是可选功能，不应参与首次 Deploy to Cloudflare 表单。需要启用时，在部署成功后到 Cloudflare dashboard 的 runtime variables / secrets 中添加 `TELEGRAM_BOT_TOKEN` 和 `TELEGRAM_CHAT_ID`。

部署脚本会执行：

```bash
opennextjs-cloudflare build
wrangler d1 migrations apply DB --remote
opennextjs-cloudflare deploy
```

`wrangler.jsonc` 中声明了 D1 绑定 `DB`，`migrations/` 中包含初始化 schema 和示例文章 seed。Cloudflare Deploy flow 会读取 Wrangler 配置和 `package.json.cloudflare.bindings` 中的说明来创建或提示配置资源。

## 本地开发

安装依赖：

```bash
npm install
```

本地使用 `/admin` 前，创建 `.env.local` 并写入你自己生成的 `ADMIN_PASSWORD` 和 `ADMIN_SESSION_SECRET`。`SITE_URL`、`TELEGRAM_BOT_TOKEN`、`TELEGRAM_CHAT_ID` 都是可选项，本地不启用评论通知时可以不设置。

启动 Next.js 本地开发服务：

```bash
npm run dev
```

访问：

```txt
http://localhost:3000
```

本地开发默认会从 `content/` 读取 Markdown。需要测试 D1 时，先应用本地迁移：

```bash
npm run db:migrations:apply:local
```

然后使用 Workers runtime 预览：

```bash
npm run preview
```

> OpenNext 在 Windows 原生环境会提示 runtime 兼容性风险。如果 `npm run preview` 在 Windows 上出现 `ChunkLoadError`，请用 WSL/Linux 或 Cloudflare 构建环境复验 Workers runtime。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动 Next.js 本地开发服务 |
| `npm run build` | 执行 Next.js 构建 |
| `npm run lint` | 运行 ESLint |
| `npm run preview` | 构建并在本地 Workers runtime 中预览 |
| `npm run deploy` | 构建、应用远程 D1 migration、部署到 Cloudflare Workers |
| `npm run cf-typegen` | 根据 Wrangler 配置生成 Cloudflare 类型 |

## 内容写作

生产环境中，只要 Cloudflare D1 绑定 `DB` 存在，页面会优先读取 D1。日常写文章、改文章、删文章，推荐直接使用线上 `/admin` 后台，不需要重新部署，也不需要 `git push`。

### 推荐流程：通过 `/admin` 发布

打开后台：

```txt
https://你的域名/admin
```

使用部署时设置的 `ADMIN_PASSWORD` 登录。

发布文章时选择 `post`，填写：

| 字段 | 说明 |
| --- | --- |
| `Title` | 文章标题 |
| `Date` | 发布日期 |
| `Description` | 文章摘要 |
| `Slug` | URL 路径，例如 `my-first-post` |
| `Category` | 分类 |
| `Content` | Markdown 正文 |

保存后会直接写入 Cloudflare D1，并立即在前台生效：

```txt
https://你的域名/posts/my-first-post
```

发布日常日志时选择 `daily`，填写：

| 字段 | 说明 |
| --- | --- |
| `Date` | 日期 |
| `Image URL` | 可选图片地址 |
| `Log` | 日志正文 |

发布照片瞬间时选择 `moment`，填写：

| 字段 | 说明 |
| --- | --- |
| `Title` | 标题 |
| `Date` | 日期 |
| `Image URL` | 图片地址 |
| `Caption` | 说明文字 |

### 什么时候需要推送代码

普通内容发布不需要推送代码。只有这些情况需要 `git commit` / `git push` 并触发 Cloudflare 重新部署：

- 修改页面样式或组件代码。
- 修改后台功能。
- 修改数据库 schema 或新增 migration。
- 修改 README / DEPLOY 文档。
- 修改首页、关于页等写在源码里的内容。

### GitOps 方式：用 D1 migration 发布文章

如果你希望文章变更进入 Git 历史，或者要批量导入内容，可以新增 D1 migration。例如创建：

```txt
migrations/0003_add_my_first_post.sql
```

写入：

```sql
INSERT OR REPLACE INTO posts (slug, title, date, description, category, content)
VALUES (
  'my-first-post',
  '我的第一篇文章',
  '2026-06-06',
  '文章摘要',
  '随笔',
  '# 我的第一篇文章

这里是 Markdown 正文。'
);
```

然后提交并推送：

```bash
git add migrations/0003_add_my_first_post.sql
git commit -m "Add my first post"
git push
```

Cloudflare 重新部署时会执行远端 D1 migration：

```bash
wrangler d1 migrations apply DB --remote
```

这个方式适合批量导入、版本化内容变更、从旧站迁移内容；不适合日常频繁写作和改错字。

### 本地 Markdown fallback

本地开发没有 D1 绑定时，会回退读取 `content/` 下的 Markdown。文章放在 `content/posts/`，文件名会作为文章 slug，例如：

```txt
content/posts/hello-typos.md
```

文章 Front Matter 示例：

```md
---
title: "Hello Typos"
date: 2026-01-01
description: "Welcome to the Typos publishing system"
category: "Getting Started"
---

# Hello Typos

这里是文章正文。
```

日常日志放在 `content/daily/`，照片瞬间放在 `content/moments/`。这些 Markdown 文件主要用于本地开发 fallback 和初始示例内容；生产环境绑定 D1 后，不要把“只改 Markdown 后 git push”当作日常发布主流程。

## D1 数据表

`migrations/0001_init.sql` 会创建：

- `posts`：文章数据
- `daily`：日常日志
- `moments`：照片瞬间
- `comments`：评论和回复，使用 `id TEXT PRIMARY KEY`
- `rate_limits`：评论限流记录

`migrations/0002_seed_content.sql` 会写入一篇示例文章，确保首次部署后站点有可见内容。

## 个性化配置

- 首页内容：`src/app/page.tsx`
- 顶部导航：`src/components/header.tsx`
- 关于页文案：`src/app/about/page.tsx`
- 全局样式：`src/app/globals.css`
- 内容读取与 Markdown 渲染：`src/lib/content.ts`
- 后台数据读写：`src/lib/admin-content.ts`
- Cloudflare 配置：`wrangler.jsonc`

## 许可证

本项目使用 MIT License，详情见 `LICENSE`。
