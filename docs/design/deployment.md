# 运行、部署与质量门禁

## 当前生产目标

- 生产地址：<https://typos.hopesy.workers.dev>
- 仓库：<https://github.com/Hopesy/Typos>
- Worker：`typos`；D1：`typos-db`；binding：`DB`。
- 配置文件：`wrangler.jsonc`，入口 `.open-next/worker.js`，资源 `.open-next/assets`。
- 以上来自仓库配置及旧部署记录；本次文档整合没有访问线上或验证当前控制台状态。

生产支持 Cloudflare Workers + D1 Git Integration，不承诺 Vercel、Netlify 或 PostgreSQL 部署。

## 本地启动

使用 Node 22、npm 10（CI 固定 Node 22.16.0）。

```bash
npm ci
npm run db:migrate
npm run dev
```

在 `.env.local` 设置独立的 `ADMIN_PASSWORD` 与 `ADMIN_SESSION_SECRET`，不提供默认后台口令。环境变量示例见仓库 `.env.example`；访问 `http://localhost:3000`，后台 `/admin`。

本地默认数据库为 `./data/typos.db`。迁移脚本不自动加载 `.env.local`；自定义数据库的迁移环境按[数据库专题](database.md)设置。

## 质量门禁

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

Linux/CI 再执行：

```bash
npm run build:worker
```

GitHub Actions 已配置上述步骤，但“存在 CI 配置”不代表本轮 CI 已运行或通过。普通 Next build 不能代替 Worker build。

Windows 曾在 OpenNext/Shiki 打包创建符号链接时出现 `EPERM`，历史记录见[审计修复历史](../histories/2026-08/20260814-project-audit.md)。Worker 产物应在兼容的 Linux/CI 环境核验，不把 Windows 直接生产发布作为常规路径。

## Cloudflare Git Integration

首次新环境：Workers & Pages → Create application → Import a repository，核对仓库、生产分支和目标数据库；已有环境不要重建 D1。

推荐 Builds 配置：

```text
Project name: typos
Production branch: main
Root directory: /
Build command: npm run build:worker
Deploy command: npm run deploy:worker
```

`deploy:worker` 先执行 `wrangler d1 migrations apply DB --remote`，成功后才执行 OpenNext deploy。会写入生产数据库，需在授权发布流程内运行。

兼容旧组合 `npm run build` + `npm run deploy` 仍有效，因为 deploy 包含 Worker build；可能重复构建。切换拆分命令时必须一起修改，不能组合 `npm run build` + `npm run deploy:worker`，否则没有 `.open-next` 产物。

如确需独立新环境，可创建新的 D1 并在 `wrangler.jsonc` 填入该环境的 ID；这是有外部副作用的操作，不在普通文档维护中执行。Secrets 在 Settings → Variables and Secrets 中设置：

```text
ADMIN_PASSWORD
ADMIN_SESSION_SECRET
```

可选评论通知读取 `TELEGRAM_BOT_TOKEN`、`TELEGRAM_CHAT_ID`、`SITE_URL`。配置前确认真实通知目的地；测试使用隔离目标，不能把用户联系方式或测试消息误发到真实频道。

不要将管理员密码、Session secret、Turso token、Cloudflare token 或备份写进 Git。代码推送会由 Git Integration 触发发布，因此提交/推送仍需用户明确要求。

## 发布前后检查

1. 发布前核对测试结果、迁移差异、目标 D1 及可恢复备份，特别注意历史 `0003` 的清空语义。
2. 发布后在 Deployments 查看 Worker 版本、构建结果和迁移结果。
3. 访问首页、文章列表、文章详情、日常和相册，核对无异常页面或空成功。
4. 在隔离测试环境验证登录错误/成功、后台保存、仅后台可见文章、评论和 API JSON/Markdown 上传。
5. 用独立浏览器会话确认隐藏文章不能通过直链或评论接口公开读取。
6. 检查 Worker 错误和 CPU 指标，记录被测版本及结果。真实环境的测试内容与通知另需授权。

## 内容发布

后台登录 → 新建/编辑文章 → 填写元数据与 Markdown → 选择可见性 → 保存。内容直接保存到 D1，不需要 Git 提交或再次部署。

自动发文契约见 [API](api.md)。迁移与恢复见 [database](database.md)。运行基线与待办见[当前计划](../exec-plans/active/2026-11-13-project-hardening.md)。
