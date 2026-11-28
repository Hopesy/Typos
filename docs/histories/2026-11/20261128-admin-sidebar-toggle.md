# 2026-11-28 后台左侧边栏展开与收起按钮

## 用户目标

补齐管理后台桌面端左侧边栏缺失的展开/收起状态按钮。经用户确认采用以下交互方案（accepted）：

1. **按钮位置与成组关系**：用户在预览后指示展开态放在侧栏品牌区 `v1.1.4` 版本号右侧更合适，并进一步明确收起态下按钮与顶部 `T` 图标应归为一组（初稿置于主顶栏标题前、以及二稿在 `T` 与展开按钮之间加分割线均 superseded）。最终将同一个 `SidebarToggle` 始终置于侧栏顶部品牌区内：展开态（`240px`）位于 `v1.1.4` 右侧；收起态（`64px`）与顶部单 `T` 品牌标上下紧凑居中成组（无中间分割线，仅在组下方保留一条分割线与导航区分隔）。
2. **空白区交互**：移除原 `<aside>` 中部空白区点击切换及整栏手型光标（`md:cursor-pointer`），仅保留显式按钮触发，避免误触。

## 变更与理由

此前 `src/app/admin/page.tsx` 虽已维护 `isSidebarCollapsed` 状态，但桌面端无任何可见触发控件，仅将点击事件绑定在 `<aside>` 容器上并对品牌区、导航区与底部区调用 `stopPropagation`，导致只能通过中部空白缝隙隐式切换。

- `src/components/admin/sidebar-toggle.tsx`：新增独立的 `SidebarToggle` 组件，使用 `PanelLeftClose`（展开态 → 点击收起）与 `PanelLeftOpen`（收起态 → 点击展开）区分双态图标，维护 `aria-expanded`、`aria-controls="admin-sidebar"`、`title` 与本地化 `aria-label`；尺寸与边框风格对齐顶栏右侧 `ThemeToggle compact`（`28×28px`）。
- `src/app/admin/page.tsx`：接入 `SidebarToggle` 并修正桌面端 `h1` 残留的 `md:mb-1` 偏移，使按钮与标题垂直中心一致；移除 `<aside>` 点击切换、整栏 `md:cursor-pointer` 与子容器冗余 `stopPropagation`；收起态居中顶部 `BrandMark` 并为侧栏各图标按钮补齐悬停 `title` 与 `aria-label`；保留窄屏（`< 768px`）抽屉完整字标与导航文字回退。
- `messages/zh.json`、`messages/en.json`：新增 `admin.nav.expandSidebar`、`collapseSidebar`、`openMenu`、`closeMenu` 中英文文案。
- `src/components/admin/sidebar-toggle.test.tsx`：新增中英文展开/收起双态属性与图标切换单元测试。
- `src/app/globals.css`、`src/components/admin/home-manage-view.tsx`：修复亮色主题下「首页管理 → 状态栏」实时预览区域背景变深灰（`bg-neutral-900/30` 未被 `.admin-shell` 亮色规则覆盖，回退为 `30%` 黑色透明叠底）的问题。新增 `--admin-stage` 暖纸底台变量（亮色 `#f1efe7`、暗色 `#141414`）并统一预览胶囊的亮暗阴影层次；同步补齐 `.admin-shell` 对 `bg-neutral-900/30`、`bg-neutral-800/70`、`border-neutral-800/80` 及 `border-neutral-500/60/700` 的主题映射与复选框强调色。

长期交互约定同步见[后台编辑器专题](../../design/editor.md)，任务进度见[活动计划](../../exec-plans/active/2026-11-13-project-hardening.md)。

## 验证

- **基线提交 / 工作区范围**：`68773b8`（应用版本 `1.1.4`），仅本地修改源码、文案、单测与文档，未改动依赖锁文件或数据库迁移。
- **实际执行的命令或操作与结果**：
  - Node `v22.16.0` 隔离 SQLite 数据库（`0001`–`0007` 迁移通过）启动本地 `next dev`，在 `ego-browser` 任务空间 24 完成真实页面操作与截图核验（完成后已关闭任务空间并停止本地预览进程）：
    - 桌面 `1536×900` 中文深色/浅色、英文浅色下，展开态侧栏宽 `240px`（`aria-expanded="true"`，`收起侧边栏 / Collapse sidebar`），收起态侧栏宽 `64px`（`aria-expanded="false"`，`展开侧边栏 / Expand sidebar`，侧栏导航项带悬停 `title` 提示）；按钮与页面标题垂直中心同为 `29.6px`。
    - 展开态与收起态下点击侧栏中部空白区域，宽度保持 `240px` / `64px` 不变，`cursor` 为 `auto`。
    - 窄屏 `390×844`（桌面侧栏处于收起态时切换）自动隐藏桌面折叠按钮、显示汉堡菜单，打开 `280px` 抽屉仍完整显示 `TYPOS` 字标与全部导航文字。
  - `eslint`：通过。
  - `tsc --noEmit`：通过。
  - `vitest run`：17 个测试文件、51 项测试全部通过。
  - `next build`：生产编译、TypeScript 检查与页面生成全部通过（退出码 0）。
- **未执行项**：本地 Windows 未运行 Linux `npm run build:worker`，未提交 Git 或触发远端部署。
- **关键证据位置**：`.Typos-temp/sidebar-toggle/`（`metrics.json`、`zh-dark-expanded.png`、`zh-dark-collapsed.png`、`zh-light-collapsed.png`、`zh-light-expanded.png`、`en-light-expanded.png`、`en-light-collapsed.png`、`mobile-drawer-open.png`）。

## 接续

2026-11-28 用户在预览及本地 Codex 只读审查（会话 `code-20261128-185851-c36510`，`DELIVER_PASS` / 0 缺陷）后明确授权“提交 git 与 push，发布新版本”。按仓库 SemVer 约定升级应用版本为 `1.1.5`，同步 `package.json`、`package-lock.json` 与 `CHANGELOG.md`，在最终源码重新通过全量 ESLint、TypeScript、17 文件/51 项测试及生产 `next build` 后交付 `main` 分支与同名 annotated tag `v1.1.5`。后续任务见[活动计划](../../exec-plans/active/2026-11-13-project-hardening.md)。
