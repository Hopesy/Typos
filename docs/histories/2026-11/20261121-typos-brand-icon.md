# 2026-11-21 Typos 品牌图标初版

## 用户目标

用户查看 Astryx 字标并讨论图标化后明确“开始制作图标”。采用粗笔画圆角 T 方向，制作可使用的矢量及常用尺寸素材。

## 设计与交付

- T 的宽横画、厚竖画与圆角肩部保持简洁轮廓；右上浅切口提供辨识细节。
- 主图形独立绘制为单个闭合 SVG 路径，炭黑/暖白配色沿用 Typos 的中性色体系。
- 统一资源位于 `public/brand/typos/`，编辑源为 `typos-mark.svg`；反白、透明 PNG、应用图标、favicon 与 Apple touch icon 从该路径派生。
- 应用图标为 512px 深色圆角方形；小尺寸 favicon 适当放大内部图形，ICO 包含 16/32/48px。透明 SVG favicon 根据系统主题切换颜色。
- `preview.png` 提供深浅背景、16/24/32/48px 原尺寸及应用图标预览。素材制作与现有页面的引用分别记录，本轮交付资产包。

## 验证

- 基线：`fa3fae3`；应用源码与现有图标引用保持原状态。
- 已查看探索稿和最终 1440×960 展示板，核对轮廓、反白和原尺寸辨识度。
- Sharp 实际渲染：透明 PNG 1024px、应用图标 512px、Apple touch icon 180px、favicon 16/24/32/48px，尺寸与导出设置一致。
- 读取 ICO 目录并逐帧解码嵌入 PNG，核对 16/32/48px 与边界偏移；解析 SVG，核对 viewBox、路径和外部资源情况。
- 过程脚本、探索稿、导出检查放 `.Typos-temp/brand/`；最终资源与说明位于品牌目录。
- 本轮为静态素材制作，未新增依赖或应用功能测试；用户视觉复看后可继续调整或接入。

## 接续

### 按 sinos 素材格式整理

用户随后指定图片目录中的 `sinos` 为格式参考，要求整理同样一套以方便使用。已在图片目录的 `typos` 子目录导出完全对应的 10 个文件，并提供同级 `typos.zip`。

- `typos-icon`：1024×1024，圆角 240；`typos-wordmark`：1600×520，圆角 96，T 图形与 Typos 名称横向组合。
- 两组均包含 `.svg`、`.png`、`-dark.png`、`-rounded-white.png`、`-rounded-dark.png`；沿用参考的普通/rounded 文件别名规则。
- 配色按参考使用 `#FFFFFF` / `#050505`，圆角外保持透明；主图形复用现有 SVG 路径。
- 10 个文件名称、8 个 PNG 的尺寸与 alpha 通道逐项对照通过，浅深横版与方形合成预览已查看，ZIP 已核对 10 项素材。
- 过程脚本和检查记录保留在 `.Typos-temp/brand/`，参考目录仅供读取。

### 完整 TYPOS 定制字标

用户继续要求“完整的 Typos 按照截图的风格也做一套”。已将五个字母整体绘制为粗笔画圆角块面，使用紧凑字距形成完整 TYPOS 字标。

- T 沿用图标切口与轮廓；Y 调整宽肩和竖画比例；P/O 使用独立内部留白；S 使用连续弧线。五字母均为 SVG 路径，无字体依赖。
- 独立源文件为 `public/brand/typos/typos-lettering.svg`。单个字母可按 `glyph-t`、`glyph-y`、`glyph-p`、`glyph-o`、`glyph-s` 编辑。
- 图片目录的 `typos-wordmark` 套装提供：1600×520 圆角白底/深底横版、1600×360 黑/白透明底 SVG 和 PNG，以及预览、使用说明；同级 ZIP 便于取用。
- 已查看完整深浅预览与 24/32/48/64px 字高缩小稿；解析三份导出 SVG，确认每份包含五个路径且无文本节点、脚本或外部资源；PNG 尺寸和透明外角检查通过。
- 过程及检查保留在 `.Typos-temp/brand/lettering-*` 和 `export-lettering.mjs`。

### Zelos、SINOS、Edios 系列与风格修正

