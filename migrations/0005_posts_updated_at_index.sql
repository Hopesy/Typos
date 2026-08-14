CREATE INDEX IF NOT EXISTS idx_posts_updated_at
ON posts(updated_at DESC, created_at DESC, slug DESC);
