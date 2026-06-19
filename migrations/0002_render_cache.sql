-- 文章渲染缓存：缓存 Markdown -> HTML 的结果，避免每次请求都重跑 Shiki/unified
-- （CPU 密集，Cloudflare Workers Free 套餐易触发 Error 1102「Worker exceeded resource limits」）。
-- render_hash 为正文内容哈希；正文变更后哈希不同，下次访问自动重渲染并回写。
ALTER TABLE posts ADD COLUMN rendered_html TEXT NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN rendered_toc TEXT NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN render_hash TEXT NOT NULL DEFAULT '';