用户追加 Z/Zelos、S/SINOS、E/Edios 三套，随后两次明确修正风格：首先强调同字母内部的厚薄变化及主标缺口；其次指出第二稿整体歪斜，要求参考图的规整感。等粗圆角稿、轮廓扭动和倾斜内孔稿均 superseded；第三稿的 S 随后按下节用户反馈替换，其余字形沿用。

- 第三稿采用水平横画与垂直字干，L/I/N 的字干复正，O 内孔水平居中；Z/N 保留字母固有斜画，S 保留曲线与小幅光学高度调整。
- 厚薄变化放在 E 的上横/中横/下横、D 的左右笔画及 Z 的连接处。Z/S/E 主字母有局部内凹缺口，同组字标首字母使用同一主图形。
- 名称按用户本次拼写为 Zelos、SINOS、Edios，字标以 ZELOS、SINOS、EDIOS 呈现。
- 图片目录三个 `*-rounded` 文件夹各含 20 个文件：1024px 单字母图标、1600×520 圆角横版、1600×360 透明字标，配黑白 SVG/PNG、预览和说明。各自提供 ZIP，并汇总到 `rounded-brand-sets.zip`。
- 已验证单图标 SVG 为 1 个路径、完整字标为 5 个路径，ID 唯一且无字体/脚本/外部资源依赖；PNG 尺寸、alpha 和安全留白检查通过，单包 20 个文件、总包 61 个文件核对通过。
- 已查看深浅预览及 16/24/32/48px 图标、24/36px 字高效果。过程与第三稿源规则在 `.Typos-temp/brand/series-glyphs-v3.mjs`；前版备份在 `.Typos-temp/brand/superseded-series-v2/`。

修订稿与对应素材已交付，沿同一[活动计划](../../exec-plans/active/2026-11-13-project-hardening.md)接续用户视觉反馈。

### S 改用参考轮廓

