CREATE TABLE IF NOT EXISTS posts (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(date DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);

CREATE TABLE IF NOT EXISTS daily (
  filename TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_daily_date ON daily(date DESC);

CREATE TABLE IF NOT EXISTS moments (
  filename TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_moments_date ON moments(date DESC);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  nickname TEXT NOT NULL,
  contact TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  parent_id TEXT,
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_slug_created_at ON comments(slug, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

CREATE TABLE IF NOT EXISTS rate_limits (
  ip_address TEXT PRIMARY KEY,
  last_comment_at INTEGER NOT NULL
);

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

INSERT OR IGNORE INTO posts (slug, title, date, description, category, content)
VALUES (
  'hello-typos',
  'Hello Typos',
  '2026-01-01',
  'Welcome to Typos - a minimal, HUD-styled personal publishing system built with Next.js and Cloudflare Workers',
  'Getting Started',
  '# Hello Typos

Welcome to **Typos** - a minimal, HUD-styled personal publishing system built with Next.js 16, Tailwind CSS 4, OpenNext, Cloudflare Workers, and Cloudflare D1.

## Features

- **Minimal HUD design** - Tactical layout with dither background effects
- **Content types** - Posts, daily diary, and photo moments
- **Markdown-driven** - Write content in Markdown with YAML frontmatter
- **Admin dashboard** - Password-protected admin panel for managing content
- **Comment system** - With rate limiting and Telegram notifications
- **Cloudflare-ready** - Deploy to Cloudflare Workers with OpenNext and D1 database

## Quick Start

```bash
git clone <your-repo>
cd typos
npm install
npm run dev
```

Set your own `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` in `.env.local` before using the admin dashboard. The project does not provide default admin credentials.

## Directory Structure

```
content/
|-- posts/    # Blog articles
|-- daily/    # Diary entries
`-- moments/  # Photo moments
```

Each content file is a Markdown file with YAML frontmatter.'
);

