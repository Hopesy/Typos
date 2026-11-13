# 数据库、迁移与恢复边界

## 支持范围

统一业务接口定义在 `src/lib/database.ts`，使用 SQLite/D1 兼容 SQL 和绑定参数，不提供 PostgreSQL、Neon、Supabase 或 Better-SQLite3 适配。

| 场景 | 配置 / 行为 |
| --- | --- |
| Cloudflare 生产 | `wrangler.jsonc` 的 `DB` binding 优先，无需 `DATABASE_URL` |
| Next 开发 | `NODE_ENV=development` 时不选 D1 binding，使用下面的 libSQL 路径 |
| 本地默认 | 无 `DATABASE_URL` 时打开/创建 `./data/typos.db`；需要先迁移 |
| 显式文件 | `file:`、标准 `file://` 或以 `.db` 结尾的路径 |
| Turso/libSQL | `DATABASE_URL=libsql://...` 且提供 `TURSO_AUTH_TOKEN`；Node libSQL 路径 |

连接、查询失败通常向上抛出；代码仍对少数缺列/缺表场景做兼容处理，见下文。`content/` 不作为运行时故障回退。

## 主要数据

- `posts`：slug 主键、标题、发布日期 `date`、摘要、分类、封面、Markdown、创建/修改时间、渲染缓存及 `admin_only`。
- `daily`：独立 filename、日期、标题、图片和正文；每条碎片独立成行。
- `moments`：filename 主键、标题、日期、图片和说明。
- `comments`：文章 slug、昵称、联系方式、正文、父评论、管理员标记；仅父评论有外键约束，文章关联由应用维护。
- `rate_limits`：评论 IP 与最近时间；`admin_login_attempts`：登录失败窗口/封禁时间。
- `api_tokens`：哈希、识别前缀、状态、创建/使用/过期时间，不存明文 Token。
- `typos_migrations`：本地/Turso 迁移记录；D1 迁移由 Wrangler 管理，不等同此表。

公开评论不返回 contact；联系方式仅供后台和配置的通知路径使用。参见 [API 契约](api.md)。

## 当前迁移

| 文件 | 作用 / 注意 |
| --- | --- |
| `0001_init.sql` | 基础表（已含 api_tokens）及欢迎文章 |
| `0002_render_cache.sql` | HTML、TOC、正文哈希缓存列 |
| `0003_daily_fragments.sql` | 历史决策：清空旧按天合并的 daily 数据，无结构变更 |
| `0004_admin_login_attempts.sql` | 登录失败限流表 |
| `0005_posts_updated_at_index.sql` | 文章修改时间稳定排序索引 |
| `0006_posts_admin_only.sql` | 后台可见标记及公开列表组合索引 |

### 本地 / Turso

```bash
npm run db:migrate
```

`scripts/migrate.js` 按文件名排序执行；每个文件及其迁移登记在同一 libSQL write batch 中完成，重复运行跳过已登记文件。

如果迁移历史为空但已存在 posts：登记基础迁移；检查实际缓存列后决定登记或执行 `0002`；保守登记 `0003`，避免再次清空已有 daily。这个保护属于本地/Turso runner，不能假设 Wrangler D1 也使用它。

脚本直接读取进程环境，不自动加载 `.env.local`。Turso 可在 PowerShell 中明确设置后执行：

```powershell
$env:DATABASE_URL = "libsql://your-db.turso.io"
$env:TURSO_AUTH_TOKEN = "your-token"
npm run db:migrate
```

### Cloudflare D1

```bash
npm run db:migrations:apply:local
# 以下写入远端数据库，仅在确认目标及备份后由授权发布流程执行：
npm run db:migrations:apply
```

生产 `deploy:worker` 会先执行远端迁移，再发布应用。不要为排查绑定错误重建现有生产库。

### 新增迁移规则

- 当前编号到 `0006`，新文件使用下一个未占用编号；不要修改已部署 migration 的语义。
- 使用 SQLite/D1 兼容语法，分别验证 libSQL 与 Wrangler 本地 D1，不套用 PostgreSQL 事务假设。
- 在临时库验证：新库、历史库、第二次运行、失败恢复和业务数据保留。
- SQL 含 `DELETE`、DROP 或重建表时，明确数据去向、备份和回退步骤。
- 真实生产库执行任何迁移前核对 Wrangler 迁移记录，特别是具有清空语义的 `0003`。

## 业务不变量

- `date` 表示发布日期，默认编辑保留；修改时间写入 `updated_at`。
- 文章列表按 `updated_at DESC, created_at DESC, slug DESC` 排序。
- 后台新建 slug 冲突应拒绝；API 显式 slug 是幂等更新入口。
- 改 slug 应迁移评论，删文章应处理关联评论；当前多语句实现尚无整体事务保护。
- `admin_only` 用于公开列表、详情、slug 列表、活动统计和评论入口过滤。当前缺列回退会跳过此限制，属于待收紧的兼容边界。

## 备份与排错

Git 不包含 D1 内容；Markdown 导出也不等于包含评论、关系和全部元数据的数据库备份。后续恢复演练需在隔离库完成，不能把“能下载文件”当作“能恢复网站”。

- 本地打不开：核对实际文件路径、父目录可写性和迁移状态。
- Turso 连接失败：核对 URL 协议、进程环境和 token；不要在日志打印 token。
- D1 binding 缺失：核对 `DB` 名称、目标环境和数据库 ID，先查配置/日志，不盲目执行远端写入。

相关实现：`src/lib/database.ts`、`src/lib/admin-content.ts`、`scripts/migrate.js`、`src/lib/migration-runner.test.ts`。后续任务见[主计划](../exec-plans/active/2026-11-13-project-hardening.md)。

参考：[D1](https://developers.cloudflare.com/d1/)、[Turso](https://docs.turso.tech/)、[libSQL 客户端](https://github.com/tursodatabase/libsql-client-ts)。
