# Typos Deployment Guide

This document records the current deployment shape, the production publishing flow, and the content publishing workflow for Typos.

Original source: <https://github.com/arkleselect/MiniLoad>. Typos is a renamed and deployment-focused derivative of MiniLoad.

## Current Deployment Model

Typos is configured for Cloudflare Workers, not Cloudflare Pages.

The production stack is:

- Next.js 16 / App Router
- React 19
- Tailwind CSS 4
- OpenNext Cloudflare adapter
- Cloudflare Workers
- Workers Assets
- Cloudflare D1

Official references:

- Cloudflare Next.js guide: <https://developers.cloudflare.com/workers/frameworks/framework-guides/nextjs/>
- OpenNext Cloudflare guide: <https://opennext.js.org/cloudflare/get-started>
- Cloudflare Deploy Button: <https://developers.cloudflare.com/workers/platform/deploy-buttons/>

## What Was Optimized

The project was changed to match the current Cloudflare Workers + OpenNext deployment path.

Key changes:

- Removed the old `@cloudflare/next-on-pages` / Cloudflare Pages deployment path.
- Added `@opennextjs/cloudflare` and `wrangler` deployment scripts.
- Added OpenNext Cloudflare setup in `next.config.ts` and `open-next.config.ts`.
- Added `wrangler.jsonc` with Worker entry, Workers Assets, D1 binding, service binding, and compatibility flags.
- Added D1 migrations for posts, daily logs, moments, comments, and rate limits.
- Added seed content so the first deployment has a visible example post.
- Reworked admin authentication to use signed HttpOnly cookie sessions.
- Removed localStorage-based admin keys and Authorization-header admin access.
- Reworked admin APIs to use cookie authentication.
- Reworked comments to use real comment IDs, parent IDs, D1 storage, and D1-backed rate limiting.
- Added `public/_headers` for long-term immutable caching of Next static assets.
- Updated ESLint ignores so generated `.open-next` and `.wrangler` output is not linted.
- Documented the Windows native OpenNext preview boundary.

Important files:

- `package.json`
- `next.config.ts`
- `open-next.config.ts`
- `wrangler.jsonc`
- `.env.example`
- `migrations/0001_init.sql`
- `migrations/0002_seed_content.sql`
- `src/lib/cloudflare.ts`
- `src/lib/admin-auth.ts`
- `src/lib/admin-content.ts`
- `src/app/api/admin/auth/route.ts`
- `src/app/api/comments/route.ts`
- `src/app/admin/page.tsx`
- `src/components/comments.tsx`

## Verified Commands

These checks passed in the local workspace:

```bash
npm ls postcss
npm audit --audit-level=low
npx tsc --noEmit
npm run lint
npm run build
npx opennextjs-cloudflare build
npm run db:migrations:apply:local
npx wrangler deploy --dry-run
```

Runtime smoke checks also passed under `npm run dev`:

```txt
GET  /posts                            -> 200
GET  /posts/hello-typos                 -> 200
GET  /api/comments?slug=hello-typos     -> 200
POST /api/admin/auth malformed JSON    -> 400
POST /api/admin/auth wrong password    -> 401
POST /api/admin/auth correct password  -> 200
GET  /api/admin/auth with cookie       -> 200
GET  /api/admin/list?type=post no auth -> 401
GET  /api/admin/list?type=post authed  -> 200
```

## Deploy With the Cloudflare Button

This is the intended one-click deployment path.

### 1. Push the Project to GitHub

This workspace was not a Git repository when the deployment work was done. Initialize it before publishing:

```bash
git init
git add .
git commit -m "Prepare Cloudflare Workers deployment"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/typos.git
git push -u origin main
```

Use a public GitHub repository for the deploy button flow.

### 2. Replace the README Deploy Button URL

The README currently contains a placeholder repository URL:

```md
https://deploy.workers.cloudflare.com/?url=https://github.com/YOUR_GITHUB_USERNAME/typos
```

Replace it with the real repository URL:

```md
https://deploy.workers.cloudflare.com/?url=https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY
```

Commit and push that change:

```bash
git add README.md
git commit -m "Update Cloudflare deploy button URL"
git push
```

### 3. Click Deploy to Cloudflare

Open the README on GitHub and click the Deploy to Cloudflare button.

The button URL can also be opened directly:

```txt
https://deploy.workers.cloudflare.com/?url=https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY
```

Cloudflare will read:

- `package.json`
- `wrangler.jsonc`
- `package.json.cloudflare.bindings`
- `migrations/`

The deployment script is:

```bash
opennextjs-cloudflare build
wrangler d1 migrations apply DB --remote
opennextjs-cloudflare deploy
```

### 4. Configure Required Variables

Set these variables during the Cloudflare deploy flow or in the Cloudflare dashboard after deployment. Disable non-production branch builds for the initial personal-site deployment unless you need branch previews.

| Variable | Required | Purpose |
| --- | --- | --- |
| `ADMIN_PASSWORD` | Yes | Password for `/admin`. Cloudflare does not generate it automatically; set a long random value and keep it private. |
| `ADMIN_SESSION_SECRET` | Yes | Secret used to sign admin session cookies. Cloudflare does not generate it automatically; generate one with Node or `openssl rand -hex 32`. |
| `SITE_URL` | No | Can be left unset on first deploy. Set it in the Cloudflare dashboard after Cloudflare gives you the final public URL. |
| `TELEGRAM_BOT_TOKEN` | No | Telegram bot token for comment notifications. Leave unset when Telegram notifications are disabled. |
| `TELEGRAM_CHAT_ID` | No | Telegram chat ID for comment notifications. Leave unset when Telegram notifications are disabled. |

