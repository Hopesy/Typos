# 多数据库支持更新说明

## 🎉 新功能

Typos 现在支持多种数据库后端，不再局限于 Cloudflare D1！

### 支持的数据库

- ✅ **Cloudflare D1** - 生产环境推荐
- ✅ **Better-SQLite3** - 本地开发推荐  
- ✅ **PostgreSQL (Neon/Supabase)** - Vercel 部署推荐
- ✅ **Turso** - 边缘 SQLite 推荐

---

## 🚀 快速开始

### 1. 本地开发（推荐）

使用 Better-SQLite3，无需额外配置：

```bash
# 安装可选依赖
npm install better-sqlite3

# 初始化数据库
npm run db:migrate

# 启动开发服务器
npm run dev
```

数据库会自动创建在 `./data/typos.db`

### 2. Vercel 部署 + Neon PostgreSQL

```bash
# 1. 安装 PostgreSQL 客户端
npm install @neondatabase/serverless

# 2. 在 Neon 创建数据库并获取连接字符串

# 3. 在 Vercel 设置环境变量
# DATABASE_URL=postgres://...
# ADMIN_PASSWORD=your_password

# 4. 部署
vercel --prod
```

### 3. 其他平台部署

详见 [DATABASE.md](./docs/DATABASE.md)

---

## 📝 环境变量

```bash
# 选择数据库（三选一）
DATABASE_URL=postgres://...      # PostgreSQL/Neon
DATABASE_URL=libsql://...        # Turso
# 或使用 Cloudflare D1（无需配置）

# Turso 认证（仅 Turso 需要）
TURSO_AUTH_TOKEN=your_token

# 管理员密码（必需）
ADMIN_PASSWORD=your_password
```

---

## 🔧 迁移现有项目

### 从 Cloudflare D1 迁移

如果你已经在 Cloudflare 上运行，**无需任何改动**！代码会自动检测并使用 D1。

### 添加本地开发支持

```bash
# 1. 安装 SQLite
npm install better-sqlite3

# 2. 运行迁移
npm run db:migrate

# 3. 现在可以在本地开发了
npm run dev
```

---

## 📚 更多信息

- [完整数据库配置文档](./docs/DATABASE.md)
- [迁移脚本说明](./scripts/migrate.js)
- [数据库适配器源码](./src/lib/database.ts)

---

## ⚠️ 注意事项

1. **兼容性**：新的 `database.ts` 替代了 `cloudflare.ts` 中的数据库部分
2. **迁移**：现有 D1 部署无需任何改动，自动向后兼容
3. **依赖**：数据库客户端都是 **可选依赖**，只需安装你使用的那个

---

## 🐛 问题反馈

遇到问题？请查看 [DATABASE.md](./docs/DATABASE.md) 的故障排查部分。
