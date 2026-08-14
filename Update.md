# Typos 修复时间线

本文记录 2026-08-14 项目审计后的问题、原因、修复顺序、实际改动和验证证据。修复按风险从安全到数据、架构和工程保障依次推进；第 6 阶段按当前个人站点的使用规模明确暂缓。

上一轮修复已由提交 `2f240c6c9e0bd24e3d83ef9c64c887934f199fc1` 推送并部署到 Cloudflare；本次补充修复基于该线上版本继续处理文章编辑日期和别名唯一性问题。

## 总体状态

| 阶段 | 状态 | 结果 |
| --- | --- | --- |
| 1 | 已完成 | 隐私泄露、下载认证绕过、登录/评论滥用、持久化 XSS 和安全响应头已修复 |
| 2 | 已完成 | 直接依赖受控升级，传递依赖公告已消除，npm 10 审计为 0 |
| 3 | 已完成 | 文章 slug、Moment 编辑、API 默认 slug 和标题回退的数据完整性问题已修复 |
| 4 | 已完成 | 数据库边界收敛为 D1/libSQL，本地迁移具备历史记录和重复执行保护 |
| 5 | 已完成 | 后台职责拆分、14 项回归测试和 Node 22 CI 已落地；Linux Worker build 交由远端 CI/Cloudflare 执行 |
| 6 | 暂缓 | 保留全站动态渲染、locale Cookie、公开页面缓存和 `no-store` 现状 |

## 2026-08-14 阶段 1：安全与隐私

### 原因

1. 公开评论接口查询并返回 `contact`，匿名访问者可以读取评论者联系方式。
2. 后台下载接口只判断 `typos_admin` Cookie 是否存在，没有验证 HMAC 和过期时间；伪造任意 Cookie 可以越过认证层进入查询逻辑。
3. 管理员登录没有失败次数限制，公开地址可以被持续暴力尝试。
4. 评论限流采用“先查后写”，并发请求存在同时放行窗口；提交接口也不验证文章 slug 是否存在。
5. Markdown 允许原始 HTML，却没有消毒，最终又通过 `dangerouslySetInnerHTML` 输出，形成持久化 XSS 边界。
6. 全站缺少 CSP、点击劫持、MIME 嗅探、Referrer 和浏览器能力限制响应头。

### 实际修复

- 公开评论只查询并返回 `id`、`nickname`、`content`、`created_at`、`is_admin` 和 `parent_id`，不再接触 `contact`。
- `/api/admin/download` 改为统一调用 `requireAdmin(request)`，验证 Session HMAC 和过期时间。
- 新增 `admin_login_attempts` migration；管理员登录采用 15 分钟统计窗口，第 5 次失败封禁 15 分钟，成功后清理失败记录，并返回 `Retry-After`。
- 评论写入前检查文章是否存在；限流改为带条件和 `RETURNING` 的单条 upsert，原子消费 60 秒窗口。
- Markdown 管线在 `rehypeRaw` 后加入 `rehype-sanitize`，先消毒用户 HTML，再生成 KaTeX 和 Shiki 的受信任输出。
- `next.config.ts` 增加 CSP、`Referrer-Policy`、`X-Content-Type-Options`、`X-Frame-Options`、`Permissions-Policy`，并关闭 `X-Powered-By`。

### 验证

- 伪造 `typos_admin` Cookie 访问下载接口返回 `401`。
- 公开评论回归测试确认响应没有 `contact`。
- 不存在的文章返回 `404`，且不会消耗评论限流窗口。
- 评论窗口内第二次请求被拒绝，窗口到期后放行。
- 管理员第 5 次失败进入封禁。
- `<script>`、事件处理属性和 `javascript:` URL 均被移除；KaTeX 和 Shiki 输出仍正常。

## 2026-08-14 阶段 2：依赖安全升级

### 原因

初始锁文件审计报告 13 个漏洞，其中 10 个为 high；`next@16.2.7`、PostCSS、Wrangler/Miniflare、Undici 等链路命中安全公告。直接执行 `npm audit fix --force` 会跳过兼容性约束，因此改为逐项升级并复核 peer/engine 要求。

### 实际修复

