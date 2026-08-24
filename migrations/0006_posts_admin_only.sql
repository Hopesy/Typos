-- 后台可见文章：保留文章内容，但不出现在公开文章列表、详情页和公开统计中。
ALTER TABLE posts ADD COLUMN admin_only INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_posts_admin_only_updated_at
ON posts(admin_only, updated_at DESC, created_at DESC, slug DESC);
