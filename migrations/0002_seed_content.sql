INSERT OR IGNORE INTO posts (slug, title, date, description, category, content)
VALUES (
  'hello-monotrace',
  'Hello MonoTrace',
  '2026-01-01',
  'Welcome to MonoTrace - a minimal, HUD-styled personal publishing system built with Next.js and Cloudflare Workers',
  'Getting Started',
  '# Hello MonoTrace

Welcome to **MonoTrace** - a minimal, HUD-styled personal publishing system built with Next.js 16, Tailwind CSS 4, OpenNext, Cloudflare Workers, and Cloudflare D1.

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
cd monotrace
npm install
npm run dev
```

Set up your environment variables in `.env.local`:

```env
ADMIN_PASSWORD=your-secure-password
ADMIN_SESSION_SECRET=replace-with-a-long-random-secret
```

## Directory Structure

```
content/
|-- posts/    # Blog articles
|-- daily/    # Diary entries
`-- moments/  # Photo moments
```

Each content file is a Markdown file with YAML frontmatter.'
);
