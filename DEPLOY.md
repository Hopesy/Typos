# Typos Deploy

线上地址：<https://typos.hopesy.workers.dev>

GitHub 仓库：<https://github.com/Hopesy/Typos>

## Cloudflare 部署

### 首次部署 / 重建 Worker

去 Cloudflare：

```txt
Workers & Pages -> Create application -> Import a repository -> Get started
```

选择：

```txt
Git account: Hopesy
Repository: Hopesy/Typos
Project name: typos
Production branch: main
Build command: npm run build
Deploy command: npm run deploy
Root directory: /
```

然后点：

```txt
Save and Deploy
```

### 查看部署结果

去 Cloudflare：

```txt
Workers & Pages -> typos -> Deployments
```

### 修改 Git 构建配置

去 Cloudflare：

```txt
Workers & Pages -> typos -> Settings -> Builds
```

### 设置后台密码

去 Cloudflare：

```txt
Workers & Pages -> typos -> Settings -> Variables and Secrets
```

设置 secret：

```txt
ADMIN_PASSWORD
ADMIN_SESSION_SECRET
```

D1 不要重建。当前数据库：

```txt
D1 database: typos-db
D1 binding: DB
```

### 数据库迁移

数据库表结构由 `migrations/` 下的 SQL 文件定义，按文件名顺序执行：

```txt
migrations/0001_init.sql          基础表（posts / daily / moments / comments / rate_limits）
migrations/0002_seed_content.sql  初始内容
migrations/0003_api_tokens.sql    API 密钥表
```

迁移是**自动执行**的。`npm run deploy` 在部署前会先运行 `wrangler d1 migrations apply DB --remote`，把所有未执行的迁移按顺序应用到远端 D1。Cloudflare Git Integration 的 Deploy command 就是 `npm run deploy`，所以每次 git push 触发构建时都会自动迁移。

因此：

- **首次部署**：新建空 D1 后首次部署，会从 `0001` 依次执行到最新，数据库结构自动完整。
- **后续更新**：新增 migration 文件并 push 后，Cloudflare 构建时自动应用，无需手动操作。

如需手动应用迁移（例如在 Cloudflare 之外操作）：

```bash
npm run db:migrations:apply         # 远端生产 D1
npm run db:migrations:apply:local   # 本地开发 D1
```


## 后续更新项目

本地改完代码后运行：

```bash
npm run lint
npx tsc --noEmit
npm run build
git add .
git commit -m "Update project"
git push origin main
```

真正触发线上部署的是：

```bash
git push origin main
```

推送后 Cloudflare 会自动构建并发布。

不要在 Windows 本机用 `npm run deploy` 当生产发布方式。

## 发布文章

去后台：

```txt
https://typos.hopesy.workers.dev/admin
```

操作：

```txt
输入 ADMIN_PASSWORD
进入文章管理
新建文章
填写 title / date / slug / description / category / content
保存
```

保存后访问：

```txt
https://typos.hopesy.workers.dev/posts/<slug>
```

文章保存到 D1，不需要提交代码，也不需要重新部署。

## License

MIT
