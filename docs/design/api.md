# API 与 Token 契约

## 范围与实现

API 面向站长持有的脚本/自动化客户端，不是开放用户平台。支持 D1、Turso/libSQL 和本地 libSQL；生产配置见[部署说明](deployment.md)。

- Token：`src/lib/api-tokens.ts`。
- 管理：`src/app/api/admin/tokens/route.ts`，使用管理员 Cookie/HMAC 会话。
- 上传：`src/app/api/v1/posts/route.ts`，使用 Bearer Token，不依赖后台 Cookie。
- 解析：`src/lib/post-payload.ts`；保存复用 `saveAdminItem(..., { allowPostUpsert: true })`。

## Token 生命周期

在 `/admin` 密钥管理中创建：名称必填，可选过期天数。Token 为 `typos_` 加 32 字节随机值的 64 位十六进制表示。

- 明文仅在创建响应中返回一次；列表不返回明文或哈希。
- 数据库保存 SHA-256 哈希及 `typos_` 加前 8 个十六进制字符的识别前缀。
- 验证时按哈希查库，检查 `is_active`、过期时间，再更新 `last_used_at`。
- 正数 `expiresInDays` 设置过期；未设置或 0 表示不过期。异常天数的严格校验尚待加强，不应依赖负数等非正常输入。
- 删除后该 Token 无法通过验证。数据库有 `is_active` 字段，但当前没有独立的禁用/启用 API。
- Token 可以发布和覆盖文章，应按高权限凭据保管，不嵌入公开前端或日志。

### 管理接口

| 方法 / 路径 | 请求 | 成功响应 |
| --- | --- | --- |
| GET `/api/admin/tokens` | 管理员会话 | `{ "tokens": [...] }` |
| POST `/api/admin/tokens` | `{ "name": "CLI", "expiresInDays": 90 }` | `{ "success": true, "token": "typos_...", "id": "..." }` |
| DELETE `/api/admin/tokens` | `{ "id": "..." }` | `{ "success": true }` |

列表记录含 `id/name/tokenPrefix/createdAt/lastUsedAt/expiresAt/isActive`。后台错误使用统一错误代码及消息，响应 `Cache-Control: no-store`。

## 发布文章

```text
POST /api/v1/posts
Authorization: Bearer YOUR_TOKEN
```

`Content-Type` 包含 `application/json` 时按 JSON 处理；当前其他类型均作为原始 Markdown 处理，不只是 `text/markdown`。

| 字段 | 类型 | 现行行为 |
| --- | --- | --- |
| `content` | string | 必填，去空白后不能为空 |
| `title` | string | 缺省取代码围栏外首个一级标题，再缺省为 Untitled |
| `date` | string | 按 T 分割取日期部分，缺省当前 UTC 日期；不等于严格日期校验 |
| `description` | string | 摘要，缺省空 |
| `category` | string / string[] | 数组拼为逗号分隔字符串 |
| `slug` | string | 清洗为小写字母/数字/下划线/连字符；缺省日期加随机短标识 |
| `cover` | string | 封面 URL，缺省空 |
| `adminOnly` / `admin_only` | boolean 等 | 隐藏状态，建议显式 boolean；缺省 false |

显式 slug 是 upsert：同 slug 更新，不是只修改所给字段的 PATCH。省略的元数据会按解析器默认值写入，包括可见性；更新私密文章应明确传 `adminOnly: true`。

### JSON 示例（Bash）

```bash
curl -X POST https://example.com/api/v1/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"我的文章","date":"2026-06-18","description":"摘要","category":["技术","随笔"],"slug":"my-post","cover":"https://example.com/cover.jpg","adminOnly":true,"content":"# 我的文章\n\n正文"}'
```

### Markdown 示例

```markdown
---
title: 我的文章
date: 2026-06-18
description: 摘要
category: [技术, 随笔]
slug: my-post
cover: https://example.com/cover.jpg
adminOnly: true
---

# 我的文章

正文内容。
```

```bash
curl -X POST https://example.com/api/v1/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: text/markdown" \
  --data-binary @my-post.md
```

frontmatter 可省略；Markdown 识别 `category` 和 `categories`，JSON 当前只读取 `category`。建议显式英文/数字 slug；自动 slug 每次生成随机标识，不具备重试幂等性。

### 响应与当前错误边界

成功：`{ "success": true, "slug": "my-post" }`；失败通常是 `{ "error": "..." }`。

| 状态 | 代码中可确认的情况 |
| --- | --- |
| 200 | 保存路径返回成功 |
| 400 | 非对象 JSON、空文本请求或空正文 |
| 401 | 缺少/无效/过期/禁用的 Token |
| 500 | try 内解析或保存异常，目前返回异常 message；畸形 JSON 也会走此路径 |
| 503 | 代码保留数据库返回 null 的分支；实际连接异常在 try 外，不能保证统一返回此状态 |

正常构造的响应禁用缓存。数据库/Token 验证异常、畸形 JSON 的状态码和内部错误泄露是后续契约收敛任务，不能将期望行为写成现有保证。

## 旧设计与现状差异

2026-06-15 草案的有效目标是 Token 管理和外部发文；目前源码已实现，端到端验收见主计划。

- Token 表实际位于 `0001_init.sql`，不存在单独 `0003_api_tokens.sql`。
- 上传实际调用 `extractBearerToken` / `verifyApiToken`，没有 `requireApiToken()` 这个包装函数。
- Token 验证采用数据库哈希查询，不是草案所述复用会话的 timing-safe 比较函数。
- 原草案暂不实现上传速率限制，条件是个人站点、Token 仅由站长持有；放开使用范围后需重新评估。
- scope、独立限流、使用审计、daily/moment 上传均为可选扩展，不是本轮承诺。

前台公开评论只返回 `id/nickname/content/created_at/is_admin/parent_id`，不得新增 contact 字段。Token、可见性及 API 集成验收任务见[详细 TODO](../exec-plans/active/2026-11-13-project-hardening.md)。
