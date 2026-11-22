# Typos

**ANCHOR FOR CODE & NOTES**

Typos 是独立维护的个人发布系统，用来写文章、记录日常、分享照片，也为常用工具和阅读书架留一个位置。基于 Next.js App Router 构建，部署到 Cloudflare Workers，内容保存在 D1。

界面延续简洁的 HUD 风格，配有 TYPOS 字标、三段中轴导航、中英文切换，以及深色和暖纸白两套主题。

[在线站点](https://typos.hopesy.workers.dev) · [GitHub](https://github.com/Hopesy/Typos) · [Agent 一键部署](#交给-agent-一键部署) · [更新记录](CHANGELOG.md) · [部署文档](docs/design/deployment.md)

## 功能

| 模块 | 能力 |
| --- | --- |
| 文章与阅读 | Markdown 正文、分类、摘要、目录、代码高亮、数学公式、图片灯箱、评论与管理员回复 |
| 写作编辑器 | 实时预览、沉浸模式、精简右键菜单、键盘快捷键、撤销与重做、Markdown 上传与导出、仅后台可见文章 |
| 日常与瞬间 | 短内容时间线、图片与文字记录、独立相册页面 |
| 个人首页 | 活动足迹、状态与地点、常用工具、阅读书架、音乐播放、WebGL 颗粒背景 |
| 管理后台 | 单管理员登录，集中管理文章、日常、瞬间、评论、首页内容和 API 密钥 |
| API 发文 | Bearer Token 鉴权，接收 JSON 或 Markdown，支持指定 slug 更新文章 |
| 显示与交互 | 中英文、深浅主题、响应式布局，移动端与减少动态模式使用静态颗粒背景 |

文章等内容数量来自数据库；仪表盘中的访问量和访问趋势目前使用示例数据。

## 交给 Agent 一键部署

把下面整段复制给具备终端、文件编辑和联网能力的编程 Agent，即可让它执行首次部署。准备好自己的 Cloudflare 账户；采用 Git Integration 时还需要 GitHub 账户。首次登录与平台授权由你在浏览器完成，Agent 随后继续配置和发布。

```text
请帮我把 Typos 部署到我自己的 Cloudflare 账户，实际执行到网站和后台可用。
项目地址：https://github.com/Hopesy/Typos

本次授权：为这次部署创建专用 Worker 和 D1 数据库、配置 Secrets、执行新库迁移并发布；为验收创建并清理临时测试文章。如需 Git Integration，也授权在我的 GitHub 账户新建部署仓库，提交和推送本次部署所需文件。保留当前工作区已有改动，已有线上资源保持原状。

请按以下流程执行，遇到需要我登录、选择账户或提供缺失权限的实际阻塞时再询问，其余步骤连续完成：

1. 获取代码并检查环境
   已有 Typos 工作区时复用，否则克隆项目。先阅读 AGENTS.md、README.md、docs/design/deployment.md 和 docs/design/database.md，核对 package.json 与 wrangler.jsonc。使用 Node.js 22、npm 10 和 npm ci 安装锁定依赖。过程文件统一放在 .Typos-temp/deploy/。

2. 登录并确定资源归属
   用 Wrangler 或可用的 Cloudflare 工具检查当前账户；未登录时引导我完成官方登录。多账户时让我选定目标账户。默认使用 typos、typos-db 作为新 Worker 和新数据库名称，名称已占用时另取唯一名称。凭据通过登录流程或本地安全输入提供。

3. 选择可执行的发布路径
   有可用 Linux/WSL 环境时可用 Wrangler 直接部署；否则优先使用 Cloudflare Git Integration 的 Linux 构建环境。Git Integration 使用我拥有的新部署仓库，origin 指向该仓库；生产分支 main、根目录 /、构建命令 npm run build:worker、部署命令 npm run deploy:worker。需要 GitHub 登录或仓库连接授权时引导我完成。保留项目既定的 Node.js 22、npm 10 环境。

4. 创建独立数据库并更新配置
   创建本次专用 D1，使用创建结果更新 wrangler.jsonc 的 database_name 和 database_id，binding 保持 DB，migrations_dir 保持 migrations。将 Worker 的 name 与 WORKER_SELF_REFERENCE 的 service 同步为本次名称。发布前核对所有资源均属于选定账户和本次新站点，仓库原有名称与数据库 ID 作为配置示例替换。使用默认 workers.dev 地址完成首次上线。

5. 配置管理员
   自动生成随机管理员密码和至少 32 字节随机会话密钥，分别写入目标 Worker 的 ADMIN_PASSWORD、ADMIN_SESSION_SECRET Secrets。在发布前配置好这两项。将管理员登录信息保存到本地 .Typos-temp/deploy/credentials.env，并确认该文件被 Git 忽略；聊天、构建日志和版本库只记录变量名与凭据文件位置。

6. 检查、构建并部署
   执行 npm run lint、npx tsc --noEmit、npm test、npm run build，并完成 Linux 环境下的 npm run build:worker。检查可在本地或配置好的 CI 中执行。直接部署时先完成 Worker 构建，再运行 npm run deploy:worker；Git Integration 则提交必要配置并等待平台构建、迁移和发布完成。deploy:worker 已包含远端 D1 迁移，首次部署的迁移目标为第 4 步新建的数据库。遇到失败查看日志，修复部署问题后重试。

7. 验证并交付
   访问线上首页、文章列表、日常、瞬间、关于和 /admin，核对正常渲染及版本标识。使用生成的密码完成后台登录，创建一篇仅后台可见的临时文章，验证保存和读取、未登录时的访问限制，再删除这篇测试文章。最后给出网站地址、后台地址、Worker/D1 名称、实际发布的版本与提交、管理员凭据文件位置，以及检查结果和后续更新方法；仍有阻塞时明确已完成步骤、具体错误和下一动作。
```

这段提示词适用于**创建新站点**。已有站点升级可沿用[部署专题](docs/design/deployment.md)中的迁移、备份与发布流程。

## 本地运行

环境要求：**Node.js 22、npm 10**。

### 1. 获取项目与依赖

```bash
git clone https://github.com/Hopesy/Typos.git
cd Typos
npm ci
```

### 2. 配置管理员

将 [.env.example](.env.example) 复制为 `.env.local`，填写以下两项：

```dotenv
ADMIN_PASSWORD=your-local-password
ADMIN_SESSION_SECRET=your-random-session-secret
```

后台密码由你自行设置。会话密钥可以用下面的命令生成，再将输出填入 `.env.local`：

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

### 3. 初始化数据库并启动

首次使用默认本地数据库时运行：

```bash
npm run db:migrate
npm run dev
```

默认数据文件为 `data/typos.db`。打开 [本地首页](http://localhost:3000) 或 [管理后台](http://localhost:3000/admin)。

如在 `.env.local` 中配置了自定义 `DATABASE_URL` 或 Turso，请用以下命令替代上面的迁移命令，显式加载同一份配置：

```bash
node --env-file=.env.local scripts/migrate.js
```

已有数据库的升级步骤见[数据库与迁移](docs/design/database.md)。

## 内容管理

访问 `/admin` 登录后，可以新建或编辑文章、上传 Markdown、管理日常与照片、回复评论。文章支持公开展示或仅后台可见；保存后直接更新数据库。

「首页管理」提供状态栏、工具和阅读书架三个入口。文章与日常等活动会汇总到首页足迹。

自动发文时，在后台创建 API 密钥，再通过 `Authorization: Bearer <token>` 调用 `POST /api/v1/posts`。接口支持 JSON 与 Markdown，显式指定 slug 时可更新同一篇文章；字段、示例与响应说明见 [API 与 Token](docs/design/api.md)。

| 页面 | 路径 |
| --- | --- |
| 首页 | `/` |
| 文章合集 / 文章详情 | `/posts` / `/posts/[slug]` |
| 日常 | `/daily` |
| 瞬间相册 | `/moments` |
| 关于 | `/about` |
| 管理后台 | `/admin` |

## 部署到 Cloudflare

推荐使用 **Workers Git Integration + D1**，由 `main` 分支更新触发构建和发布。

1. 在自己的 Cloudflare 账户创建 D1 数据库，并在 [wrangler.jsonc](wrangler.jsonc) 填入对应的 `database_name` 与 `database_id`，数据库 binding 保持为 `DB`。
2. 设置 Worker 名称；`name` 与 `WORKER_SELF_REFERENCE` 对应的 `service` 使用相同名称。
3. 在 Workers Git Integration 中连接自己的仓库，按下表设置构建与部署。
4. 在 Worker 的 Variables and Secrets 中配置 `ADMIN_PASSWORD` 与 `ADMIN_SESSION_SECRET`。

| 设置 | 值 |
| --- | --- |
| 生产分支 | `main` |
| 根目录 | `/` |
| 构建命令 | `npm run build:worker` |
| 部署命令 | `npm run deploy:worker` |
| 运行环境 | Node.js 22、npm 10 |

`deploy:worker` 会先应用远端 D1 迁移，再发布 Worker。升级已有站点前，请按[部署专题](docs/design/deployment.md)与[数据库专题](docs/design/database.md)核对迁移和备份。

代码和静态资源通过 Git 发布；后台文章与首页内容保存到数据库，保存后即可生效。Git 仓库与数据库分别备份，环境密钥保存在本地环境文件或 Cloudflare Secrets。

## 个性化配置

| 内容 | 配置入口 |
| --- | --- |
| 状态、地点、工具、阅读书架 | 后台 → 首页管理 |
| 音乐曲目与音源 | [src/lib/home-music.ts](src/lib/home-music.ts)；音频文件位于 [public/audio/](public/audio/)，来源记录见 [LICENSE.md](public/audio/LICENSE.md) |
| 标志与完整字标 | [public/brand/typos/](public/brand/typos/) 与 [brand-mark.tsx](src/components/brand-mark.tsx) |
| 主题色与全局样式 | [src/app/globals.css](src/app/globals.css) |
| 中英文文案 | [messages/zh.json](messages/zh.json) 与 [messages/en.json](messages/en.json) |
| 关于页 | [src/app/about/page.tsx](src/app/about/page.tsx) |

当前浅色主题使用 `#FAF9F5` 暖纸白、炭灰文字与 `#C96442` 陶土橙强调色。首页布局、音乐和动效约定见[首页专题](docs/design/homepage.md)。

## 开发与检查

主要技术：Next.js 16 / React 19 / TypeScript / Tailwind CSS 4 / next-intl；Cloudflare 运行时由 OpenNext 适配；Markdown 使用 Unified、Remark、Rehype、Shiki 和 KaTeX。

生产环境通过 `DB` binding 访问 D1；本地和其他 Node 环境使用 libSQL 文件或 Turso。`content/` 保存示例与导入素材，运行时内容由数据库提供。

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动本地开发服务 |
| `npm run lint` | ESLint 检查 |
| `npx tsc --noEmit` | TypeScript 类型检查 |
| `npm test` | Vitest 回归测试 |
| `npm run build` | Next.js 生产构建 |
| `npm run build:worker` | OpenNext Worker 构建，在 Linux / CI 验证 |
| `npm run preview` | 构建并在 Workers runtime 中预览 |
| `npm run db:migrate` | 本地 libSQL / Turso 迁移，配置方式见上文 |
| `npm run db:migrations:apply:local` | 本地 D1 迁移 |

[GitHub Actions](.github/workflows/ci.yml) 执行 lint、类型检查、测试、Next.js 构建与 Linux Worker 构建。版本以 `package.json` 为准，前台与后台统一显示版本号和提交标识，发布变更记录在 [CHANGELOG.md](CHANGELOG.md)。

## 项目文档

- [架构总览](docs/ARCHITECTURE.md)：模块职责、目录与数据流。
- [部署与运行](docs/design/deployment.md)、[数据库与迁移](docs/design/database.md)：环境配置、发布与数据管理。
- [后台编辑器](docs/design/editor.md)、[Markdown 渲染](docs/design/rendering.md)、[API 与 Token](docs/design/api.md)：编辑、阅读与自动发文。
- [协作约定](docs/REPO_COLLAB_GUIDE.md)、[AGENTS.md](AGENTS.md)：开发协作入口。
- [当前计划](docs/exec-plans/active/2026-11-13-project-hardening.md)：后续改进、验收与接续记录。

## 许可证

项目代码采用 [MIT License](LICENSE)，原始版权与来源声明保留在许可证中。音频来源及相关说明见 [public/audio/LICENSE.md](public/audio/LICENSE.md)。
