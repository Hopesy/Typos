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

部署、更新、发布文章的操作步骤见 [部署专题](docs/design/deployment.md)。

## 文档与接续入口

- [AGENTS.md](AGENTS.md)：项目协作导航与记录约定。
- [架构总览](docs/ARCHITECTURE.md)：模块、数据流和运行边界。
- [详细 TODO / 当前计划](docs/exec-plans/active/2026-11-13-project-hardening.md)：优先级、任务依赖、验收标准与接续摘要。
- [数据库与迁移](docs/design/database.md)、[API 与 Token](docs/design/api.md)、[渲染与 CPU](docs/design/rendering.md)、[后台编辑器](docs/design/editor.md)：现行专题。
- [历史修复记录](docs/histories/2026-08/20260814-project-audit.md)：既有变更与当时的验证依据，不代表当前版本已重新验证。

应用源码、资源、迁移与构建目录维持原布局；TODO 和进度只维护在当前计划，不另设重复清单。

## 功能

- 文章合集：Markdown 正文、目录、分类、摘要和评论。
- 日常记录：按日期管理的短内容时间线。
- 照片瞬间：支持图片 URL 和简短说明。
- 后台管理：`/admin` 使用密码登录，内容写入 D1。
- 评论系统：评论和管理员回复写入 D1。
- API 上传：`/admin` 生成 API 密钥后，可通过 `POST /api/v1/posts` 用 Bearer Token 上传文章（支持 JSON 和 Markdown）。
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

使用 Node.js 22、npm 10，按锁文件安装依赖：

```bash
npm ci
npm run db:migrate
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
| `npm test` | Vitest 回归测试 |
| `npm run build` | Next.js 构建 |
| `npm run build:worker` | OpenNext Cloudflare Worker 构建（Linux/CI） |
| `npm run preview` | OpenNext Workers runtime 预览 |
| `npm run db:migrate` | 本地 libSQL 文件迁移 |
| `npm run db:migrations:apply` | 应用远端 D1 migration |
| `npm run db:migrations:apply:local` | 应用本地 D1 migration |

## 内容数据

数据库边界固定为 Cloudflare D1、Turso/libSQL 和本地 libSQL 文件：

- Cloudflare D1：生产 Worker 通过 `DB` binding 使用。
- Turso/libSQL：设置 `DATABASE_URL=libsql://...` 和 `TURSO_AUTH_TOKEN`。
- 本地 libSQL：未设置 `DATABASE_URL` 时使用 `./data/typos.db`，也可显式设置 `DATABASE_URL=file:...`。

不支持 PostgreSQL、Neon、Supabase 或 Better-SQLite3；数据库连接和查询失败会直接报错，不会伪装成空页面或回退到文件系统。

生产环境优先读取 D1：

- `posts`：文章
- `daily`：日常记录
- `moments`：照片瞬间
- `comments`：评论和回复
- `rate_limits`：评论限流记录
- `api_tokens`：API 上传密钥（哈希存储，支持可选过期时间）

`content/` 目录仅保留为示例和导入素材，不是数据库故障时的运行时回退路径。

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
| `docs/ARCHITECTURE.md` | 架构和专题导航 |
| `docs/exec-plans/` | TODO、里程碑与接续 |
| `docs/histories/` | 已交付变更和验证摘要 |

## 注意

- 不要把 `ADMIN_PASSWORD`、`ADMIN_SESSION_SECRET` 或 Cloudflare token 写进仓库。
- 不要改 D1 binding 名称，代码和部署脚本都要求它叫 `DB`。
- 不要把 Windows 本机 `npm run deploy` 当作常规生产发布方式；生产部署使用 Cloudflare 的 Linux 构建环境。

## 许可证

MIT
