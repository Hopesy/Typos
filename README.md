# Typos

Typos 是一个极简 HUD 风格的个人发布系统，基于 Next.js 16、React 19、Tailwind CSS 4、OpenNext、Cloudflare Workers 和 Cloudflare D1 构建。

当前生产部署方式是 **Cloudflare Workers Git Integration**：Cloudflare 连接现有 GitHub 仓库 `Hopesy/Typos`，每次 `main` 分支推送后在 Cloudflare 的 Linux 构建环境中安装依赖、构建、运行 D1 migration 并部署 Worker。

> 不使用 Deploy to Cloudflare Button。Deploy Button 会把源仓库克隆成新的目标仓库，适合模板分发，不适合维护当前 `Hopesy/Typos` 仓库。

> 不推荐在 Windows 本机执行 `npm run deploy` 作为生产发布方式。OpenNext 在 Windows 原生构建下可能生成线上 runtime 无法加载的 chunk；本项目已经用 Cloudflare Linux 构建环境验证通过。

> 原创来源：<https://github.com/arkleselect/MiniLoad>。Typos 是在 MiniLoad 基础上整理、改名并适配 Cloudflare Workers + D1 Git 集成部署的版本。

## 当前线上状态

| 项目 | 值 |
| --- | --- |
| GitHub 仓库 | `https://github.com/Hopesy/Typos` |
| Cloudflare Worker | `typos` |
| 线上地址 | `https://typos.hopesy.workers.dev` |
| 生产分支 | `main` |
| Cloudflare 构建方式 | Workers Git Integration |
| D1 数据库 | `typos-db` |
| D1 database id | `9c1c8e42-7453-4729-ac55-ca2242af094a` |
| D1 binding | `DB` |

Cloudflare 构建配置：

| 字段 | 值 |
| --- | --- |
| Project name | `typos` |
| Build command | `npm run build` |
| Deploy command | `npm run deploy` |
| Root directory | `/` |

`npm run deploy` 会执行：

```bash
opennextjs-cloudflare build
wrangler d1 migrations apply DB --remote
opennextjs-cloudflare deploy
```

部署成功后已验证：

```txt
GET /                                      -> 200
GET /posts                                 -> 200
GET /posts/hello-typos                     -> 200
GET /api/comments?slug=hello-typos         -> 200
GET /admin                                 -> 200
POST /api/admin/auth                       -> 200
GET /api/admin/list?type=post with session -> 200
```

## 功能特点

- HUD 风格界面：暗色背景、Dither 动态纹理、终端信息块、像素字体和极简导航。
- 多内容类型：支持文章合集、日常时间线、照片瞬间瀑布流、关于页和首页项目展示。
- Markdown 写作：本地开发可读取 `content/` 下的 Markdown，生产环境优先读取 D1。
- 后台管理：内置 `/admin`，使用 HttpOnly cookie session。
- 评论系统：评论写入 Cloudflare D1，包含真实评论 `id`、回复关系、基础限流、蜜罐字段和管理员回复识别。
- Telegram 通知：评论提交后可选通过 Telegram Bot 推送通知。
- Cloudflare Git 集成部署：使用 Workers + `@opennextjs/cloudflare`，不依赖已弃用的 `@cloudflare/next-on-pages`。

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

## 首次部署或重建部署

正常情况下不需要重复做本节。只有删除 Cloudflare 项目、迁移账号、重建 Worker 或从零部署时才使用。

### 1. 准备仓库

确认本地代码已经推送到 GitHub：

```bash
git status --short --branch
git push origin main
```

目标仓库：

```txt
https://github.com/Hopesy/Typos
```

### 2. 准备 D1

