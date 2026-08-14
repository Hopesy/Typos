# 数据库迁移说明

Typos 只维护一套 SQLite/libSQL 方言迁移，适用于 Cloudflare D1、Turso/libSQL 和本地 libSQL 文件。不存在 PostgreSQL、Neon 或 Better-SQLite3 迁移脚本。

## 本地或 Turso

```bash
# 本地：默认 ./data/typos.db
npm run db:migrate

# Turso：先设置 DATABASE_URL 和 TURSO_AUTH_TOKEN
$env:DATABASE_URL = "libsql://your-db.turso.io"
$env:TURSO_AUTH_TOKEN = "your-token"
npm run db:migrate
```

脚本会：

1. 创建 `typos_migrations` 历史表。
2. 按文件名排序读取 `migrations/*.sql`。
3. 跳过已经记录的 migration。
4. 对已有旧数据库登记 `0001_init.sql`；检查 `posts` 的真实列后决定是否登记或执行 `0002_render_cache.sql`；保守登记具有清空语义的 `0003_daily_fragments.sql`。
5. 每个文件的所有语句成功后才记录该文件。

## Cloudflare D1

```bash
npm run db:migrations:apply         # 远端生产数据库
npm run db:migrations:apply:local   # Wrangler 本地 D1
```

部署时使用：

```bash
npm run build:worker
npm run deploy:worker
```

`deploy:worker` 会先运行 `wrangler d1 migrations apply DB --remote`，再执行 `opennextjs-cloudflare deploy`。

## 新增 migration

文件名必须使用递增编号，例如 `0005_example.sql`。SQL 使用 SQLite/D1 兼容语法；不要加入 PostgreSQL 专属类型、占位符或事务假设。提交前至少执行：

```bash
npm run db:migrate
npm run lint
npx tsc --noEmit
```

## 现有旧库

旧库如果已经有 `posts` 表，迁移脚本会登记基础迁移并确保缺失的渲染缓存列得到补齐，但不会再次执行会清空 `daily` 的 `0003_daily_fragments.sql`。新库则从 `0001` 开始完整执行到当前版本。
