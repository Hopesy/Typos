import type { Database } from '@/lib/database';

export const HOME_TOOL_ICONS = [
  'file-text',
  'layers',
  'refresh',
  'video',
  'terminal',
  'code',
  'globe',
  'cpu',
  'box',
  'compass',
] as const;

export type HomeToolIconKey = (typeof HOME_TOOL_ICONS)[number];

export const HOME_BOOK_STATUSES = ['reading', 'finished'] as const;
export type HomeBookStatus = (typeof HOME_BOOK_STATUSES)[number];

export const HOME_STATUS_PRESETS = ['CODING', 'READING', 'WRITING', 'BUILDING', 'RESTING'] as const;

export type HomeStatusConfig = {
  text: string;
  location: string;
};

export type HomeToolItem = {
  id: string;
  name: string;
  descriptionZh: string;
  descriptionEn: string;
  link: string;
  icon: HomeToolIconKey;
  sortOrder: number;
  visible: boolean;
};

export type HomeBookItem = {
  id: string;
  title: string;
  author: string;
  cover: string;
  note: string;
  link: string;
  status: HomeBookStatus;
  sortOrder: number;
  visible: boolean;
};

export type HomeManageData = {
  status: HomeStatusConfig;
  tools: HomeToolItem[];
  books: HomeBookItem[];
};

export const DEFAULT_HOME_STATUS: HomeStatusConfig = {
  text: 'CODING',
  location: 'GUANG ZHOU',
};

export const DEFAULT_HOME_TOOLS: HomeToolItem[] = [
  {
    id: 'eidos',
    name: 'Eidos',
    descriptionZh: '生图工作台',
    descriptionEn: 'Image generation studio',
    link: 'https://github.com/Hopesy/Eidos',
    icon: 'file-text',
    sortOrder: 0,
    visible: true,
  },
  {
    id: 'revitclaw',
    name: 'RevitClaw',
    descriptionZh: 'Revit Agent 插件',
    descriptionEn: 'Revit agent plugin',
    link: 'https://github.com/Hopesy/RevitClaw',
    icon: 'layers',
    sortOrder: 1,
    visible: true,
  },
  {
    id: 'markdview',
    name: 'MarkdView',
    descriptionZh: 'MD 渲染器',
    descriptionEn: 'Markdown renderer',
    link: 'https://github.com/Hopesy/MarkdView',
    icon: 'refresh',
    sortOrder: 2,
    visible: true,
  },
  {
    id: 'minolink',
    name: 'MinoLink',
    descriptionZh: '飞书远控终端',
    descriptionEn: 'Feishu remote terminal',
    link: 'https://github.com/Hopesy/MinoLink',
    icon: 'video',
    sortOrder: 3,
    visible: true,
  },
];

export const DEFAULT_HOME_DATA: HomeManageData = {
  status: DEFAULT_HOME_STATUS,
  tools: DEFAULT_HOME_TOOLS,
  books: [],
};

export class HomeManageError extends Error {
  constructor(
    public readonly code:
      | 'HOME_SCHEMA_MISSING'
      | 'HOME_STATUS_INVALID'
      | 'HOME_TOOL_INVALID'
      | 'HOME_BOOK_INVALID'
      | 'HOME_URL_INVALID'
      | 'HOME_ID_REQUIRED',
    public readonly statusCode: number,
  ) {
    super(code);
    this.name = 'HomeManageError';
  }
}

const SETTING_STATUS_KEY = 'home_status_text';
const SETTING_LOCATION_KEY = 'home_location';

export function isHomeToolIcon(value: unknown): value is HomeToolIconKey {
  return typeof value === 'string' && (HOME_TOOL_ICONS as readonly string[]).includes(value);
}

export function isHomeBookStatus(value: unknown): value is HomeBookStatus {
  return typeof value === 'string' && (HOME_BOOK_STATUSES as readonly string[]).includes(value);
}

