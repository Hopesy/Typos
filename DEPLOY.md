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
