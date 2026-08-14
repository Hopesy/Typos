# Cloudflare Workers 部署

Typos 当前的生产目标是 Cloudflare Workers + D1。数据库只使用 `wrangler.jsonc` 中的 `DB` binding；Vercel、Netlify、Neon、Supabase 和自建 PostgreSQL 不属于当前支持范围。

## Cloudflare Git Integration

在 Workers & Pages 的 Builds 设置中填写：

```text
Repository: Hopesy/Typos
Production branch: main
Root directory: /
Build command: npm run build:worker
Deploy command: npm run deploy:worker
```

构建命令只负责 OpenNext 打包；部署命令先应用远端 D1 migration，再发布 Worker。不要把普通 `npm run build` 当作 Worker 部署产物，也不要把配置文件写成不存在的 `wrangler.toml`。

已经在线运行的项目如果仍配置为 Build command `npm run build`、Deploy command `npm run deploy`，无需为本次升级修改控制台：兼容脚本仍会完成完整发布。若改用拆分命令，必须同时修改 Build command 和 Deploy command，不能把 `npm run build` 与 `npm run deploy:worker` 混用。

## D1 配置

仓库中的 `wrangler.jsonc` 已定义：

- Worker 名称：`typos`
- 入口：`.open-next/worker.js`
- D1 binding：`DB`
- 数据库：`typos-db`
- migration 目录：`migrations`

如需新环境，先创建数据库并把生成的 ID 写入 `wrangler.jsonc`，然后执行：

```bash
wrangler d1 create typos-db
npm run db:migrations:apply
```

## Secrets

在 Cloudflare 控制台的 Variables and Secrets 中设置：

```text
ADMIN_PASSWORD
ADMIN_SESSION_SECRET
```

不要把密码、Session secret、Turso token 或 Cloudflare API token 写进仓库或日志。

## 本地验证

Windows 本机可运行：

```bash
npm ci
npm run db:migrate
npm run lint
npx tsc --noEmit
npm test
npm run build
```

OpenNext Worker 打包依赖 Linux 下的 symlink 行为，生产包应在 GitHub Actions 或 Cloudflare Linux 环境执行：

```bash
npm run build:worker
```

## 发布后的检查

1. 打开首页、文章列表和一篇文章详情。
2. 访问 `/admin`，确认错误密码不会无限重试，正确密码可以登录。
3. 使用后台生成的 API Token 发布一篇带显式 slug 的测试文章。
4. 检查 Worker 日志和 D1 migration 状态。

文章和评论保存在 D1，内容更新不需要重新部署。
