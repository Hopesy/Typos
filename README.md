# Typos

Typos 是一个极简 HUD 风格的个人发布系统，基于 Next.js、React、Tailwind CSS、OpenNext、Cloudflare Workers 和 Cloudflare D1 构建。

原创来源：<https://github.com/arkleselect/MiniLoad>。Typos 是在 MiniLoad 基础上整理、改名并适配 Cloudflare Workers + D1 Git 集成部署的版本。

## 当前状态

| 项目 | 值 |
| --- | --- |
| 线上地址 | <https://typos.hopesy.workers.dev> |
| GitHub 仓库 | <https://github.com/Hopesy/Typos> |
| Cloudflare Worker | `typos` |
| 部署方式 | Workers Git Integration |
| D1 数据库 | `typos-db` |
| D1 binding | `DB` |

部署、更新、发布文章的操作步骤见 [DEPLOY.md](./DEPLOY.md)。

## 功能

- 文章合集：Markdown 正文、目录、分类、摘要和评论。
- 日常记录：按日期管理的短内容时间线。
- 照片瞬间：支持图片 URL 和简短说明。
- 后台管理：`/admin` 使用密码登录，内容写入 D1。
- 评论系统：评论和管理员回复写入 D1。
- Cloudflare 部署：Git push 后由 Cloudflare 自动构建和发布。

## 页面

| 路径 | 说明 |
| --- | --- |
| `/` | 首页 |
| `/posts` | 文章列表 |
| `/posts/[slug]` | 文章详情 |
| `/daily` | 日常记录 |
| `/moments` | 照片瞬间 |
| `/about` | 关于页 |
| `/admin` | 内容管理后台 |

## 技术栈

- Next.js 16 / App Router
- React 19
- TypeScript
- Tailwind CSS 4
- OpenNext Cloudflare adapter
- Cloudflare Workers / Workers Assets / D1
- Unified / Remark / Rehype
- GSAP、Motion、Three.js、OGL

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

常用命令：

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 本地开发 |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | TypeScript 类型检查 |
| `npm run build` | Next.js 构建 |
| `npm run preview` | OpenNext Workers runtime 预览 |
| `npm run db:migrations:apply` | 应用远端 D1 migration |
| `npm run db:migrations:apply:local` | 应用本地 D1 migration |

## 内容数据

生产环境优先读取 D1：

- `posts`：文章
- `daily`：日常记录
- `moments`：照片瞬间
- `comments`：评论和回复
- `rate_limits`：评论限流记录

本地没有 D1 时，内容读取会回退到 `content/` 下的 Markdown 文件。

## 项目入口

| 文件 | 说明 |
| --- | --- |
| `src/app/page.tsx` | 首页 |
| `src/app/about/page.tsx` | 关于页 |
| `src/app/admin/page.tsx` | 后台页面 |
| `src/components/header.tsx` | 顶部导航 |
| `src/app/globals.css` | 全局样式 |
| `src/lib/content.ts` | 内容读取与 Markdown 渲染 |
| `src/lib/admin-content.ts` | 后台内容读写 |
| `wrangler.jsonc` | Cloudflare Worker 和 D1 配置 |
| `migrations/` | D1 migration |

## 注意

- 不要把 `ADMIN_PASSWORD`、`ADMIN_SESSION_SECRET` 或 Cloudflare token 写进仓库。
- 不要改 D1 binding 名称，代码和部署脚本都要求它叫 `DB`。
- 不要把 Windows 本机 `npm run deploy` 当作常规生产发布方式；生产部署使用 Cloudflare 的 Linux 构建环境。

## 许可证

MIT
