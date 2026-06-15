---
title: "Hello Typos"
date: 2026-01-01
description: "Welcome to Typos - a minimal, HUD-styled personal publishing system built with Next.js and Cloudflare Workers"
category: "Getting Started"
cover: "https://imagehub-9na.pages.dev/file/1781184147751_image.png"
---

# Hello Typos

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

```txt
content/
|-- posts/    # Blog articles
|-- daily/    # Diary entries
`-- moments/  # Photo moments
```

Each content file is a Markdown file with YAML frontmatter.