用户明确要求“S 改成参照图里面的”。第四稿直接采用 [Astryx 参考网站](https://astryx.atmeta.com/) 字标中的 S 矢量轮廓，替代第三稿的自绘 S；替换时遗漏此前要求的主标缺口，已按下节修正。S 的来源为参考派生，其余系列字形沿用第三稿。

- 原轮廓边界约 143.1113×199.9999，统一等比缩放到字高 100，宽度约 71.5557，保留参考中的弧线、收口和厚薄变化。
- 同一 S 路径用于单独 S 图标、SINOS 两端以及 ZELOS、EDIOS 末尾；按新字宽重新居中排版。
- 三个 `*-rounded` 目录和压缩包均已更新，每套 20 文件，总包 61 文件；复制后文件哈希与导出暂存一致，Z/E 图标 PNG 与第三稿相同。
- 已查看三组总览、SINOS 深浅预览与 16/24/32/48px 图标、24/36px 字高效果；SVG 路径数量、PNG 尺寸及透明度检查通过。本次仅更新静态素材，未运行应用测试或构建。
- 来源轮廓、第四稿生成规则与验证记录位于 `.Typos-temp/brand/reference-s.json`、`series-glyphs-v4.mjs`、`series-export-checks-v4.json`、`series-delivery-checks-v4.json`。第三稿文件和 ZIP 备份在同目录 `superseded-series-v3/`；三套使用说明已注明参考来源。

### 补回 SINOS 首字母缺口

用户指出首字母缺口遗漏。参考 S 的轮廓与主标缺口是同时适用的约束，上一轮取消缺口的判断 rejected。

- 第五稿仅在参考 S 顶部外轮廓加入圆底 V 形缺口，保留其余弧线和比例。独立 S 图标与 SINOS 首字母使用同一带缺口路径，末尾 S 使用原参考路径。
- 白底、透明黑色和透明白色三类 SVG 均已核对：图标路径与首字母一致、首字母有缺口、末尾 S 与参考轮廓一致。ZELOS/EDIOS 的全部 SVG/PNG 与第四稿哈希一致。
- 已查看深浅预览及 16/24/32/48px 图标和 24/36px 字高效果；图像尺寸、透明度、文件复制哈希和压缩包数量检查通过。图片目录、三个单包及总包已同步，每套 20 文件、总包 61 项。
- 生成规则和检查记录为 `.Typos-temp/brand/series-glyphs-v5.mjs`、`series-export-checks-v5.json`、`series-delivery-checks-v5.json`；第四稿备份在 `superseded-series-v4/`。本次为静态素材修正，未运行应用测试或构建。

### Typos 网站接入新 T 图标

用户要求替换 Typos 图标以查看实际效果。本轮将已制作的缺口 T 接入本地应用，基线 `fa3fae3` 加本会话品牌素材工作区。

- `BrandMark` 共用组件引用 `typos-mark.svg`，导航、手机顶栏/菜单、相册头像、Dock 与后台侧栏复用同一来源；明暗主题统一适配，后台侧栏收起后继续显示 T。
- 根 layout metadata 改为品牌目录的 SVG/PNG 图标和 180px Apple touch icon；App Router 的 `favicon.ico` 及旧 public favicon 入口同步更新，兼容旧 URL 的消费者。
- 在既有 3121 服务上用 ego-browser 实际查看桌面 1536px 首页明暗主题、390px 手机首页及菜单、相册页、后台明暗主题。页面无横向溢出，侧栏从 240px 收起到 64px 时图标仍完整，随后恢复展开。
- 实际 `<head>` 包含新版 ICO、SVG、32px/512px PNG 和 180px Apple 图标，五个资源请求均返回 200。各页面可见主图标加载成功；当前页面未挂载的 Dock 由同一组件接入，本轮未独立挂载验收。
- Node 22 下全量 ESLint、TypeScript、15 文件/49 项测试、生产 Next build 和 `git diff --check` 通过。浏览器截图与过程脚本位于 `.Typos-temp/brand/app-*`，首页截图为 `app-home-dark.png` / `app-home-light.png`。
- 保留本地服务及用户原编辑页，额外保留空间 13 首页供复看。此次完成本地替换与验证，Git 提交和线上发布等待后续请求。

### 完整字标接入，首页标题保留文字

用户提出用完整 TYPOS 字标替换品牌文案，随后明确首页 `Typos Blog` 无需替换。该修正 accepted：首页标题继续使用原文字和 Shuffle 动画，标题图标化方案 rejected。

- `BrandWordmark` 与 `BrandMark` 在同一模块维护，直接引用既有 `typos-lettering.svg`；桌面后台入口、手机顶栏/菜单、相册品牌名、后台展开侧栏及页脚使用完整字标，侧栏收起时使用单 T。
- 首页 `hero-title.tsx` 与 `Shuffle.css` 已恢复至 Git 基线内容，浏览器实看确认 `h1` 为 `Typos Blog` 动画文字、标题内无图片，顶部导航保留完整字标。
- 字标接入后已查看桌面明暗、390px 手机、手机菜单、后台展开/收起、相册/页脚及 320px 窄屏，页面无横向溢出；图标与字标切换正常。
- 接入阶段全量 ESLint、TypeScript、49 项测试和生产 Next build 通过；用户收窄范围后重新执行目标 ESLint、TypeScript、差异检查及首页浏览器验证。测试和构建未在标题恢复后重复执行。
- 过程脚本和截图保存在 `.Typos-temp/brand/wordmark-*`，最终首页为 `wordmark-final-home.png`。本地 3121 服务及空间 13 首页继续供复看。

### v1.1.1 Git 交付

2026-11-22 用户明确“提交 git 并 push”，授权交付本轮品牌素材与接入。补丁版本记为 `v1.1.1`，package/lock 与 CHANGELOG 同步，`main` 分支与同名 annotated tag 作为交付入口。

- 提交前 fetch 确认本地与 `origin/main` 同基线；逐项核对应用、品牌资源、版本文件与文档，过程文件由 `.Typos-temp/` 忽略规则排除。
- 最终源码重新完成全量 ESLint、TypeScript、15 文件/49 项 Vitest 和生产 Next build；构建日志留在 `.Typos-temp/brand/release-build.log`。首页标题源码及样式与 Git 基线一致。
- 本次为品牌视觉更新，数据库迁移与依赖版本无变更。远端 CI（含 Linux Worker 构建）和自动部署的运行结果以该版本提交对应 GitHub Actions、生产版本及 `.Typos-temp/brand/release-remote-checks.json` 为准。
- 后续核验：`9b0e71429beba89ef06e208f722c6dc91bccfb12` 与标签 `v1.1.1` 已推送，[CI 44985700064](https://github.com/Hopesy/Typos/actions/runs/44985700064) 全步骤通过，含 Linux Worker 构建。生产首页 200、构建标识 `v1.1.1 (9b0e714)`、新版图标路径及字标文件哈希均核对通过。
