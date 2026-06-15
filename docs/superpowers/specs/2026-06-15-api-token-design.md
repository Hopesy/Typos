---
title: API Token 管理系统设计
date: 2026-06-15
status: approved
---

# API Token 管理系统设计

## 概述

为 Typos 添加 API Token 管理系统，使外部客户端（脚本、CLI 工具、第三方应用）可以通过 RESTful API 上传文章，无需 Cookie session 认证。在 admin 面板新增 Token 管理页面。

## 目标

- 用户可以在 admin 面板创建、查看、删除 API Token
- Token 支持可选的过期时间
- 外部客户端通过 Bearer Token 调用 API 上传文章
- 提供 API 文档和示例代码

## 架构设计

### 数据库表

新增 migration `0003_api_tokens.sql`：

```sql
CREATE TABLE IF NOT EXISTS api_tokens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  token_prefix TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_used_at TEXT,
  expires_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_api_tokens_hash ON api_tokens(token_hash);
```

字段说明：
- `id`：UUID 主键
- `name`：Token 名称（用于识别，如 "CLI 工具"）
- `token_hash`：Token 的 SHA-256 哈希（不存储明文）
- `token_prefix`：Token 前缀（如 `typos_a1b2`，用于显示识别）
- `created_at`：创建时间
- `last_used_at`：最后使用时间
- `expires_at`：过期时间（NULL 表示永不过期）
- `is_active`：是否启用

### Token 格式

```
typos_<32 字节随机十六进制>
例如：typos_a1b2c3d4e5f6...（64 个十六进制字符）
```

- 前缀 `typos_` 便于识别
- 创建时生成明文，只显示一次
- 数据库只存储 SHA-256 哈希
- 验证时对传入 Token 做哈希比对

### 模块设计

| 文件 | 职责 |
| --- | --- |
| `src/lib/api-tokens.ts` | Token 生成、哈希、验证、CRUD 业务逻辑 |
| `src/app/api/admin/tokens/route.ts` | Token 管理 API（GET 列表、POST 创建、DELETE 删除） |
| `src/app/api/v1/posts/route.ts` | 对外文章上传 API（Bearer Token 认证） |
| `src/app/admin/page.tsx` | 新增 "tokens" 导航项和管理界面 |

### 认证流程

**Token 验证（`src/lib/api-tokens.ts`）：**

1. 从 `Authorization: Bearer <token>` 头提取 token
2. 计算 token 的 SHA-256 哈希
3. 查询 `api_tokens` 表匹配哈希
4. 检查 `is_active === 1`
5. 检查 `expires_at` 未过期（NULL 视为永久有效）
6. 更新 `last_used_at`
7. 返回验证结果

**复用现有 admin session 保护管理端点：**
- `/api/admin/tokens` 使用现有 `requireAdmin()`（Cookie session）
- `/api/v1/posts` 使用新的 `requireApiToken()`（Bearer Token）

## API 端点设计

### 管理端点（需要 admin session）

**GET /api/admin/tokens** — 列出所有 Token
```json
{
  "tokens": [
    {
      "id": "uuid",
      "name": "CLI 工具",
      "tokenPrefix": "typos_a1b2",
      "createdAt": "2026-06-15 10:00:00",
      "lastUsedAt": "2026-06-15 12:00:00",
      "expiresAt": "2026-09-15 10:00:00",
      "isActive": true
    }
  ]
}
```

**POST /api/admin/tokens** — 创建新 Token
```json
// 请求
{ "name": "CLI 工具", "expiresInDays": 90 }  // expiresInDays 可选，省略则永不过期

// 响应（明文 token 只返回一次）
{ "success": true, "token": "typos_a1b2c3...", "id": "uuid" }
```

**DELETE /api/admin/tokens** — 删除 Token
```json
// 请求
{ "id": "uuid" }

// 响应
{ "success": true }
```

### 对外端点（需要 Bearer Token）

**POST /api/v1/posts** — 创建文章

支持两种 Content-Type：

1. **JSON 格式**（`application/json`）：
```json
{
  "title": "标题",
  "date": "2026-06-15",
  "description": "摘要",
  "category": ["随笔"],
  "slug": "260615",
  "cover": "https://...",
  "content": "正文 Markdown"
}
```

2. **Markdown 格式**（`text/markdown`）：
直接 POST 原始 Markdown 文本（含 frontmatter），服务端解析 frontmatter 提取元数据。

响应：
```json
{ "success": true, "slug": "260615" }
```

错误响应：
```json
{ "error": "错误信息" }  // 状态码 400/401/500
```

## Admin UI 设计

在侧边栏导航新增 "tokens" 项（在 comment 之后）：
- 图标：`FiKey`（react-icons/fi）
- 中文标签："密钥"，英文："Tokens"

### Token 管理页面布局

```
顶部：标题 "API Tokens / 密钥管理" + "新建 Token" 按钮
├── Token 列表（卡片式，复用现有 list 样式）
│   每个卡片显示：
│   ├── 名称 + 状态标记（启用/已过期）
│   ├── Token 前缀（typos_a1b2...）
│   ├── 创建时间、最后使用、过期时间
│   └── 删除按钮（带气泡确认，复用现有模式）
├── API 使用文档区域（折叠面板）
│   ├── 端点说明
│   └── curl / JavaScript 示例代码
```

### 创建 Token 弹窗

复用现有 modal 模式（参考 reply dialog）：
- 输入：Token 名称
- 选择：过期时间（下拉：永不过期 / 30天 / 90天 / 1年）
- 创建后：显示明文 Token + 复制按钮 + 警告"只显示一次"

## 安全设计

1. **Token 哈希存储**：数据库只存 SHA-256 哈希，不存明文
2. **明文只显示一次**：创建后无法再次查看完整 token
3. **timing-safe 比对**：复用现有 `timingSafeBytesEqual` 逻辑
4. **过期检查**：每次验证检查 `expires_at`
5. **禁用机制**：`is_active` 字段支持软禁用
6. **API 端点安全提示**：`/api/v1/posts` 是公开端点，文档中说明 Token 等同密码，需妥善保管

### 速率限制

YAGNI：暂不实现速率限制。当前是个人博客，Token 由本人持有。如未来需要，可复用 `rate_limits` 表模式扩展。

## 数据流

```
外部客户端
  │ POST /api/v1/posts
  │ Authorization: Bearer typos_xxx
  ▼
requireApiToken() ── 验证 Bearer Token ──> 401 if invalid
  │ 通过
  ▼
解析 body（JSON 或 Markdown）
  │
  ▼
saveAdminItem(db, 'post', data) ── 复用现有保存逻辑
  │
  ▼
返回 { success: true, slug }
```

## 成功标准

- [ ] 数据库 migration 创建成功
- [ ] 可以在 admin 面板创建 Token，明文显示一次
- [ ] 可以查看 Token 列表（含状态、时间信息）
- [ ] 可以删除 Token
- [ ] 创建 Token 时可选择过期时间
- [ ] 外部客户端用 Bearer Token 可成功上传文章（JSON 格式）
- [ ] 外部客户端用 Bearer Token 可成功上传文章（Markdown 格式）
- [ ] 过期/禁用的 Token 被拒绝（401）
- [ ] 无效 Token 被拒绝（401）
- [ ] API 文档和示例代码可在 admin 面板查看
- [ ] TypeScript 编译通过、构建成功

## 未来扩展（可选，本次不实现）

- Token 权限范围（scope：只读 / 读写 / 仅文章）
- 速率限制
- Token 使用日志
- 支持 daily / moment 类型的 API 上传