- `next` / `eslint-config-next` 升级到 `16.3.1`。
- `@opennextjs/cloudflare` 升级到 `1.20.2`。
- `wrangler` 升级到 `4.123.0`，并将 `@cloudflare/workers-types` 对齐到 `5.20260814.1`。
- `postcss` 锁定到 `8.5.26`。
- 新增 `rehype-sanitize@6.0.0` 和 `vitest@4.1.10`。
- 删除未实现的 `@neondatabase/serverless`、`postgres`，将实际必需的 `@libsql/client` 移入正式 dependencies。
- 在父包原有 semver 范围内更新传递依赖：`brace-expansion` 到 `1.1.18/5.0.9`，`js-yaml` 到 `3.15.1/4.3.1`。
- 用项目声明的 npm `10.9.2` 重新生成 lockfile，避免 npm 11 生成的锁文件缺少 `esbuild@0.28.2` 平台条目导致 CI `npm ci` 失败。

### 验证

- `npx npm@10.9.2 ci` 成功；本机 Node 24 仅产生预期的 engine 警告，CI 固定使用 Node `22.16.0`。
- npm 10 完整审计结果：`high=0`、`critical=0`、`total=0`。

## 2026-08-14 阶段 3：数据完整性

### 原因

1. 编辑文章并修改 slug 时只插入新记录，旧文章和旧评论关联不会处理。
2. Moment 编辑没有携带原 filename，后端又只执行 `INSERT`，导致编辑生成副本。
3. API 默认 slug 只有 `YYMMDD`，同一天的第二篇文章会覆盖第一篇。
4. 标题回退会扫描 fenced code，代码中的 `# Heading` 可能被误认为文章标题。
5. 删除文章后评论仍保留，形成孤儿数据。

### 实际修复

- 编辑文章时携带原 filename；slug 变化前检查目标是否冲突，保存新 slug 后迁移评论并删除旧文章。
- Moment 编辑携带原 filename，后端使用 `ON CONFLICT(filename) DO UPDATE`。
- API 默认 slug 改为 `YYMMDD-随机短标识`；显式 slug 仍用于幂等更新。
- 标题提取逐行跟踪反引号/波浪线 fenced code，只识别代码块外的一级标题。
- 删除文章时先删除对应评论。

### 验证

- 同一天、未提供 slug 的两次发布得到不同 slug。
- fenced code 内的标题不会成为文章标题。
- 文章改 slug 后旧记录消失、评论关联迁移到新 slug。
- 同一 filename 的 Moment 编辑后数据库仍只有一条记录。

## 2026-08-14 阶段 4：数据库边界与迁移

### 原因

项目文档宣称支持 PostgreSQL/Neon，但业务 SQL、迁移语法和占位符均是 SQLite/D1 语义，原 PostgreSQL 占位符转换也不正确。README 又宣称数据库不可用时回退 `content/`，实际运行路径并不具备可靠文件回退，数据库错误还可能被吞成空列表或假 `404`。

### 实际修复

- 运行时支持范围明确为 Cloudflare D1、Turso/libSQL 和本地 libSQL 文件。
- 删除 PostgreSQL 适配器、动态客户端导入和本地内容文件系统回退；数据库错误向上抛出。
- `file:./...`、标准 `file://...` 和直接 `.db` 路径使用同一套本地 libSQL 逻辑。
- 保存文章时把当前数据库实例传给 `warmPostRenderCache`，避免重复创建适配器。
- 本地/Turso 迁移增加 `typos_migrations` 历史表、已执行跳过和单文件原子 batch。
- 旧库根据真实 `posts` 列决定登记还是补跑 `0002_render_cache.sql`；具有清空语义的 `0003_daily_fragments.sql` 保守登记为已执行，避免历史数据再次被删除。
- README、`.env.example`、`DEPLOY.md`、数据库、部署和 API 文档全部同步；Cloudflare 配置文件统一为 `wrangler.jsonc`。

### 验证

- 全新临时数据库从 `0001` 到 `0004` 完整执行，第二次运行全部跳过。
- 旧数据库会补齐缺失的 `0002`、执行 `0004`、保留已有 `daily` 数据，第二次运行不重复修改。
- PostgreSQL、Neon、Supabase、Better-SQLite3、`db:migrate:pg` 和文件自动回退的旧说明已从有效文档移除，只保留“不支持”的边界说明。

