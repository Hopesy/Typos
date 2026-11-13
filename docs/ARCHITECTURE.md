# Typos 架构总览

## 定位与运行边界

Typos 是从 MiniLoad 整理、改名并适配 Cloudflare 的个人发布系统：文章、日常碎片、照片瞬间、评论和单管理员后台。当前不是多用户 CMS，也不提供多角色审批。

- 应用：Next.js 16 App Router、React 19、TypeScript、Tailwind CSS 4。
- 生产：OpenNext 将应用打包为 Cloudflare Worker，静态资源由 Workers Assets 提供，数据通过 `DB` binding 访问 D1。
- 开发：Node 22、npm 10；数据库可用本地 libSQL 或 Turso。生产目标不扩展为 PostgreSQL、Neon、Supabase、Vercel 或 Netlify。
- `content/` 是素材，不参与数据库故障时的运行时回退。Git 与数据库分别备份。

## 目录与模块

| 真实路径 | 职责 / 依赖 |
| --- | --- |
| `src/app/` | App Router 页面、layout 与 API 路由 |
| `src/app/admin/page.tsx` | 后台状态、内容管理、编辑器及沉浸模式 |
| `src/components/` | 前台交互、共享 Markdown 渲染、HUD 视觉和后台子组件 |
| `src/lib/database.ts` | 统一 SQL statement 接口，D1 / libSQL 适配 |
| `src/lib/content.ts` | 公开内容读取、活动统计、文章 HTML/TOC 缓存 |
| `src/lib/admin-content.ts` | 后台增删改查、slug 冲突处理、评论关联迁移 |
| `src/lib/post-payload.ts`、`admin-markdown.ts` | API 输入和后台 Markdown 导入的不同语义 |
| `src/lib/admin-auth.ts`、`api-tokens.ts`、`request-security.ts` | 会话、API Token、登录和评论限流 |
| `src/i18n/`、`messages/` | next-intl，中英文消息与 locale cookie |
| `migrations/`、`scripts/migrate.js` | SQLite/D1 方言迁移、本地/Turso 迁移历史 |
| `public/` | 字体、图标等静态资源 |
| `content/` | 示例与可导入 Markdown，非线上内容库 |
| `src/**/*.test.ts`、`vitest.config.mts` | Vitest 与内存 libSQL 回归测试 |
| `.github/workflows/ci.yml` | lint、类型、测试、Next 与 Linux Worker 构建 |
| `docs/design/` | 现行专题；目标与验收进度见 `docs/exec-plans/` |

## 页面与渲染边界

- `/`、`/about`、`/admin` 以客户端组件实现主要交互；根 layout 读取语言并提供全站 Provider、导航、页脚和图片灯箱。
- `/posts`、`/posts/[slug]`、`/daily`、`/moments` 通过服务端页面读取内容，再由客户端组件完成搜索、切换、目录、复制、评论等交互。
- 主题由 localStorage 与根节点样式控制；语言使用 cookie，因此不能直接假设公共 HTML 可跨用户、跨语言共享缓存。
- 日常正文和后台预览在浏览器运行共享 Markdown 管线；文章详情优先读取数据库里的渲染结果。

## 关键数据流

1. **后台写作**：管理员 Cookie 验证 → `/api/admin/save` → `admin-content` → 数据库写入 → 使用浏览器预渲染结果预热文章缓存，缺失时尝试服务端渲染。
2. **API 发文**：`POST /api/v1/posts` → 提取 Bearer Token → 哈希查库、状态/过期检查 → 解析 JSON/Markdown → 显式允许 slug upsert → 保存与缓存预热。
3. **公开阅读**：按 `admin_only = 0` 读取 → 列表/详情/统计；详情命中正文哈希缓存时跳过 Shiki，否则渲染并尝试回写。
4. **评论**：检查公开文章存在 → 内容校验、蜜罐、非管理员限流 → 验证父评论归属 → 入库 → 可选 Telegram 通知。公开响应不含 contact。
5. **部署**：Git Integration 构建 OpenNext → 应用远端 D1 migrations → 发布 Worker。后台更新内容不触发部署。

## 当前约束与需注意的实现边界

- `date` 是发布日期；编辑默认保留。列表按 `updated_at DESC, created_at DESC, slug DESC` 稳定排序。
- 后台新建/导入采用新随机 slug，冲突拒绝覆盖；API 指定 slug 支持幂等更新。两条路径不能随意统一成同一行为。
- 标准 Markdown 管线包含 HTML 清洗；后台提交的预渲染 HTML 目前是独立信任边界，不能宣称每个缓存写入都经过服务端清洗。
- 数据库接口当前只有单条语句能力；文章改名/删除的多步写入尚非整体原子操作。
- 缺失可见性列时仍有兼容回退；缺失缓存列时退回现场渲染。可靠性改进见活动计划，不把拟定修复写成现状。
- 后台访问趋势及总访问量为示例常量；相册 Views 是浏览器本地计数，不是站点全局统计。
- 既有历史决定暂缓全站静态化、locale 改造、公共 HTML 缓存和放宽 `no-store`，待真实流量/成本证据再评估。

## 专题与进度入口

- [数据库、迁移和恢复边界](design/database.md)
- [部署、运行与质量门禁](design/deployment.md)
- [API 与 Token 契约](design/api.md)
- [Markdown 渲染与 Workers CPU](design/rendering.md)
- [后台编辑器与沉浸模式](design/editor.md)
- [详细 TODO 与接续摘要](exec-plans/active/2026-11-13-project-hardening.md)
- [历史修复依据](histories/2026-08/20260814-project-audit.md)

本文件以源码事实为主；本轮静态分析不替代应用、生产和性能验收。
