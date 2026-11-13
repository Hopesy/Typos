# Typos

个人发布系统，使用 Next.js App Router、Cloudflare Workers 与 D1/libSQL。保留现有源码及部署目录，不为了文档规范改造成 monorepo。

## 接手导航

1. 先读[当前计划的接续摘要](docs/exec-plans/active/2026-11-13-project-hardening.md)，核对最新用户约束、工作区、证据与下一动作。
2. 首次协作读 [REPO_COLLAB_GUIDE](docs/REPO_COLLAB_GUIDE.md)。
3. 模块与数据流见 [ARCHITECTURE](docs/ARCHITECTURE.md)，专题规则沿其中的 `docs/design/` 链接读取。
4. TODO、进度与交接统一维护在同一活动计划；新任务按 [PLANS_GUIDE](docs/PLANS_GUIDE.md) 建立或接续。
5. 已交付结果按 [HISTORY_GUIDE](docs/HISTORY_GUIDE.md) 汇总到同一任务 history；历史代码通过 Git 追溯。

## 记录约定

- 用户修正及时写回计划约束；重要决定注明来源、适用条件和 accepted/proposed/rejected/superseded 状态。
- 区分“源码已实现”“本次已验证”“历史记录通过”，不要将静态检查当成真实运行验收。
- 当前计划中的后续开发项默认待排期；计划存在不等于已授权实施、联网发布或生产迁移。
- 重要节点更新被测版本、实际检查结果、未验证项和下一动作。长期业务规则维护在架构或专题，不复制多份 TODO。
- 凭据、数据库备份和含个人信息的日志不得进入文档或 Git。

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
