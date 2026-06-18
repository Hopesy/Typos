# 数据库配置指南

Typos 支持多种数据库后端，可以根据部署环境灵活选择。

## 支持的数据库

### 1. **Cloudflare D1**（推荐用于生产）
- **适用场景**：Cloudflare Pages/Workers 部署
- **配置**：无需额外配置，自动检测 D1 绑定
- **优势**：全球边缘分布、零配置、免费额度高

### 2. **Better-SQLite3**（推荐用于本地开发）
- **适用场景**：本地开发、测试
- **配置**：自动在 `./data/typos.db` 创建数据库
- **优势**：零配置、快速、无需外部服务

**安装依赖**：
```bash
npm install better-sqlite3 --save-optional
npm install @types/better-sqlite3 --save-dev
```

### 3. **PostgreSQL**（推荐用于 Vercel/通用部署）
- **适用场景**：Vercel、Netlify、自建服务器
- **支持的服务**：Neon、Supabase、Railway、任何 PostgreSQL
- **配置**：设置 `DATABASE_URL` 环境变量

**安装依赖**：
```bash
# Neon (推荐用于 Vercel)
npm install @neondatabase/serverless

# 或使用通用 postgres.js
npm install postgres
```

**环境变量**：
```bash
DATABASE_URL=postgres://user:password@host:5432/database
# 或 Neon
DATABASE_URL=neon://user:password@host/database
```

### 4. **Turso**（推荐用于边缘部署）
- **适用场景**：需要边缘复制的 SQLite
- **配置**：设置 `DATABASE_URL` 和 `TURSO_AUTH_TOKEN`
- **优势**：全球复制、低延迟

**安装依赖**：
```bash
npm install @libsql/client
```

**环境变量**：
```bash
DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your_token_here
```

---

## 快速开始

### 本地开发（SQLite）

1. 安装依赖：
```bash
npm install better-sqlite3 --save-optional
```

2. 初始化数据库：
```bash
npm run db:migrate
```

3. 启动开发服务器：
```bash
npm run dev
```

数据库会自动创建在 `./data/typos.db`。

### Vercel 部署（PostgreSQL + Neon）

1. 在 [Neon](https://neon.tech) 创建数据库

2. 在 Vercel 项目设置中添加环境变量：
```
DATABASE_URL=your_neon_connection_string
ADMIN_PASSWORD=your_admin_password
```

3. 部署：
```bash
vercel --prod
```

### Cloudflare Pages 部署（D1）

1. 创建 D1 数据库：
```bash
wrangler d1 create typos-db
```

2. 在 `wrangler.toml` 中配置：
```toml
[[d1_databases]]
binding = "DB"
database_name = "typos-db"
database_id = "your-database-id"
```

3. 运行迁移：
```bash
wrangler d1 execute typos-db --file=./migrations/0001_init.sql
```

4. 部署：
```bash
npm run deploy
```

---

## 数据库迁移

### 初始化数据库结构

**SQLite / D1：**
```bash
# 本地 SQLite
npm run db:migrate

# Cloudflare D1
wrangler d1 execute typos-db --file=./migrations/0001_init.sql
```

**PostgreSQL：**
```bash
# 自动运行迁移（需要先设置 DATABASE_URL）
npm run db:migrate:pg
```

---

## 环境变量参考

```bash
# 数据库连接（选择其一）
DATABASE_URL=postgres://...  # PostgreSQL/Neon
DATABASE_URL=libsql://...    # Turso
# 或使用 Cloudflare D1 绑定（无需配置）

# Turso 认证（仅 Turso 需要）
TURSO_AUTH_TOKEN=your_token

# 管理员密码（必需）
ADMIN_PASSWORD=your_secure_password

# Session 密钥（可选，建议设置）
ADMIN_SESSION_SECRET=random_secret_key
```

---

## 性能对比

| 数据库 | 延迟 | 并发 | 成本 | 适用场景 |
|--------|------|------|------|----------|
| D1 | 极低（边缘） | 高 | 免费 | Cloudflare 部署 |
| Turso | 低（边缘复制） | 高 | 免费层+付费 | 全球分布应用 |
| Neon | 低 | 高 | 免费层+付费 | Vercel/通用 |
| SQLite | 极低（本地） | 中 | 免费 | 开发/测试/自建 |

---

## 故障排查

### SQLite 无法连接
```bash
# 确保已安装依赖
npm install better-sqlite3

# 确保 data 目录可写
mkdir -p data
chmod 755 data
```

### PostgreSQL 连接超时
```bash
# 检查连接字符串格式
echo $DATABASE_URL

# 测试连接
npx pg-test $DATABASE_URL
```

### D1 数据库未找到
```bash
# 检查绑定配置
wrangler pages project list
wrangler d1 list

# 确保已运行迁移
wrangler d1 execute typos-db --file=./migrations/0001_init.sql
```

---

## 数据迁移

### 从文件系统迁移到数据库

```bash
# 扫描 content/ 目录并导入到数据库
npm run db:import
```

### 从 D1 迁移到 PostgreSQL

```bash
# 1. 导出 D1 数据
wrangler d1 export typos-db --output=backup.sql

# 2. 转换为 PostgreSQL 格式（需要手动调整语法）
# 3. 导入到 PostgreSQL
psql $DATABASE_URL < backup-converted.sql
```

---

## 更多信息

- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Neon 文档](https://neon.tech/docs)
- [Turso 文档](https://docs.turso.tech/)
- [Better-SQLite3 文档](https://github.com/WiseLibs/better-sqlite3)
