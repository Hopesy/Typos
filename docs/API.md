# Typos API 文档

通过 API 可以用脚本或自动化工具远程发布文章,无需登录后台。

---

## 🔑 前置条件

| 条件 | 说明 |
|------|------|
| **数据库** | API 上传依赖已配置的数据库后端(D1 / PostgreSQL / Turso / 本地 SQLite 均可)。未配置任何数据库时接口返回 `503` |
| **API Token** | 所有请求必须带 `Authorization: Bearer <token>` 请求头 |

### 获取 Token

在管理后台创建 API Token(`/admin` → API Token 管理),Token 形如 `typos_<64位十六进制>`。

> ⚠️ Token 明文只在创建时显示一次,数据库里只存 SHA-256 哈希,务必当场保存。

Token 可设置过期天数(`expiresInDays`),留空或为 0 表示永不过期。失效、过期或被删除的 Token 一律返回 `401`。

---

## 📤 发布文章

```
POST /api/v1/posts
```

接口根据请求头 `Content-Type` 自动判断提交格式,支持两种方式。

### 方式一:JSON

请求头:

```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

请求体字段:

| 字段 | 类型 | 必填 | 说明 |
|------|------|:---:|------|
| `content` | string | **是** | 正文(Markdown)。为空返回 `400` |
| `title` | string | 否 | 缺省时取正文第一个 `# 一级标题`,再缺省为 `Untitled` |
| `date` | string | 否 | 会截断到 `YYYY-MM-DD`;缺省为当天 |
| `description` | string | 否 | 摘要 |
| `category` | string \| string[] | 否 | 数组会拼成 `"A, B, C"` |
| `slug` | string | 否 | 缺省时由日期推导(去掉 `-` 后取后 6 位,如 `2026-06-18` → `260618`) |
| `cover` | string | 否 | 封面图 URL |

示例:

```bash
curl -X POST https://你的域名/api/v1/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "我的文章",
    "date": "2026-06-18",
    "description": "一句话摘要",
    "category": ["技术", "随笔"],
    "slug": "my-post",
    "cover": "https://example.com/cover.jpg",
    "content": "# 我的文章\n\n正文内容..."
  }'
```

### 方式二:原始 Markdown

把整篇 `.md` 文件作为请求体直接发送,支持 YAML frontmatter。请求头的 `Content-Type` 为非 JSON 类型即可(如 `text/markdown`)。空 body 返回 `400`。

请求头:

```
Authorization: Bearer YOUR_TOKEN
Content-Type: text/markdown
```

Markdown 文件内容:

```markdown
---
title: 我的文章
date: 2026-06-18
description: 一句话摘要
category: [技术, 随笔]
slug: my-post
cover: https://example.com/cover.jpg
---

# 我的文章

正文内容...
```

frontmatter 全部可选;`category` 和 `categories` 两个键都识别。没有 frontmatter 也可以,此时标题取正文首个 `#` 标题。

示例:

```bash
curl -X POST https://你的域名/api/v1/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: text/markdown" \
  --data-binary @my-post.md
```

---

## ✅ 响应

成功:

```json
{ "success": true, "slug": "my-post" }
```

失败:

```json
{ "error": "错误描述" }
```

| 状态码 | 含义 |
|:---:|------|
| `200` | 发布成功 |
| `400` | 请求体为空 / 正文为空 / JSON 格式错误 |
| `401` | 缺少 Bearer Token,或 Token 无效、过期、被禁用 |
| `500` | 服务端错误(返回具体 message) |
| `503` | 未配置任何数据库后端 |

---

## ⚠️ 注意事项

1. **slug 会被清洗**:只保留 `a-z A-Z 0-9 _ -`,其它字符替换成 `-`。中文 slug 会被打散,建议显式传英文或数字 slug。
2. **同 slug 覆盖更新**:写入使用 `INSERT ... ON CONFLICT(slug) DO UPDATE`,slug 相同即更新已有文章而非新增。可借此实现编辑。
3. **`date` 只保留日期部分**:即使带时间也会被截断为 `YYYY-MM-DD`。
4. **接口禁用缓存**:响应头带 `Cache-Control: no-store`。

