# 执行计划约定

- 活动计划：`exec-plans/active/YYYY-MM-DD-<slug>.md`；完成后进入 `exec-plans/completed/` 并修复导航。
- 模板：[execution-plan.md](exec-plans/templates/execution-plan.md)。索引：[当前计划](exec-plans/README.md)。
- 同一持续目标只维护一份计划，TODO 不再复制到根目录或额外交接文档。
- 顶部保留：目标、最新用户约束及来源、当前切片、基线/已验证范围、待验证项、下一动作和阻塞。
- 每项任务包含优先级、事实依据、具体动作、关联模块、前置依赖与可观察的验收条件。
- 状态使用：待排期、待实施、进行中、已实现待验证、已验证、阻塞、暂缓。复选框仅在相应交付条件达到后勾选。
- 区分已确认代码行为、待实测风险、建议方案与可选新功能；排优先级不构成实施授权。
- 重要决定使用 accepted/proposed/rejected/superseded；变更决定保留条件、原因和替代位置。
- 当前目标内未完成项留在活动计划。只有目标外已证实问题进入 [技术债追踪](exec-plans/tech-debt-tracker.md)。
- 证据记录命令/场景、实际结果、版本或工作区范围；不可把历史通过、未执行或阻塞写成当前通过。
