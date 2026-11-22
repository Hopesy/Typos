# 2026-11-22 后台趋势图语言切换修复

## 用户诉求

用户先要求将「上传_MD」直接改为「上传」，随后报告仪表盘切换英文时趋势图样式发生变化。两项都按当前本地工作区修正，进度接续[活动计划](../../exec-plans/active/2026-11-13-project-hardening.md)。

## 复现与实现

- 上传按钮的中英文消息改为「上传 / Upload」，继续使用 `admin.action.uploadMd`；实际后台已切换两种语言核对按钮。
- 旧版将图表标题拼入渐变 ID：中文 `访客趋势图-area` 的引用有效，英文 `Visitor Trend-area`、`Page View Trend-area` 包含空格，使未加引号的 CSS `url(#...)` 失效。浏览器实测英文 `CSS.supports('fill', ...)` 为 false，实际填充回到 `rgb(0, 0, 0)`；中英曲线路径和图表尺寸相同。
- `TrendChart` 现用 React `useId` 生成各实例独立且稳定的渐变标识，标题继续用于展示及无障碍名称。沿用原数据、周期切换和绘图逻辑。
- 新增 `dashboard-view.test.tsx`：渲染中英文仪表盘，验证渐变引用有效、实例标识唯一，且路径相同。该回归在旧版以英文 ID 含空格失败，修复后通过。Vitest 发现规则同步覆盖 `.test.ts` 与 `.test.tsx`，组件测试使用 JSX。

## 实际验证

基线为 `9b0e714` 加已有导航/配色工作区；本次新增改动为 `dashboard-view.tsx`、其回归测试、Vitest 发现规则和两条上传标签文案。

- 桌面 1536×900：深色/浅色 × 7 天/30 天 × 中文/英文，两个图表的渐变 ID、引用、色阶、线条、面积路径、点数、宽高均保持一致，切换语言保留所选周期。
- 手机 390×844：中英图表属性一致；已滚动查看英文趋势图，蓝色渐变正常。桌面中英文、深浅主题的修复前后截图已查看。
- 后台文章页实际显示「上传 / Upload」。完成后恢复中文深色仪表盘，保留本地 3121 服务和用户原编辑页。
- 目标 ESLint 与全量 16 文件/50 项测试通过。测试最初使用 `createElement`，遇到 Provider 必需 `children` 类型和代码规范兼容问题；最终改为 JSX 组件测试，目标 ESLint、全量测试、独立 TypeScript 及生产 Next build 通过；`git diff --check` 通过。
- 本轮未执行独立 Worker 构建或远端部署。

证据位于 `.Typos-temp/dashboard-locale/`：`before.json` 记录旧版无效填充，`after.json` 记录修复后的矩阵和上传文案，`before-*.png`、`after-*.png` 为截图，`tests-final.log` 与 `build-final.log` 为最终检查记录。长期展示约定见[后台专题](../../design/editor.md)。

## v1.1.2 Git 交付

2026-11-22 用户明确要求提交全部改动并推送。本修复及上传文案与导航/浅色主题工作区统一纳入 `v1.1.2`，交付 `main` 和 annotated tag。版本号同步后，全量 ESLint、TypeScript、16 文件/50 项测试及生产 Next build 再次通过；发布日志及远端核验记录位于 `.Typos-temp/release-1.1.2/`。关联导航交付见[同批 history](20261122-navigation-layout-studies.md)。
