# Typos 部署指南 - 数据库选择

Typos 支持多种数据库后端，根据你的部署平台选择合适的方案。

---

## 🎯 快速选择

| 部署平台 | 推荐数据库 | 复杂度 | 成本 |
|---------|-----------|--------|------|
| **Cloudflare Pages** | D1 | ⭐ 简单 | 免费 |
| **Vercel** | Neon PostgreSQL | ⭐⭐ 中等 | 免费起 |
| **Netlify** | Neon PostgreSQL | ⭐⭐ 中等 | 免费起 |
| **自建服务器** | PostgreSQL | ⭐⭐⭐ 复杂 | 取决于服务器 |
| **本地开发** | SQLite | ⭐ 简单 | 免费 |

---

## 📦 方案 1: Cloudflare Pages + D1（推荐）

### 优势
- 零配置，全球边缘分布
- 免费额度充足
- 最佳性能

### 步骤

1. **创建 D1 数据库**
```bash
wrangler d1 create typos-db
```

2. **配置 wrangler.toml**
```toml
[[d1_databases]]
binding = "DB"
database_name = "typos-db"
database_id = "你的数据库ID"
```

3. **运行迁移**
```bash
wrangler d1 execute typos-db --file=./migrations/0001_init.sql
```

4. **设置环境变量**（Cloudflare Pages 控制台）
```
ADMIN_PASSWORD=你的密码
```

5. **部署**
```bash
npm run deploy
```

✅ **完成！**

---

## 📦 方案 2: Vercel + Neon PostgreSQL

### 优势
- Vercel 一键部署
- PostgreSQL 完整功能
- 全球分布

### 步骤

1. **创建 Neon 数据库**

访问 [neon.tech](https://neon.tech)，创建免费数据库，复制连接字符串。

2. **安装依赖**
```bash
npm install @neondatabase/serverless
```

3. **初始化数据库**
```bash
# 设置临时环境变量
export DATABASE_URL="你的Neon连接字符串"

# 运行迁移
npm run db:migrate
```

4. **部署到 Vercel**

在 Vercel 项目设置中添加环境变量：
```
DATABASE_URL=你的Neon连接字符串
ADMIN_PASSWORD=你的密码
```

5. **部署**
```bash
vercel --prod
```

✅ **完成！**

---

## 📦 方案 3: 本地开发 + SQLite

### 优势
- 零配置
- 离线可用
- 快速启动

### 步骤

1. **安装依赖**
```bash
npm install
npm install better-sqlite3
```

2. **初始化数据库**
```bash
npm run db:migrate
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 设置 ADMIN_PASSWORD
```

4. **启动开发服务器**
```bash
npm run dev
```

访问 http://localhost:3000/admin

✅ **完成！**

---

## 📦 方案 4: Netlify + PostgreSQL

### 步骤

1. **创建数据库**（Neon 或 Supabase）

2. **安装依赖**
```bash
npm install @neondatabase/serverless
# 或
npm install postgres
```

3. **配置环境变量**（Netlify 控制台）
```
DATABASE_URL=你的PostgreSQL连接字符串
ADMIN_PASSWORD=你的密码
```

4. **初始化数据库**
```bash
export DATABASE_URL="你的连接字符串"
npm run db:migrate
```

5. **部署**
```bash
netlify deploy --prod
```

✅ **完成！**

---

## 📦 方案 5: 自建服务器 + PostgreSQL

### 步骤

1. **安装 PostgreSQL**
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql@16
```

2. **创建数据库**
```bash
sudo -u postgres createdb typos
sudo -u postgres psql -c "CREATE USER typos WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE typos TO typos;"
```

3. **安装依赖**
```bash
npm install postgres
```

4. **配置环境变量**
```bash
export DATABASE_URL="postgres://typos:your_password@localhost:5432/typos"
export ADMIN_PASSWORD="admin_password"
```

5. **初始化数据库**
```bash
npm run db:migrate
```

6. **启动服务**
```bash
npm run build
npm run start
```

✅ **完成！**

---

## 🔧 数据库迁移文件

确保 `migrations/0001_init.sql` 包含完整的表结构：

```sql
-- API Tokens 表
CREATE TABLE IF NOT EXISTS api_tokens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  token_prefix TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_used_at TEXT,
  expires_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_token_hash ON api_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_token_active ON api_tokens(is_active);

-- Comments 表
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  nickname TEXT NOT NULL,
  contact TEXT,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  parent_id TEXT,
  is_admin INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_slug ON comments(slug);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
```

---

## 🐛 故障排查

### SQLite: "better-sqlite3 not found"
```bash
npm install better-sqlite3
```

### PostgreSQL: "Connection refused"
检查连接字符串格式和数据库是否运行：
```bash
psql $DATABASE_URL -c "SELECT 1"
```

### D1: "Binding not found"
确保 `wrangler.toml` 中的 binding 名称是 `DB`。

### 迁移失败
手动执行 SQL：
```bash
# SQLite
sqlite3 ./data/typos.db < migrations/0001_init.sql

# PostgreSQL
psql $DATABASE_URL < migrations/0001_init.sql
```

---

## 📚 更多信息

- [完整数据库配置文档](./DATABASE.md)
- [数据库适配器源码](../src/lib/database.ts)
- [迁移脚本](../scripts/migrate.js)

---

## 💡 建议

- **开发环境**：使用 SQLite，简单快速
- **生产环境**：Cloudflare D1（最佳）或 Neon PostgreSQL
- **多地域**：D1 或 Turso
- **自建/隐私**：自建 PostgreSQL
