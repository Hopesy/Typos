# 2026-11-13 后台顶部操作按钮文字视觉居中

## 用户目标

修复“新建”“上传”按钮中文字没有上下视觉居中的问题。保持 HUD 风格、按钮尺寸、操作逻辑及窄屏仅图标布局；不扩展为整站重设计。

## 原因与改动

顶部共用操作按钮使用 flex 居中行盒，但没有复用保存等按钮已有的 `text-trim-caps` 字形边界处理。

- `src/app/admin/page.tsx`：操作按钮统一 `leading-none`，新建/列表、上传、批量下载、新建密钥标签复用 `hidden text-trim-caps sm:block`。
- `src/app/globals.css`：不支持 text-box-trim 时保留 0.5px 垂直位移，移除 fallback 的 display 覆盖；标签作为 flex 子项已有块级化，不应覆盖窄屏 hidden。
- `eslint.config.mjs`：仅排除已被 Git 忽略的 `tmp/**` 本地验证产物，应用源码的 ESM 和其他检查规则不变。
- 不改动按钮点击回调、请求、数据保存、鉴权、包版本或锁文件。

## 验证环境与范围

- 代码基线：`5641cc4707394dfd7ba4e073f32e6acc8f69b947` 加既有文档接入变更和本次样式修复。
- 用户明确授权从 npm 官方注册表临时使用 `node-win-x64@22.16.0`、`npm@10.9.2` 并执行 `npm ci`；未改变全局运行时。
- 本地 Next dev 监听 `127.0.0.1:3000`，数据库位于本次 `tmp/` 验证目录，使用独立测试口令，禁用真实通知，未访问生产。
- 浏览器使用 ego-browser 任务空间 30 的真实应用页面；不是仅渲染组件样例。

## 实际验收结果

| 检查 | 结果 |
| --- | --- |
| 中文 / 英文、明暗主题 | 已查看截图，顶部文字视觉位置已校正 |
| 按钮尺寸与文字盒 | 按钮高度保持 32px；支持裁边时标签高度为 7px，标签盒与按钮垂直中心一致；同时以截图核对实际字形 |
| 390px 窄屏 | 文字保持隐藏，只显示图标，明暗主题画面均检查 |
| 639 / 640px 断点 | 639px 标签隐藏；640px 标签显示 |
| 不支持裁边的回退 | 从实际编译 CSS 提取 fallback 并模拟启用；窄屏文字仍隐藏。不是独立旧版浏览器实测 |
| 新建入口 | 实际点击后正常打开文章编辑表单 |
| 上传入口 | 实际点击上传并选择本地 Markdown，标题和正文成功进入编辑器；没有点击发布 |
| `npm run lint` | 最终通过；首次仅因临时 CommonJS 检查脚本失败，排除 tmp 产物后复跑通过 |
| `tsc --noEmit` | 通过，恢复会话后复验通过 |
| `npm test` | 10 个测试文件、27 项测试全部通过，恢复会话后复验通过 |
| `git diff --check` | 通过 |
| package.json / package-lock.json | 无改动 |
| 生产 Next 构建 | 用户授权提交部署后，以 Node 22.16.0/npm 10.9.2 和隔离本地数据库执行 `npm run build` 通过，包含生产编译、类型检查、页面数据收集和页面生成 |
| Linux Worker 构建 | 本地 Windows 未运行；由既有 CI/Cloudflare 发布流程验证，不以 Next build 替代 |

前后对照是在真实后台临时移除本次新增居中类来重放旧样式，随后恢复修复样式；没有宣称启动了另一个旧提交的完整构建。

## 本地证据

证据位于 `tmp/admin-align-20261113-0730/`，不进入 Git：

- `before-zh-dark.png`、`after-zh-dark.png`：中文旧样式重放与修复后对照。
- `before-en-dark.png`、`after-en-dark.png`：英文旧样式重放与修复后对照。
- `after-zh-light.png`、`after-en-light-settled.png`：亮色主题。
- `after-mobile-light-settled.png`、`after-mobile-dark.png`：过渡完成后的窄屏画面。
- `round-07.mjs` / `round-08.mjs`：新建、实际选择文件及导入结果检查。
- `round-10.mjs` / `round-14.mjs`：回退规则、断点和主题验证。

窗口最小化、文件选择后旧 ref 失效、跨轮次 CDP 仿真不保留等工具问题已在原任务空间内排查；以上以最终成功检查为准。测试浏览器空间已关闭，恢复会话时确认本地 3000 端口没有监听进程。

## 独立发现与边界

依赖安装成功，但 npm 报告 35 项漏洞（4 low、18 moderate、11 high、2 critical）。这里只记录审计汇总，尚未逐项确认影响与生产可达性；不在按钮修复中执行强制升级。后续见[技术债追踪](../../exec-plans/tech-debt-tracker.md)。

初次通用 node 包安装曾因嵌套安装 `EALLOWSCRIPTS` 失败，随后使用用户授权的 Windows 预编译包成功，不修改脚本权限规则。

## 提交与发布验证

用户后续明确要求“提交并部署”，并确认沿用仓库最近提交的作者身份，仅用于本次提交，不修改全局 Git 配置。

- 修复及文档整合提交：`a328f3386ddf34758b6b5c4bb8781a05caaf5520`；在独立修复分支提交，再快进 main，已成功推送 origin/main。
- 发布沿用 Cloudflare Git Integration；没有在 Windows 本机执行生产 deploy，也没有新增或手动执行生产 migration。
- 2026-11-13 09:18:29 UTC，线上 `/` 与 `/admin` 均返回 HTTP 200；`/admin` 引用的 `/_next/static/chunks/0mylz1n_681ja.js` 已包含本次唯一新增标签类 `hidden text-trim-caps sm:block`，确认实际服务的应用资源已更新。
- 对应脚本 SHA-256：`6c1f873c8e6082946f6d3ed610050cf135246e8cb25073a7f971126c99d2268b`。检查只读取公开登录页和静态资源，没有访问已登录后台或发布生产文章。
- GitHub CLI 未登录、Wrangler 缺少 Cloudflare API token，未读取远端 CI/部署控制台日志；不把线上资源校验表述为所有远端检查已通过。
- `.claude/settings.json` 含本机绝对路径，保留在本地、未提交或推送；临时口令、数据库和截图也未进入 Git。

任务状态见[主计划 U01](../../exec-plans/active/2026-11-13-project-hardening.md)。