当前项目已经使用远端 D1：

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "typos-db",
    "database_id": "9c1c8e42-7453-4729-ac55-ca2242af094a",
    "migrations_dir": "migrations"
  }
]
```

不要改 `binding`，代码和部署脚本都要求它叫 `DB`。

如果是新账号或 D1 已被删除，先手动创建 D1：

```bash
npx wrangler d1 create typos-db
```

把返回的真实 `database_id` 写入 `wrangler.jsonc`，然后提交并推送：

```bash
git add wrangler.jsonc
git commit -m "Pin Cloudflare D1 database"
git push origin main
```

### 3. 清理同名手动 Worker

如果 Cloudflare 中已经存在手动上传版 `typos` Worker，Git Integration 创建同名项目时会报：

```txt
已存在具有该名称的项目。请选择其他名称
```

确认 D1 还在：

```bash
npx wrangler d1 list
```

只删除 Worker，不删除 D1：

```bash
npx wrangler delete typos --force
```

再次确认 `typos-db` 还在：

```bash
npx wrangler d1 list
npx wrangler d1 execute DB --remote --command "SELECT slug, title FROM posts ORDER BY slug;"
```

### 4. 连接 Workers Git Integration

打开 Cloudflare Dashboard：

```txt
https://dash.cloudflare.com/
```

进入：

```txt
Workers & Pages -> Create application -> Continue with GitHub
```

选择：

```txt
GitHub account: Hopesy
Repository: Hopesy/Typos
```

创建 Worker 配置：

```txt
Project name: typos
Build command: npm run build
Deploy command: npm run deploy
Root directory: /
Production branch: main
```

然后点击 `Deploy`。

Cloudflare 应该在 Linux 构建环境里显示类似信息：

```txt
Detected the following tools from environment: npm, nodejs
Installing project dependencies: npm clean-install --progress=false
npm run build
npm run deploy
wrangler d1 migrations apply DB --remote
opennextjs-cloudflare deploy
```

### 5. 设置生产 Secrets

删除旧 Worker 或重建 Worker 后，Worker secrets 会丢失，需要重新设置：

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_SESSION_SECRET
```

生成 session secret：

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

可选变量：

| 变量 | 用途 |
| --- | --- |
| `SITE_URL` | 最终站点 URL，用于评论通知链接 |
| `TELEGRAM_BOT_TOKEN` | Telegram 评论通知 |
| `TELEGRAM_CHAT_ID` | Telegram 评论通知目标 chat |

`SITE_URL` 不是首次部署必填项。Telegram 不启用时不需要设置。

### 6. 验证线上状态

部署完成后检查：

```txt
https://typos.hopesy.workers.dev/
https://typos.hopesy.workers.dev/posts
https://typos.hopesy.workers.dev/posts/hello-typos
https://typos.hopesy.workers.dev/api/comments?slug=hello-typos
https://typos.hopesy.workers.dev/admin
```

命令行 smoke test：

```powershell
$urls = @(
  'https://typos.hopesy.workers.dev/',
  'https://typos.hopesy.workers.dev/posts',
  'https://typos.hopesy.workers.dev/posts/hello-typos',
  'https://typos.hopesy.workers.dev/api/comments?slug=hello-typos',
  'https://typos.hopesy.workers.dev/admin'
)

foreach ($url in $urls) {
  $res = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30
  "$($res.StatusCode) $url"
}
```

## 日常更新流程

这是以后最常用的流程。

### 代码、样式、文档更新

1. 本地修改代码。
2. 运行验证：

   ```bash
   npm run lint
   npx tsc --noEmit
   npm run build
   ```

3. 提交并推送：

   ```bash
   git status --short
   git add <changed-files>
   git commit -m "Describe the change"
   git push origin main
   ```

4. Cloudflare Workers Git Integration 会自动构建和部署。
5. 到 Cloudflare Dashboard 查看构建日志：

   ```txt
   Workers & Pages -> typos -> Deployments / Builds
   ```

6. 验证线上地址：

   ```txt
   https://typos.hopesy.workers.dev/
   ```

### 数据库 schema 或 migration 更新

新增 migration 文件：

```txt
migrations/0003_describe_change.sql
```

本地先验证：

```bash
npm run db:migrations:apply:local
npm run lint
npx tsc --noEmit
npm run build
```

提交推送：

```bash
git add migrations/0003_describe_change.sql
git commit -m "Add D1 migration"
git push origin main
```

Cloudflare 的 `npm run deploy` 会在发布 Worker 前执行：

```bash
wrangler d1 migrations apply DB --remote
```

### 普通内容发布

生产环境优先读取 D1。日常写文章、改文章、删文章，推荐直接使用线上后台：

```txt
https://typos.hopesy.workers.dev/admin
```

这类内容变更写入 D1，不需要 `git push`，也不会触发重新部署。

### GitOps 内容导入

如果你希望内容变更进入 Git 历史，或需要批量导入，可以新增 D1 migration。

示例：

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

提交推送后，Cloudflare 会自动运行远端 migration。这个方式适合批量导入和版本化内容，不适合日常频繁写作。

## 手动兜底流程

优先使用 Cloudflare Git Integration。下面流程只用于排障或紧急恢复。

### 重新触发 Cloudflare 构建

```txt
Workers & Pages -> typos -> Deployments / Builds -> Retry build
```

这是首选兜底方式，因为仍然使用 Cloudflare Linux 构建环境。

