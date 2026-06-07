# Typos

Typos 是一个极简 HUD 风格的个人发布系统，基于 Next.js 16、React 19、Tailwind CSS 4、OpenNext、Cloudflare Workers 和 Cloudflare D1 构建。

> 原创来源：<https://github.com/arkleselect/MiniLoad>。Typos 是在 MiniLoad 基础上整理、改名并适配 Cloudflare Workers + D1 Git 集成部署的版本。

## 当前状态

| 项目 | 值 |
| --- | --- |
| GitHub 仓库 | `https://github.com/Hopesy/Typos` |
| Cloudflare Worker | `typos` |
| 线上地址 | `https://typos.hopesy.workers.dev` |
| 部署方式 | Cloudflare Workers Git Integration |
| 生产分支 | `main` |
| D1 数据库 | `typos-db` |
| D1 binding | `DB` |
| D1 database id | `9c1c8e42-7453-4729-ac55-ca2242af094a` |

Cloudflare 构建配置：

| 字段 | 值 |
| --- | --- |
| Project name | `typos` |
| Build command | `npm run build` |
| Deploy command | `npm run deploy` |
| Root directory | `/` |

`npm run deploy` 会执行 OpenNext 构建、远端 D1 migration、Worker 部署：

```bash
opennextjs-cloudflare build
wrangler d1 migrations apply DB --remote
opennextjs-cloudflare deploy
```

## 日常更新项目

代码、样式、文档改完后，本地验证：

```bash
npm run lint
npx tsc --noEmit
npm run build
```

提交并推送：

```bash
git status --short
git add <changed-files>
git commit -m "Describe the change"
git push origin main
```

推送到 `main` 后，Cloudflare 会自动构建并部署。查看构建日志：

```txt
Cloudflare Dashboard -> Workers & Pages -> typos -> Deployments / Builds
```

发布后检查：

```txt
https://typos.hopesy.workers.dev/
https://typos.hopesy.workers.dev/posts
https://typos.hopesy.workers.dev/admin
```

## 发布文章

生产环境的文章写入 D1，不需要改代码、不需要 `git push`、不需要重新部署。

1. 打开后台：

   ```txt
   https://typos.hopesy.workers.dev/admin
   ```

2. 输入 `ADMIN_PASSWORD` 登录。
3. 进入文章管理，新建文章。
4. 填写字段：

   | 字段 | 说明 |
   | --- | --- |
   | `title` | 文章标题 |
   | `date` | 发布日期 |
   | `description` | 列表页摘要 |
   | `slug` | URL 标识，例如 `my-first-post` |
   | `category` | 分类 |
   | `content` | Markdown 正文 |

5. 保存后访问：

   ```txt
   https://typos.hopesy.workers.dev/posts/<slug>
   ```

同一个 `slug` 再次保存会更新原文章。后台也可以管理 `daily`、`moments` 和评论回复。

## 首次部署或重建

正常更新不需要走这一节。只有删除 Cloudflare 项目、迁移账号、重建 Worker 或从零部署时使用。

1. 确认 D1 已存在，并且 `wrangler.jsonc` 绑定的是当前数据库：

   ```jsonc
   {
     "binding": "DB",
     "database_name": "typos-db",
     "database_id": "9c1c8e42-7453-4729-ac55-ca2242af094a",
     "migrations_dir": "migrations"
   }
   ```

2. 如果 Cloudflare 已有同名手动版 Worker，先确认 D1 还在，再只删除 Worker：

   ```bash
   npx wrangler d1 list
   npx wrangler delete typos --force
   npx wrangler d1 list
   ```

3. 在 Cloudflare Dashboard 创建 Git Integration：

   ```txt
   Workers & Pages -> Create application -> Continue with GitHub
   ```

   选择：

   ```txt
   GitHub account: Hopesy
   Repository: Hopesy/Typos
   Production branch: main
   Project name: typos
   Build command: npm run build
   Deploy command: npm run deploy
   Root directory: /
   ```

4. 设置生产 secrets：

   ```bash
   npx wrangler secret put ADMIN_PASSWORD
   npx wrangler secret put ADMIN_SESSION_SECRET
   ```

   生成 session secret：

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

5. 点击 Deploy，完成后检查线上地址。

## 数据库更新

新增 schema 或批量导入内容时，添加 migration 文件：

```txt
migrations/0003_describe_change.sql
```

本地验证并推送：

```bash
npm run db:migrations:apply:local
npm run lint
npx tsc --noEmit
npm run build
git add migrations/0003_describe_change.sql
git commit -m "Add D1 migration"
git push origin main
```

Cloudflare 部署时会自动执行：

```bash
wrangler d1 migrations apply DB --remote
```

文章也可以用 migration 批量导入：

```sql
INSERT OR REPLACE INTO posts (slug, title, date, description, category, content)
VALUES (
  'my-first-post',
  '我的第一篇文章',
  '2026-06-07',
  '文章摘要',
  '随笔',
  '# 我的第一篇文章

这里是 Markdown 正文。'
);
```

日常写作优先用 `/admin`，migration 更适合批量导入或需要进入 Git 历史的内容。

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

启动：

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
| `npm run deploy` | OpenNext 构建、D1 migration、Worker 部署 |
| `npm run db:migrations:apply` | 应用远端 D1 migration |
| `npm run db:migrations:apply:local` | 应用本地 D1 migration |

## 注意事项

- 不要把 `ADMIN_PASSWORD`、`ADMIN_SESSION_SECRET` 或 Cloudflare token 写进仓库。
- 不要把 Windows 本机 `npm run deploy` 当作常规生产发布方式；本项目生产部署使用 Cloudflare Linux 构建环境，避免 OpenNext Windows chunk/runtime 问题。
- 不要改 D1 binding 名称，代码和部署脚本都要求它叫 `DB`。

## 许可证

本项目使用 MIT License，详情见 `LICENSE`。
