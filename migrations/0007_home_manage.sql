-- 首页配置（状态词/地点）、工具列表与阅读书架。
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO site_settings (key, value) VALUES
  ('home_status_text', 'CODING'),
  ('home_location', 'GUANG ZHOU');

CREATE TABLE IF NOT EXISTS home_tools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description_zh TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  link TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'code',
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_home_tools_order
ON home_tools(visible, sort_order ASC, created_at ASC);

INSERT OR IGNORE INTO home_tools (id, name, description_zh, description_en, link, icon, sort_order, visible) VALUES
  ('eidos', 'Eidos', '生图工作台', 'Image generation studio', 'https://github.com/Hopesy/Eidos', 'file-text', 0, 1),
  ('revitclaw', 'RevitClaw', 'Revit Agent 插件', 'Revit agent plugin', 'https://github.com/Hopesy/RevitClaw', 'layers', 1, 1),
  ('markdview', 'MarkdView', 'MD 渲染器', 'Markdown renderer', 'https://github.com/Hopesy/MarkdView', 'refresh', 2, 1),
  ('minolink', 'MinoLink', '飞书远控终端', 'Feishu remote terminal', 'https://github.com/Hopesy/MinoLink', 'video', 3, 1);

CREATE TABLE IF NOT EXISTS home_books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '',
  cover TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  link TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'finished',
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_home_books_order
ON home_books(visible, sort_order ASC, created_at ASC);
