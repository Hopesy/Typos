# 2026-11-13 项目接入与详细 TODO

## 用户目标与范围

用户要求先分析项目、编写详细待办，随后明确先使用 harness-run 规范目录。本次只整合文档、接续入口及详细计划，不实施产品功能，不提交、推送或部署。

## 变更与理由

- 新增 AGENTS 和标准架构、协作/计划/历史指南及模板。
- 现行说明收敛为数据库、部署、API、渲染、编辑器五个 design 专题；按源码纠正旧草案里的迁移名称、函数名、错误码保证和“永远命中缓存”等过强陈述。
- 原修复时间线完整迁入历史目录，保留日期策略更正、旧测试结果、Windows Worker 打包限制及低流量条件下暂缓缓存改造的决定。
- 更新 README 导航、两处源码注释的文档路径，核验新位置后删除重复旧文档及空目录。不移动 src、migrations、public 或构建配置。
- [主计划](../../exec-plans/active/2026-11-13-project-hardening.md)包含 21 个详细任务（T00–T20）、8 组可选需求（F01–F08）及 hook 接入项 H01；每个主要任务包含优先级、状态、依据、文件、依赖、动作与验收。
- 文档交付后，用户明确授权安装项目级 SessionStart hook；仅注册本项目导航，不改权限、全局配置或其他 hook。
- 忽略本机协作状态和临时测试产物，不忽略应受版本控制的项目 settings.json。

## 验证与限制

被测范围：基线 `5641cc4707394dfd7ba4e073f32e6acc8f69b947` 加本轮未提交的文档/忽略规则/注释引用变更，以及用户后续明确授权的项目 SessionStart 配置。

| 检查 | 结果 |
| --- | --- |
| 接入前 Git 状态与运行版本 | 工作区干净；本机 Node 24.19.0、npm 11.17.0；Python 3.14.7 |
| 初步文档契约检查 | 16 份现行文档、47 个本地文件链接通过；当时允许尚未写入的主计划目标 |
| 历史正文保留 | 逐行比对基线历史，除新增前言和一处入口措辞外均保留 |
| 最终文档检查 | 初次 `node tmp/verify-docs.cjs --final` 通过；授权安装后增加 `--hook-installed` 复检通过：18 份现行文档、59 个本地文件链接、21 个唯一任务 ID、历史保留、变更范围和配置作用域均通过 |
| 引用与空白 | 全仓有效文件搜索无旧文档路径引用；`git diff --check` 通过 |
| 接续检索入口 | `memory.py recall` 能发现主计划、API、架构，无 warnings；不是 hook 触发证明 |
| 应用 lint / 类型 / Vitest / build | 未运行，无依赖且 Node/npm 不在项目声明范围，本轮无业务逻辑改动 |
| Linux Worker / 浏览器 / 生产 | 未运行、未访问；既有历史结果不当作本轮通过 |

本地文档校验使用临时 `tmp/verify-docs.cjs`（不进入 Git），检查链接目标、旧入口清理、任务字段与编号、历史正文保留和仅两处源码注释变更。初次交付要求无 hook 配置；用户授权安装后，通过 `--hook-installed` 核验配置只含获准的 SessionStart。这只验证本地契约，不验证外部网站或应用行为。

## hook 授权、安装与验证

初次安装因缺少明确持久化授权被权限机制拒绝，当时没有创建配置，也未换工具绕过。随后用户明确授权安装项目级 SessionStart hook，使用 harness-run installer 正常创建 `.claude/settings.json`，未修改全局设置、权限或其他 hook。

- 注册：`updated`，`session_scope=inside-project`，无 warnings。
- 幂等/路径核对：installer `--check` 返回 `unchanged`、`inside-project`，无 warnings。
- 配置：仅包含一个 SessionStart command handler，匹配 startup/resume/clear/compact/fork；直接 command/args 调用本机 Python 和 skill 脚本，动态导航到 AGENTS，不固定计划路径。
- `node tmp/verify-sessionstart.cjs`：配置作用域与 9 个事件场景全部通过。首次 startup 注入、相同 startup 去重、四种恢复事件重发、项目子目录导航、项目外忽略均符合预期，stderr 为空；缺 cwd 事件按预期退出 1 并输出 hook-project-required。
- 宿主真实 SessionStart：本轮未实际观察，不能以 stdin 测试代替；用户可通过 `/hooks` 审核/加载，并在下次项目会话检查导航注入。

安装交付时状态为配置已安装、脚本测试通过、宿主触发待观察。2026-11-13 恢复按钮修复会话时，实际收到宿主 SessionStart 注入的 harness-run 导航上下文，H01 的真实触发验收现已完成；该结论不是由脚本模拟结果推断。

## 接续

本次交付不自动启动后续开发。用户后续要求实现时，先读[主计划接续摘要](../../exec-plans/active/2026-11-13-project-hardening.md)，从 T00 建立真实基线，再按数据可靠性优先顺序推进。

现行目录与专题入口见 [ARCHITECTURE](../../ARCHITECTURE.md)，协作约束见 [REPO_COLLAB_GUIDE](../../REPO_COLLAB_GUIDE.md)。