## 2026-08-14 阶段 5：后台拆分、测试与 CI

### 原因

`src/app/admin/page.tsx` 原本超过 2300 行，同时承担视图、网络请求、Markdown 导入、编辑历史、图表、Token 管理和内容表单。仓库没有测试命令和 CI，安全与数据行为只能人工回归。

### 实际修复

- 提取 Markdown 工具栏、Markdown 导入/slug/标题/下载名纯函数。
- 提取 `DashboardView`/`TrendChart` 和 `TokensView`，只通过明确 props 接收数据与回调。
- 新增 Vitest 配置和 7 个测试文件，共 14 个用例，覆盖安全、数据完整性、Markdown、API 和迁移。
- 新增 `.github/workflows/ci.yml`，固定 Node `22.16.0`，执行 `npm ci`、lint、类型检查、测试、Next.js 构建和 Linux OpenNext Worker 构建。
- 部署脚本拆分为 `build:worker` 和 `deploy:worker`，Cloudflare Git Integration 可使用这组命令避免重复构建；原有 `npm run build` + `npm run deploy` 配置仍保持兼容，仓库改动不会自动修改 Cloudflare 控制台设置。

### 最终验证

| 检查 | 结果 |
| --- | --- |
| `npx npm@10.9.2 ci` | 通过，审计 0 漏洞 |
| `npm run lint` | 通过 |
| `npx tsc --noEmit` | 通过 |
| `npm test` | 7 个文件、14 个用例全部通过 |
| `git diff --check` | 通过 |
| `npm run build` | 通过，Next.js 16.3.1 生产构建成功 |
| `npm run build:worker` | Next 编译通过；Windows 在 Shiki symlink 阶段触发 OpenNext 已知 `EPERM` 平台限制 |

OpenNext 自身明确提示 Windows 非完全兼容。本机失败发生在 `.open-next` bundle 的符号链接创建阶段，不是应用编译、类型或测试失败；Linux Worker 打包已纳入 GitHub Actions，并由 Cloudflare 的远端构建环境完成实际发布验证。

## 2026-08-14 阶段 6：动态渲染与缓存优化（暂缓）

当前全部页面按需执行 Worker，部分响应使用 `no-store`，会增加 D1/Worker 请求量。但当前是个人低流量站点，成本和延迟尚未构成优先风险。

本阶段明确不修改：

- locale Cookie 读取和写入；
- 页面 `force-dynamic`；
- 公开页面 HTML 缓存策略；
- API/后台现有 `Cache-Control: no-store`；
- 文章现有渲染缓存策略。

待真实流量、成本、延迟或 Worker 配额数据证明有必要后，再单独启动第 6 阶段。

## 2026-08-14 补充修复：文章编辑日期与别名唯一性

### 原因

1. 后台新文章的默认别名只有 `YYMMDD`，同一天创建第二篇文章会得到相同主键；原有 `ON CONFLICT` 逻辑可能把第一篇文章覆盖掉。
2. 后台编辑既有文章时继续提交旧日期，文章列表和详情页无法反映最近修改时间。
3. 编辑文章时未明确固定原别名，日期输入变化可能意外改变已有文章 URL。

### 实际修复

- 后台新文章统一复用 `YYMMDD-随机短标识` 规则，同一天创建的文章默认别名不同。
- Markdown 导入在无法从文件名得到别名时也使用带随机标识的日期别名。
- 编辑既有文章时默认日期刷新为当天，服务端在旧日期未被显式改变时再次兜底刷新；原别名、封面和分类保持不变。
- 后台新建文章或修改别名使用原子 `ON CONFLICT DO NOTHING RETURNING`，冲突返回 `409`，不会覆盖旧文章。
- API 显式 slug 的幂等 upsert 保持不变，避免影响现有自动发布流程。

### 验证

- 同一天两个后台草稿得到不同的日期别名。
- 既有文章保存后日期更新为当前日期，原 slug 保持不变。
- 后台重复别名保存被拒绝，原文章标题和正文保持不变。
- API 显式 slug 仍可幂等更新。
