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

## 5. 已实施方案：B + C

下面两项已落地（commit 见 git 历史），其余 A/D 作为后续可选项保留。

| 方案 | 做法 | 状态 |
|------|------|------|
| **B. 预览改客户端渲染** | 编辑器预览不再调 `/api/admin/preview`，改为在浏览器内 `import('@/components/markdown-renderer')` 直接跑 `renderArticle()` | ✅ 已实施 |
| **C. 保存时预热渲染缓存** | 保存文章时把渲染结果写入 D1（`rendered_html/rendered_toc/render_hash`），读取路径永命中缓存 | ✅ 已实施 |
| A. 升级 Workers Paid | `wrangler.jsonc` 配 `limits.cpu_ms`，上限 10ms→30s | 备选 |
| D. 渲染管线减负 | 砍 Shiki 语言、按需跳过 KaTeX/Shiki | 备选 |

### B + C 如何协同消除 1102

1. **编辑器预览（高频，原 1102 重灾区）**：`renderArticle` 在用户浏览器里跑，CPU 完全不落在 Worker 上。因为复用的是**同一套管线**（remark/rehype + Shiki + KaTeX），预览与发布后效果**完全一致**，没有"渲染器不同源"的差异问题。
2. **保存文章**：浏览器把刚渲染好的 HTML/TOC 随保存请求一并送给 `/api/admin/save`；服务端直接写入 D1 缓存，**保存路径也不在 Worker 跑 Shiki/KaTeX**。仅当客户端结果缺失时才回退为服务端渲染一次（低频，可接受）。
3. **访客读取文章**：`getRenderedPost` 命中第 2 步写入的缓存，直接返回 HTML，**永不现场渲染**。第一位访客也命中，不再有"冷缓存首访 1102 且反复失败"的问题。

结果：免费档 10ms 下，三条原本会触发 1102 的路径全部不再在 Worker 上跑渲染管线。

### 关键改动文件

- `src/app/admin/page.tsx`：预览 `useEffect` 改为浏览器内 `renderArticle`；`lastRenderRef` 暂存渲染结果；`handleSubmit` 保存时附带 `rendered`。
- `src/lib/content.ts`：导出 `hashContent`；新增 `warmPostRenderCache()`（优先用客户端渲染结果，否则服务端渲染一次，失败静默）。
- `src/lib/admin-content.ts`：`saveD1Item` 的 post 分支在 upsert 后调用 `warmPostRenderCache`。
- `src/app/api/admin/preview/route.ts`：**已删除**（B 之后无人调用，且正是 Worker 侧 CPU 风险点）。

---

## 6. 候选方案备注（A / D）

- **A. 升级 Workers Paid（$5/月）**：一行配置把 CPU 上限拉到 30s，是唯一能彻底无视管线成本的解。若日后出现"保存超长文章"偶发 1102，可考虑。
- **D. 渲染管线减负**：砍 Shiki 语言、无公式跳 KaTeX、无代码块跳 Shiki，可进一步降低单次 CPU，作为 A 的免费替代兜底。

---

## 7. 回退基线

本轮 B+C 改造前的干净基线为 commit `65bdcfc`（仅含本文档初版）。若改造出问题，`git reset --hard 65bdcfc` 即可回到"服务端预览 + 仅读取缓存"的状态。

改造后涉及的关键文件：

- 渲染管线：`src/components/markdown-renderer.tsx`（`renderArticle`，服务端/浏览器同构）
- 高亮器：`src/lib/shiki.ts`（2 主题 + 12 语言，JS 引擎无 WASM，浏览器可跑）
- 读取 + 缓存：`src/lib/content.ts`（`getRenderedPost` 读缓存、`warmPostRenderCache` 写缓存）
- 保存：`src/lib/admin-content.ts`（`saveD1Item` post 分支）
- 编辑器：`src/app/admin/page.tsx`（预览 effect / `lastRenderRef` / `handleSubmit`）
