# 仓库协作约定

## 范围与目录

- 沿用 `src/`、`content/`、`migrations/`、`scripts/`、`public/`、`messages/` 及现有构建配置。
- `content/` 只作样例和导入素材，不是生产数据源。不要将数据库错误改成文件回退或空成功。
- 生产目标是 Workers + D1，binding 固定为 `DB`。本地/其他 Node 环境支持 libSQL/Turso；不引入 PostgreSQL 兼容承诺。
- 开始前查看 Git 状态；保留用户和其他执行者的改动。不主动提交、推送、部署或运行远端迁移。

## 开发与验证

- 使用 `package.json` 声明的 Node 22、npm 10，安装遵循锁文件，优先 `npm ci`。
- 常规质量门禁：`npm run lint`、`npx tsc --noEmit`、`npm test`、`npm run build`。
- Worker 构建在 Linux/CI 验证：`npm run build:worker`。Windows 的 OpenNext 符号链接问题不能冒充应用通过或应用失败。
- UI 变更除自动测试外还需真实浏览器操作，记录输入、预期、观察和对应版本。
- 数据迁移先在临时库验证；备份恢复、生产写入、真实通知等另需相应授权。测试数据不要混入线上站点。
- 缺陷修复优先补可暴露旧问题的回归测试。mock 不能代替需要真实数据库或 Workers runtime 的验证。
- 不为修复依赖公告直接使用 `npm audit fix --force`；核对兼容范围、锁文件与构建结果。

## 文档职责

- `AGENTS.md`：短导航；`docs/ARCHITECTURE.md`：结构事实；`docs/design/`：现行专题。
- 一份活动计划承载同一目标的 TODO、进度和接续摘要；用户修正、重要节点、阻塞及交付时更新。
- 同一任务使用一份 history，不另建逐轮运行日志、handoff 或迁移副本。
- 旧说明合并并核验消费者后删除；不保留仅跳转的旧入口或 archive/originals 目录。
- 已实现但未实测的能力标为“已实现，待验证”；历史验证不代表当前版本通过。

## 项目接续 hook

显式使用 `harness-run` 时，按其 `memory.md` 核对项目级 SessionStart 注册。Claude Code 使用 `.claude/settings.json`，只合并本 skill 的导航 hook，保留其他设置，不改权限或全局配置。

注册使用本机 Python 和 skill 绝对路径；更换机器、仓库位置或 skill 安装位置后应重新执行 installer 的检查/注册。不要复制别人的绝对路径。当前采用 AGENTS 动态导航，不把计划路径写死在 hook 中。

验收分三层记录：配置一致、事件脚本测试、宿主真实 SessionStart 触发。前两项通过不能代替第三项；可在宿主 `/hooks` 中审核或重新加载。