### 只重新设置 Secret

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_SESSION_SECRET
```

设置 secret 会生成新的 Worker version。设置后重新验证 `/admin` 登录。

### 手动检查远端 D1

```bash
npx wrangler d1 list
npx wrangler d1 execute DB --remote --command "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name;"
npx wrangler d1 execute DB --remote --command "SELECT slug, title FROM posts ORDER BY slug;"
```

### 本机 Wrangler 部署

不要在 Windows 原生环境把 `npm run deploy` 当作常规生产发布方式。OpenNext 已提示 Windows runtime 兼容性风险，本项目曾出现 Windows 构建上传后线上 `ChunkLoadError` 和 500。

如果必须手动部署，使用 Linux/WSL/CI 环境，并确保构建出的 `.open-next/worker.js` 来自 Linux 环境：

```bash
npm ci
npm run deploy
```

部署后必须验证：

```txt
GET /posts/hello-typos -> 200
GET /api/comments?slug=hello-typos -> 200
POST /api/admin/auth -> 200
```

## 本地开发

安装依赖：

```bash
npm install
```

本地使用 `/admin` 前，创建 `.env.local`：

```txt
ADMIN_PASSWORD=your-local-password
ADMIN_SESSION_SECRET=your-local-session-secret
```

启动开发服务：

```bash
npm run dev
```

访问：

```txt
http://localhost:3000
```

本地应用 D1 migration：

```bash
npm run db:migrations:apply:local
```

Workers runtime 预览：

```bash
npm run preview
```

Windows 原生 `npm run preview` 如果出现 OpenNext chunk/runtime 问题，用 Cloudflare 构建环境或 Linux 环境复验。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动 Next.js 本地开发服务 |
| `npm run build` | 执行 Next.js 构建 |
| `npm run lint` | 运行 ESLint |
| `npx tsc --noEmit` | TypeScript 类型检查 |
| `npm run preview` | 构建并在本地 Workers runtime 中预览 |
| `npm run deploy` | OpenNext 构建、远端 D1 migration、部署 Worker |
| `npm run db:migrations:apply` | 应用远端 D1 migration |
| `npm run db:migrations:apply:local` | 应用本地 D1 migration |
| `npm run cf-typegen` | 根据 Wrangler 配置生成 Cloudflare 类型 |

## D1 数据表

`migrations/0001_init.sql` 会创建：

- `posts`：文章数据
- `daily`：日常日志
- `moments`：照片瞬间
- `comments`：评论和回复，使用 `id TEXT PRIMARY KEY`
- `rate_limits`：评论限流记录

`migrations/0002_seed_content.sql` 会写入示例文章 `hello-typos`，确保首次部署后站点有可见内容。

## 个性化配置

- 首页内容：`src/app/page.tsx`
- 顶部导航：`src/components/header.tsx`
- 关于页文案：`src/app/about/page.tsx`
- 全局样式：`src/app/globals.css`
- 内容读取与 Markdown 渲染：`src/lib/content.ts`
- 后台数据读写：`src/lib/admin-content.ts`
- Cloudflare 配置：`wrangler.jsonc`

## 故障排查

### GitHub 仓库不可见

检查 Cloudflare GitHub App 是否有 `Hopesy/Typos` 权限：

```txt
Workers & Pages -> Create application -> Continue with GitHub
```

如果看不到仓库，重新配置 GitHub 连接权限。

### 项目名已存在

如果创建 Git Integration 时提示 `typos` 已存在，说明 Cloudflare 已有同名 Worker。

确认不是误删 D1 后，删除旧 Worker：

```bash
npx wrangler d1 list
npx wrangler delete typos --force
```

然后重新走 Git Integration 创建。

### D1 绑定错误

确认 `wrangler.jsonc` 里：

```txt
binding: DB
database_name: typos-db
database_id: 9c1c8e42-7453-4729-ac55-ca2242af094a
```

远端检查：

```bash
npx wrangler d1 execute DB --remote --command "SELECT slug, title FROM posts ORDER BY slug;"
```

### 后台登录失败

重新设置：

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_SESSION_SECRET
```

确认浏览器访问的是同一个域名：

```txt
https://typos.hopesy.workers.dev/admin
```

### 线上 500 或 ChunkLoadError

不要用 Windows 本机构建结果覆盖生产 Worker。到 Cloudflare Dashboard 里重试 Git Integration 构建：

```txt
Workers & Pages -> typos -> Deployments / Builds -> Retry build
```

## 许可证

本项目使用 MIT License，详情见 `LICENSE`。
