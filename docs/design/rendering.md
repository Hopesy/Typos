# Markdown 渲染与 Workers CPU

## 当前实现

共享入口为 `src/components/markdown-renderer.tsx` 的 `renderArticle()`：Markdown/GFM/数学解析 → 原始 HTML 解析与清洗 → 标题锚点和目录 → 外链/图注增强 → KaTeX → Shiki 双主题高亮 → HTML。

Shiki 使用 JS 引擎，相关配置在 `src/lib/shiki.ts`。后台预览、日常正文、文章详情复用此管线；修改清洗规则、主题或目录会跨场景生效。

- 后台预览：浏览器动态导入渲染器，约 400ms 防抖，缓存最近一次正文对应的 HTML/TOC。
- 后台保存：附带对应正文的预渲染结果；服务端优先将其写入 posts 缓存。
- API 保存：不携带浏览器结果时，`warmPostRenderCache` 尝试服务端渲染。
- 文章访问：`getRenderedPost` 以 FNV-1a 正文哈希判断命中，直接返回缓存 HTML；未命中才动态加载渲染器并回写。
- 旧库缺缓存列时回退无缓存渲染；预热与缓存回写失败目前静默处理。

## 为什么这样设计

历史曾出现 Cloudflare Error 1102：Worker 请求的 CPU 使用量超出所用套餐预算。Markdown AST、代码高亮、公式渲染是 CPU 工作，等待数据库/网络的墙钟耗时不等于 CPU 时间。

旧研究以当时免费套餐 10ms 预算作为约束；当前套餐额度和价格应查官方资料/实际环境，不把历史数字当作永久保证。

### 已采用的方案

- **B：浏览器预览**，移走高频渲染负载；旧 `/api/admin/preview` 已删除，不应在新文档或客户端中重新引用该接口。
- **C：保存时预热**，让正常访客更可能直接命中缓存。

### 无效或有条件的方案

- 仅关闭“实时”预览只能减少请求频率，不能降低单次渲染 CPU；不是独立解决方案。
- 提升 Workers 套餐/CPU 预算可提高余量，但增加费用，不是已经授权的修改。
- 按内容跳过 KaTeX/Shiki、精简语言或异步预渲染是候选优化，需兼容性和性能证据。

## 不能保证的边界

1. 预热失败、旧缓存缺失、API 发文或长文章仍可能触发 Worker 渲染；不能写成“永远命中”“再也不会 1102”。
2. 当前哈希只含正文，没有渲染器版本；升级清洗、主题、目录后，旧内容缓存可能不刷新。
3. 客户端 HTML 当前直接进入缓存，属于已登录管理员输入的信任边界，不等于服务端已重新清洗或验证 HTML 与正文一致。
4. `hashContent` 是快速非加密变更检测，不是来源认证或安全完整性校验。
5. 缓存 UPDATE 只按 slug 写回，后续需测试交错保存、旧请求回写和缓存失败是否影响正文/可见性。

## 后续验证

建立普通文章、长代码块、公式密集、原始 HTML、空正文、缺缓存和版本变更样例；分别测浏览器预览、后台保存、API 保存、首次和重复读取。固定 runtime、文章样例与版本，记录 CPU/延迟/失败，不以请求次数减少代替单次成本证明。

暂不默认改造全站动态渲染、locale Cookie 或公开 HTTP 缓存；它们与数据库里的 Markdown 渲染缓存是不同层次。历史“暂缓第六阶段”的条件继续有效，见[历史记录](../histories/2026-08/20260814-project-audit.md)。

任务及验收见[主计划](../exec-plans/active/2026-11-13-project-hardening.md)。历史 B/C 改造前基线 `65bdcfc` 仅用于 Git 比较，不把破坏性 hard reset 作为常规排错步骤。

参考：[1102](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1102/)、[Workers Limits](https://developers.cloudflare.com/workers/platform/limits/)、[2025 CPU 时间调整](https://developers.cloudflare.com/changelog/post/2025-03-25-higher-cpu-limits/)。
