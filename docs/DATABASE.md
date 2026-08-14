# 数据库配置

Typos 的运行时数据库边界是 libSQL 兼容接口，当前支持 Cloudflare D1、Turso/libSQL 和本地 libSQL SQLite 文件。项目不支持 PostgreSQL、Neon、Supabase 或 Better-SQLite3。

## 支持的后端

| 后端 | 用途 | 配置 |
| --- | --- | --- |
| Cloudflare D1 | 线上 Worker | `wrangler.jsonc` 的 `DB` binding，无需 `DATABASE_URL` |
| Turso/libSQL | 远程或边缘数据库 | `DATABASE_URL=libsql://...`、`TURSO_AUTH_TOKEN=...` |
| 本地 libSQL 文件 | 本地开发和测试 | 未设置 `DATABASE_URL` 时默认 `./data/typos.db`，或使用 `DATABASE_URL=file:./data/typos.db` |

Cloudflare 运行时从 `DB` binding 读取数据；本地 Next 开发服务无法使用 D1 binding 时，数据库模块会创建或打开本地 libSQL 文件。任何连接、SQL 或迁移错误都会向上抛出，避免把故障误报为“没有文章”。

## 本地开发

```bash
npm ci
npm run db:migrate
npm run dev
```

数据库默认创建在 `./data/typos.db`。管理员使用前，在 `.env.local` 设置 `ADMIN_PASSWORD` 和 `ADMIN_SESSION_SECRET`。

## Turso/libSQL

```dotenv
DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your_token_here
```

迁移脚本会按 `migrations/*.sql` 文件名顺序执行，并在 `typos_migrations` 表记录已执行文件。已有旧库会根据真实表结构登记基础迁移；只有实际存在渲染缓存列时才登记 `0002`。具有清空旧 `daily` 数据语义的 `0003` 会保守登记为已执行，避免迁移历史缺失导致数据被再次删除。

## Cloudflare D1

`wrangler.jsonc` 已包含真实绑定：

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "typos-db",
      "migrations_dir": "migrations"
    }
  ]
}
```

手动迁移命令：

```bash
npm run db:migrations:apply         # 远端 D1
npm run db:migrations:apply:local   # 本地 D1
```

生产部署脚本 `npm run deploy:worker` 会在 OpenNext 部署前自动执行远端迁移。

## 数据表

- `posts`：文章和渲染缓存字段。
- `daily`：日常碎片，每条记录有独立 `filename`。
- `moments`：照片瞬间。
- `comments`：评论和回复，`contact` 只供后台和通知使用，公开 GET 不返回。
- `rate_limits`：评论限流记录。
- `admin_login_attempts`：管理员登录失败窗口和封禁时间。
- `api_tokens`：API Token 哈希、状态和过期时间。
- `typos_migrations`：本地/Turso 迁移历史。

## 故障排查

### 本地数据库打不开

确认 `data` 目录可写，并重新运行：

```bash
npm run db:migrate
```

### Turso/libSQL 连接失败

确认 URL 以 `libsql://` 开头，并同时设置 `TURSO_AUTH_TOKEN`。PostgreSQL URL 会被明确拒绝，而不是被当作 SQLite 处理。

### D1 找不到绑定

确认 `wrangler.jsonc` 中的 binding 名为 `DB`，并检查：

```bash
wrangler d1 list
npm run db:migrations:apply
```

## 迁移边界

`content/` 下的 Markdown 文件可以用于导入和示例，但不是数据库不可用时的自动回退来源。项目没有 `npm run db:migrate:pg`，也没有 PostgreSQL 转换迁移路径。

更多信息：

- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Turso 文档](https://docs.turso.tech/)
- [libSQL 客户端](https://github.com/tursodatabase/libsql-client-ts)
