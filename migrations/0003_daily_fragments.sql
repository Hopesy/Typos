-- 日常功能从「按天合并」改造为「碎片化知识点」：每条碎片独立成行（独立 filename + created_at），
-- 不再把同一天的内容用 '---' 合并到一行。daily 表已含 title/content/image_url/created_at 列，
-- 无需改结构；此处仅清空旧的按天合并数据（已与作者确认可清空，不做拆分迁移）。
DELETE FROM daily;