Generate a session secret with Node:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

### 5. Confirm D1 Binding

The required D1 binding name is:

```txt
DB
```

The Worker code, migrations, and deployment script all expect the D1 binding to be named `DB`.

If Cloudflare asks you to create or select a D1 database, use:

```txt
Database name: typos-db
Binding name: DB
```

### 6. Verify the Deployment

After deployment, open:

```txt
https://YOUR_WORKER_DOMAIN/
https://YOUR_WORKER_DOMAIN/posts
https://YOUR_WORKER_DOMAIN/posts/hello-typos
https://YOUR_WORKER_DOMAIN/admin
```

Log in to `/admin` with `ADMIN_PASSWORD`.

## Manual Wrangler Deployment

Use this path only if the deploy button flow is not enough or you want to deploy from your local machine.

### 1. Install Dependencies

```bash
npm install
```

### 2. Log In to Cloudflare

```bash
npx wrangler login
```

### 3. Create a D1 Database

```bash
npx wrangler d1 create typos-db
```

Copy the returned `database_id` into `wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "typos-db",
    "database_id": "PASTE_REAL_DATABASE_ID_HERE",
    "migrations_dir": "migrations"
  }
]
```

Keep the binding name as `DB`.

### 4. Set Secrets

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_SESSION_SECRET
```

Optional Telegram secrets:

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
```

### 5. Set the Public Site URL

`SITE_URL` is optional on first deploy. After Cloudflare gives you the final Workers URL or after you bind a custom domain, set `SITE_URL` in the Cloudflare dashboard environment variables.

Do not commit a temporary `SITE_URL` into `wrangler.jsonc`; keeping it out of Wrangler avoids duplicate deploy-form entries.

### 6. Deploy

```bash
npm run deploy
```

The script will build OpenNext output, apply remote D1 migrations, and deploy the Worker.

## Local Development

Create `.env.local`:

```env
ADMIN_PASSWORD=your-secure-password
ADMIN_SESSION_SECRET=replace-with-a-long-random-secret
SITE_URL=http://localhost:3000
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

Start the Next.js development server:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

Apply local D1 migrations when needed:

```bash
npm run db:migrations:apply:local
```

Preview with Workers runtime:

```bash
npm run preview
```

Windows note:

OpenNext currently warns that it is not fully compatible with native Windows runtime preview. If `npm run preview` returns a `ChunkLoadError` on Windows, verify Workers runtime in WSL, Linux, or Cloudflare's deployment environment. This does not block `opennextjs-cloudflare build` or `wrangler deploy --dry-run`.

## Publishing New Posts

The recommended production workflow is to publish through `/admin`.

Production reads from D1 when the `DB` binding exists. The local `content/` Markdown files are mainly for development fallback and seed content. Do not rely on pushing only Markdown files to GitHub for production publishing after D1 is enabled.

### Recommended: Publish From `/admin`

1. Open:

   ```txt
   https://YOUR_DOMAIN/admin
   ```

2. Log in with `ADMIN_PASSWORD`.

3. Select the post content type.

4. Fill in:

   ```txt
   slug: my-first-post
   title: My First Post
   date: 2026-06-06
   description: Short summary
   category: Notes
   content: Markdown body
   ```

5. Save.

6. Open:

   ```txt
   https://YOUR_DOMAIN/posts/my-first-post
   ```

This writes the article to Cloudflare D1.

### GitOps Option: Publish Through a D1 Migration

Use this when you want versioned content changes in Git, batch imports, or repeatable migrations.

Create a new migration file:

```txt
migrations/0003_add_my_first_post.sql
```

Example:

```sql
INSERT OR REPLACE INTO posts (slug, title, date, description, category, content)
VALUES (
  'my-first-post',
  'My First Post',
  '2026-06-06',
  'Short summary',
  'Notes',
  '# My First Post

This is the Markdown body.'
);
```

Commit and push:

```bash
git add migrations/0003_add_my_first_post.sql
git commit -m "Add my first post"
git push
```

Redeploy. The deployment script applies remote D1 migrations before publishing the Worker.

### Local Markdown Option

For local development only, add Markdown files under:

```txt
content/posts/
content/daily/
content/moments/
```

Example post file:

```txt
content/posts/my-first-post.md
```

Example front matter:

```md
---
title: "My First Post"
date: 2026-06-06
description: "Short summary"
category: "Notes"
---

# My First Post

This is the Markdown body.
```

When D1 is bound in production, D1 takes priority over these local Markdown files.

## Troubleshooting

### Deploy Button Cannot Find the Repository

Check that:

- The GitHub repository is public.
- The deploy button URL points to the real repository.
- The pushed branch contains `package.json` and `wrangler.jsonc`.

### D1 Errors After Deployment

Check that:

- The D1 binding name is exactly `DB`.
- The D1 database exists.
- Remote migrations have run.
- `migrations/0001_init.sql` and `migrations/0002_seed_content.sql` are in the repository.

Manual migration command:

```bash
npm run db:migrations:apply
```

### Admin Login Fails

Check that:

- `ADMIN_PASSWORD` is set.
- `ADMIN_SESSION_SECRET` is set.
- The browser accepts cookies for the deployed domain.
- You are opening the same domain that set the session cookie.

### Comment Notification Links Are Wrong

Set `SITE_URL` to the final public URL:

```txt
https://YOUR_DOMAIN
```

### Windows Preview Returns ChunkLoadError

Use WSL, Linux, or Cloudflare deployment preview for Workers runtime verification. Native Windows preview can fail in OpenNext runtime chunk loading even when the production build output is valid.
