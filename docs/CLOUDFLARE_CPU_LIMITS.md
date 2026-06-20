# Cloudflare Workers CPU 限制与文章渲染（1102 说明）

本文档记录 Typos 部署在 Cloudflare Workers 上反复遇到的 **Error 1102（Worker exceeded resource limit）** 的根因、现状代码的应对、以及为什么"关掉实时预览"并不能彻底解决问题。作为下一步改造（预览改客户端渲染）前的基线记录，方便回退对照。

---

## 1. 1102 到底限制什么

`Error 1102` 是 **Worker 单个请求里真正执行 JS 代码累计耗时（CPU 时间）超限**，与内存、带宽、请求数、墙钟时间都无关。

| 计划 | 单请求 CPU 时间上限 |
|------|--------------------|
| **Free（免费）** | **10 ms** |
| Paid（$5/月） | 默认 30 s，可配到 5 min |

关键区分 —— **CPU 时间 ≠ 墙钟时间**：

- **算 CPU 时间**：循环、解析、字符串处理、正则、AST 遍历等"真正在跑代码"的部分。
- **不算 CPU 时间**：`await` 等数据库（D1）、等 `fetch`、等响应体传输等 I/O 挂起时间。等多久都不计。

所以一个请求即使墙钟跑了 2 秒，只要其中 1.99 秒在等数据库、真正跑代码只有 8 ms，免费档也**不会** 1102；反过来数据库秒回但渲染跑了 15 ms，就会被杀。

> 这不是 Cloudflare 对本项目特别严格，而是免费档对**所有** Worker 都只给 10 ms。问题在于本项目的渲染管线单次 CPU 成本偏高。

参考：
- [Error 1102 · Cloudflare Support](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1102/)
- [Limits · Cloudflare Workers](https://developers.cloudflare.com/workers/about/limits/)
- [Run Workers for up to 5 minutes of CPU-time（2025-03-25）](https://developers.cloudflare.com/changelog/post/2025-03-25-higher-cpu-limits/)

---

## 2. 本项目的 CPU 瓶颈在哪

瓶颈是 `src/components/markdown-renderer.tsx` 里 `renderArticle()` 的整条同步管线，没有一处是 I/O，全部累计算进那 10 ms：

```
unified()
  .use(remarkParse)                 ┐
  .use(remarkGfm)                   │
  .use(remarkMath)                  │  全部 CPU 计算
  .use(remarkRehype)                │  没有 I/O
  .use(rehypeRaw)                   │  → 累计算进 10ms
  .use(rehypeKatex)                 │  ← KaTeX 公式编译，第二烧
  .use(rehypeShikiFromHighlighter)  │  ← Shiki 高亮，最烧
  .use(rehypeStringify)             ┘
  .process(content)
```

此外首次调用 `getHighlighter()`（`src/lib/shiki.ts`）的 `createHighlighterCore` 要把 **2 个主题 + 12 种语言语法** 加载编译进内存，这个冷启动本身就可能单独吃掉数毫秒。

**文章越长、代码块越多、公式越多，单次累计 CPU 越高，越容易冲破 10 ms。**

---

## 3. 现状代码已有的应对：D1 渲染缓存

`src/lib/content.ts` 的 `getRenderedPost()` 已实现"按正文哈希缓存渲染结果"：

- 用 FNV-1a 对正文算 `hash`，与 `posts` 表里的 `render_hash` 比对。
- **命中**：直接 `return rendered_html`，**完全跳过**上面整条管线，CPU 接近 0 → 命中缓存的文章详情页**从不** 1102。
- **未命中**：动态 `import` 渲染器，现场跑完整管线并把结果回写 `posts.rendered_html / rendered_toc / render_hash`。
- 旧库未跑迁移（缺这几列）时自动回退为无缓存渲染。

---

## 4. 为什么"关掉实时预览"治不了本

关掉实时渲染只降低了请求**频率**，没有降低**单次请求的 CPU 成本**。以下两条路径与"实时不实时"无关，仍会跑完整管线：

1. **`/api/admin/preview`**（`src/app/api/admin/preview/route.ts`）
   编辑器预览复用了 `renderArticle()`。现在 `src/app/admin/page.tsx` 是 400 ms 防抖触发；即便完全关掉实时预览，只要点"预览"仍会触发一次完整 Shiki + KaTeX 渲染。

2. **缓存未命中的首次文章访问**
   新发布或改过正文的文章，第一个访问者触发现场渲染回写。这一次就可能 1102 —— 且**失败后不会写入缓存**，导致后续每个访问者都重试、每次都失败，直到某次侥幸在 10 ms 内跑完才写入。

> 结论：单次 CPU 成本只要 > 10 ms，无论频率多低，迟早还会撞墙。

---

## 5. 候选方案（下一步要做的是 B）

| 方案 | 做法 | 优点 | 缺点 |
|------|------|------|------|
| **A. 升级 Workers Paid** | `wrangler.jsonc` 配 `limits.cpu_ms`，上限 10ms→30s | 不改架构，最彻底 | $5/月 |
| **B. 预览改客户端渲染** ✅ | 编辑器预览不再调 `/api/admin/preview`，改用浏览器端 markdown 渲染 | 免费档也能流畅实时预览，Worker 零负担 | 预览与发布渲染器不同源，效果可能有细微差异；客户端 bundle 变大 |
| **C. 保存时预渲染** | `/api/admin/save` 保存即渲染写库，读取永命中缓存 | 访客端 1102 根治 | 保存请求本身仍跑渲染，超长文章在免费档仍可能 1102（风险转移到作者） |
| **D. 渲染管线减负** | 砍 Shiki 语言、无公式跳 KaTeX、无代码块跳 Shiki | 免费、降单次 CPU | 治标不治本，牺牲功能 |

**下一步采用方案 B**：把编辑器预览迁到客户端渲染，CPU 花在用户本机、不占 Worker。配合现有 D1 缓存（第 3 节）覆盖访客端，免费档下仅剩"保存超长文章"那一瞬间有理论风险，可后续用 C/D 兜底。

---

## 6. 回退基线

本文档提交时的关键文件状态，作为方案 B 改造出问题时的回退参照：

- 渲染管线：`src/components/markdown-renderer.tsx`（`renderArticle`）
- 高亮器：`src/lib/shiki.ts`（2 主题 + 12 语言）
- 文章页读取 + D1 缓存：`src/lib/content.ts`（`getRenderedPost`）
- 服务端预览接口：`src/app/api/admin/preview/route.ts`
- 编辑器预览触发：`src/app/admin/page.tsx`（400 ms 防抖 useEffect）

改造方案 B 时，预期改动集中在 `src/app/admin/page.tsx`（预览来源切换为客户端），`/api/admin/preview` 可保留兜底或逐步弃用，**第 3 节的 D1 缓存逻辑应保持不变**（访客端仍依赖它）。
