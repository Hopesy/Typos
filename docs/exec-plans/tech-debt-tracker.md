# 技术债追踪

已有功能改进项在[活动计划](active/2026-11-13-project-hardening.md)中维护，本文件只记录后续发现的目标外问题，不重复登记。

只新增当前目标外、已有明确证据的实现或维护缺陷；可选产品功能和待实测假设不放在这里。

| ID | 日期 | 证据与影响 | 后续动作 | 状态 / 计划 |
| --- | --- | --- | --- | --- |
| TD-001 | 2026-11-13 | Node 22/npm 10 执行 npm ci 成功，但审计汇总报告 35 项漏洞（4 low、18 moderate、11 high、2 critical）；尚未逐项确认生产影响，不能沿用 2026-08 的零漏洞结论 | 独立重新审计具体依赖链，区分开发/生产依赖和可达性，再制定受控升级与回归方案；不直接 audit fix --force | 待排期；来源见[按钮修复验证记录](../histories/2026-11/20261113-admin-action-alignment.md) |
| TD-002 | 2026-11-15 | 本地 next start 下，既有 OpenNext 上下文初始化提供 DB binding，getDatabase 优先使用本地 D1 而非显式隔离 DATABASE_URL；该 D1 缺 posts 表，公开内容读取失败。Next dev 的独立 libSQL 正常，未证实影响生产 Worker | 独立厘清 Next dev、Node 生产预览和 Worker 的数据库选择边界，增加对应运行测试；不通过放宽生产 DB 优先级或迁移未知数据库绕过 | 待排期；来源见[首页改造验证记录](../histories/2026-11/20261115-homepage-upgrade.md) |