/** Allow only http(s) URLs or same-site root-relative paths. */
export function sanitizeHomeUrl(value: unknown, options: { allowEmpty?: boolean } = {}): string | null {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return options.allowEmpty ? '' : null;
  if (raw.length > 500 || /[\u0000-\u001f\u007f\\]/.test(raw)) return null;

  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      return parsed.hostname && !parsed.username && !parsed.password ? raw : null;
    } catch {
      return null;
    }
  }

  if (raw.startsWith('/') && !raw.startsWith('//')) {
    return raw;
  }

  return null;
}

function isMissingHomeTableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /no such table:\s*(site_settings|home_tools|home_books)/i.test(message);
}

function createHomeItemId(prefix: string): string {
  const suffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}_${suffix}`;
}

function normalizeText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function normalizeId(value: unknown): string {
  if (typeof value !== 'string') return '';
  const cleaned = value.trim();
  return /^[a-zA-Z0-9_-]{1,64}$/.test(cleaned) ? cleaned : '';
}

function toBoolean(value: unknown, fallback = true): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  return fallback;
}

function toSortOrder(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.min(9999, Math.trunc(value)));
  }
  return fallback;
}

type SettingRow = { key: string; value: string };
type ToolRow = {
  id: string;
  name: string;
  description_zh: string;
  description_en: string;
  link: string;
  icon: string;
  sort_order: number;
  visible: number;
};
type BookRow = {
  id: string;
  title: string;
  author: string;
  cover: string;
  note: string;
  link: string;
  status: string;
  sort_order: number;
  visible: number;
};

function mapToolRow(row: ToolRow): HomeToolItem {
  return {
    id: String(row.id),
    name: String(row.name),
    descriptionZh: String(row.description_zh ?? ''),
    descriptionEn: String(row.description_en ?? ''),
    link: String(row.link),
    icon: isHomeToolIcon(row.icon) ? row.icon : 'code',
    sortOrder: Number(row.sort_order ?? 0),
    visible: Number(row.visible ?? 1) !== 0,
  };
}

function mapBookRow(row: BookRow): HomeBookItem {
  return {
    id: String(row.id),
    title: String(row.title),
    author: String(row.author ?? ''),
    cover: String(row.cover ?? ''),
    note: String(row.note ?? ''),
    link: String(row.link ?? ''),
    status: isHomeBookStatus(row.status) ? row.status : 'finished',
    sortOrder: Number(row.sort_order ?? 0),
    visible: Number(row.visible ?? 1) !== 0,
  };
}

async function queryHomeData(db: Database, onlyVisible: boolean): Promise<HomeManageData> {
  const [settingsResult, toolsResult, booksResult] = await Promise.all([
    db
      .prepare('SELECT key, value FROM site_settings WHERE key IN (?, ?)')
      .bind(SETTING_STATUS_KEY, SETTING_LOCATION_KEY)
      .all<SettingRow>(),
    db
      .prepare(
        onlyVisible
          ? 'SELECT id, name, description_zh, description_en, link, icon, sort_order, visible FROM home_tools WHERE visible = 1 ORDER BY sort_order ASC, created_at ASC, id ASC'
          : 'SELECT id, name, description_zh, description_en, link, icon, sort_order, visible FROM home_tools ORDER BY sort_order ASC, created_at ASC, id ASC',
      )
      .all<ToolRow>(),
    db
      .prepare(
        onlyVisible
          ? 'SELECT id, title, author, cover, note, link, status, sort_order, visible FROM home_books WHERE visible = 1 ORDER BY sort_order ASC, created_at ASC, id ASC'
          : 'SELECT id, title, author, cover, note, link, status, sort_order, visible FROM home_books ORDER BY sort_order ASC, created_at ASC, id ASC',
      )
      .all<BookRow>(),
  ]);

  const settings = new Map(settingsResult.results.map((row) => [String(row.key), String(row.value)]));
  const statusText = normalizeText(settings.get(SETTING_STATUS_KEY), 32) || DEFAULT_HOME_STATUS.text;
  const location = normalizeText(settings.get(SETTING_LOCATION_KEY), 32) || DEFAULT_HOME_STATUS.location;

  return {
    status: { text: statusText, location },
    tools: toolsResult.results.map(mapToolRow),
    books: booksResult.results.map(mapBookRow),
  };
}

export async function getPublicHomeData(db: Database | null): Promise<HomeManageData> {
  if (!db) return DEFAULT_HOME_DATA;
  try {
    return await queryHomeData(db, true);
  } catch (error) {
    if (isMissingHomeTableError(error)) {
      return DEFAULT_HOME_DATA;
    }
    console.error('Failed to read public home data:', error);
    return DEFAULT_HOME_DATA;
  }
}

export async function getAdminHomeData(db: Database): Promise<HomeManageData> {
  try {
    return await queryHomeData(db, false);
  } catch (error) {
    if (isMissingHomeTableError(error)) {
      throw new HomeManageError('HOME_SCHEMA_MISSING', 503);
    }
    throw error;
  }
}

export async function saveHomeStatus(
  db: Database,
  input: { text?: unknown; location?: unknown },
): Promise<HomeStatusConfig> {
  const text = normalizeText(input.text, 32);
  const location = normalizeText(input.location, 32);
  if (!text || !location) {
    throw new HomeManageError('HOME_STATUS_INVALID', 400);
  }

  try {
    await db
      .prepare(
        `INSERT INTO site_settings (key, value, updated_at)
         VALUES (?, ?, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
      )
      .bind(SETTING_STATUS_KEY, text)
      .run();
    await db
      .prepare(
        `INSERT INTO site_settings (key, value, updated_at)
         VALUES (?, ?, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
      )
      .bind(SETTING_LOCATION_KEY, location)
      .run();
    return { text, location };
  } catch (error) {
    if (isMissingHomeTableError(error)) {
      throw new HomeManageError('HOME_SCHEMA_MISSING', 503);
    }
    throw error;
  }
}

export async function saveHomeTool(
  db: Database,
  input: {
    id?: unknown;
    name?: unknown;
    descriptionZh?: unknown;
    descriptionEn?: unknown;
    link?: unknown;
    icon?: unknown;
    sortOrder?: unknown;
    visible?: unknown;
  },
): Promise<HomeToolItem> {
  const name = normalizeText(input.name, 60);
  if (!name) {
    throw new HomeManageError('HOME_TOOL_INVALID', 400);
  }

  const link = sanitizeHomeUrl(input.link, { allowEmpty: false });
  if (!link) {
    throw new HomeManageError('HOME_URL_INVALID', 400);
  }

  const descriptionZh = normalizeText(input.descriptionZh, 160);
  const descriptionEn = normalizeText(input.descriptionEn, 160);
  const icon: HomeToolIconKey = isHomeToolIcon(input.icon) ? input.icon : 'code';
  const visible = toBoolean(input.visible, true);
  const providedId = normalizeId(input.id);

  try {
    let sortOrder = toSortOrder(input.sortOrder, -1);
    const id = providedId || createHomeItemId('tool');

    if (sortOrder < 0) {
      const existing = providedId
        ? await db.prepare('SELECT sort_order FROM home_tools WHERE id = ?').bind(providedId).first<{ sort_order: number }>()
        : null;
      if (existing) {
        sortOrder = Number(existing.sort_order ?? 0);
      } else {
        const maxRow = await db
          .prepare('SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM home_tools')
          .first<{ max_order: number }>();
        sortOrder = Number(maxRow?.max_order ?? -1) + 1;
      }
    }

    await db
      .prepare(
        `INSERT INTO home_tools (id, name, description_zh, description_en, link, icon, sort_order, visible, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           description_zh = excluded.description_zh,
           description_en = excluded.description_en,
           link = excluded.link,
           icon = excluded.icon,
           sort_order = excluded.sort_order,
           visible = excluded.visible,
           updated_at = datetime('now')`,
      )
      .bind(id, name, descriptionZh, descriptionEn, link, icon, sortOrder, visible ? 1 : 0)
      .run();

    return { id, name, descriptionZh, descriptionEn, link, icon, sortOrder, visible };
  } catch (error) {
    if (isMissingHomeTableError(error)) {
      throw new HomeManageError('HOME_SCHEMA_MISSING', 503);
    }
    throw error;
  }
}

export async function saveHomeBook(
  db: Database,
  input: {
    id?: unknown;
    title?: unknown;
    author?: unknown;
    cover?: unknown;
    note?: unknown;
    link?: unknown;
    status?: unknown;
    sortOrder?: unknown;
    visible?: unknown;
  },
): Promise<HomeBookItem> {
  const title = normalizeText(input.title, 100);
  if (!title) {
    throw new HomeManageError('HOME_BOOK_INVALID', 400);
  }

  const cover = sanitizeHomeUrl(input.cover, { allowEmpty: true });
  const link = sanitizeHomeUrl(input.link, { allowEmpty: true });
  if (cover === null || link === null) {
    throw new HomeManageError('HOME_URL_INVALID', 400);
  }

  const author = normalizeText(input.author, 80);
  const note = normalizeText(input.note, 240);
  const status: HomeBookStatus = isHomeBookStatus(input.status) ? input.status : 'finished';
  const visible = toBoolean(input.visible, true);
  const providedId = normalizeId(input.id);

  try {
    let sortOrder = toSortOrder(input.sortOrder, -1);
    const id = providedId || createHomeItemId('book');

    if (sortOrder < 0) {
      const existing = providedId
        ? await db.prepare('SELECT sort_order FROM home_books WHERE id = ?').bind(providedId).first<{ sort_order: number }>()
        : null;
      if (existing) {
        sortOrder = Number(existing.sort_order ?? 0);
      } else {
        const maxRow = await db
          .prepare('SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM home_books')
          .first<{ max_order: number }>();
        sortOrder = Number(maxRow?.max_order ?? -1) + 1;
      }
    }

    await db
      .prepare(
        `INSERT INTO home_books (id, title, author, cover, note, link, status, sort_order, visible, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           title = excluded.title,
           author = excluded.author,
           cover = excluded.cover,
           note = excluded.note,
           link = excluded.link,
           status = excluded.status,
           sort_order = excluded.sort_order,
           visible = excluded.visible,
           updated_at = datetime('now')`,
      )
      .bind(id, title, author, cover, note, link, status, sortOrder, visible ? 1 : 0)
      .run();

    return { id, title, author, cover, note, link, status, sortOrder, visible };
  } catch (error) {
    if (isMissingHomeTableError(error)) {
      throw new HomeManageError('HOME_SCHEMA_MISSING', 503);
    }
    throw error;
  }
}

export async function reorderHomeItems(
  db: Database,
  section: 'tool' | 'book',
  rawIds: unknown,
): Promise<void> {
  if (!Array.isArray(rawIds)) {
    throw new HomeManageError('HOME_ID_REQUIRED', 400);
  }
  const ids = rawIds.map(normalizeId).filter(Boolean);
  if (ids.length === 0) {
    throw new HomeManageError('HOME_ID_REQUIRED', 400);
  }

  const table = section === 'tool' ? 'home_tools' : 'home_books';
  try {
    for (let index = 0; index < ids.length; index += 1) {
      await db
        .prepare(`UPDATE ${table} SET sort_order = ?, updated_at = datetime('now') WHERE id = ?`)
        .bind(index, ids[index])
        .run();
    }
  } catch (error) {
    if (isMissingHomeTableError(error)) {
      throw new HomeManageError('HOME_SCHEMA_MISSING', 503);
    }
    throw error;
  }
}

export async function deleteHomeItem(
  db: Database,
  section: 'tool' | 'book',
  rawId: unknown,
): Promise<void> {
  const id = normalizeId(rawId);
  if (!id) {
    throw new HomeManageError('HOME_ID_REQUIRED', 400);
  }

  const table = section === 'tool' ? 'home_tools' : 'home_books';
  try {
    await db.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
  } catch (error) {
    if (isMissingHomeTableError(error)) {
      throw new HomeManageError('HOME_SCHEMA_MISSING', 503);
    }
    throw error;
  }
}
