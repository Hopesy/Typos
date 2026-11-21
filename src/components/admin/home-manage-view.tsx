'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  FiArrowDown,
  FiArrowUp,
  FiBookOpen,
  FiEdit3,
  FiEye,
  FiEyeOff,
  FiPlus,
  FiSave,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { HomeToolIcon } from '@/components/home-tool-icon';
import {
  DEFAULT_HOME_STATUS,
  HOME_STATUS_PRESETS,
  HOME_TOOL_ICONS,
  type HomeBookItem,
  type HomeBookStatus,
  type HomeManageData,
  type HomeToolIconKey,
  type HomeToolItem,
} from '@/lib/home-manage';

type HomeTab = 'status' | 'tools' | 'books';

type ToolDraft = {
  id?: string;
  name: string;
  descriptionZh: string;
  descriptionEn: string;
  link: string;
  icon: HomeToolIconKey;
  visible: boolean;
};

type BookDraft = {
  id?: string;
  title: string;
  author: string;
  cover: string;
  note: string;
  link: string;
  status: HomeBookStatus;
  visible: boolean;
};

const EMPTY_TOOL_DRAFT: ToolDraft = {
  name: '',
  descriptionZh: '',
  descriptionEn: '',
  link: '',
  icon: 'code',
  visible: true,
};

const EMPTY_BOOK_DRAFT: BookDraft = {
  title: '',
  author: '',
  cover: '',
  note: '',
  link: '',
  status: 'reading',
  visible: true,
};

const HOME_ERROR_KEY_MAP: Record<string, string> = {
  SESSION_EXPIRED: 'message.sessionExpired',
  DATABASE_UNAVAILABLE: 'message.databaseUnavailable',
  HOME_SCHEMA_MISSING: 'message.homeSchemaMissing',
  HOME_STATUS_INVALID: 'message.homeStatusInvalid',
  HOME_TOOL_INVALID: 'message.homeToolInvalid',
  HOME_BOOK_INVALID: 'message.homeBookInvalid',
  HOME_URL_INVALID: 'message.homeUrlInvalid',
  HOME_LOAD_FAILED: 'message.homeLoadFailed',
  HOME_SAVE_FAILED: 'message.homeSaveFailed',
  HOME_DELETE_FAILED: 'message.homeDeleteFailed',
};

async function readApiPayload(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function HomeManageView({
  onNotify,
  onSessionExpired,
}: {
  onNotify: (text: string, isError?: boolean) => void;
  onSessionExpired: () => void;
}) {
  const tr = useTranslations('admin');
  const [activeTab, setActiveTab] = useState<HomeTab>('status');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schemaMissing, setSchemaMissing] = useState(false);

  const [statusText, setStatusText] = useState(DEFAULT_HOME_STATUS.text);
  const [locationText, setLocationText] = useState(DEFAULT_HOME_STATUS.location);
  const [tools, setTools] = useState<HomeToolItem[]>([]);
  const [books, setBooks] = useState<HomeBookItem[]>([]);

  const [toolFormOpen, setToolFormOpen] = useState(false);
  const [toolDraft, setToolDraft] = useState<ToolDraft>(EMPTY_TOOL_DRAFT);
  const [deleteToolId, setDeleteToolId] = useState<string | null>(null);

  const [bookFormOpen, setBookFormOpen] = useState(false);
  const [bookDraft, setBookDraft] = useState<BookDraft>(EMPTY_BOOK_DRAFT);
  const [deleteBookId, setDeleteBookId] = useState<string | null>(null);

  const applyData = useCallback((data: HomeManageData) => {
    setStatusText(data.status.text);
    setLocationText(data.status.location);
    setTools(data.tools);
    setBooks(data.books);
  }, []);

  const messageForCode = useCallback(
    (code: unknown, fallbackKey: string) => {
      const key = typeof code === 'string' && HOME_ERROR_KEY_MAP[code] ? HOME_ERROR_KEY_MAP[code] : fallbackKey;
      return tr(key);
    },
    [tr],
  );

  useEffect(() => {
    let active = true;

    async function loadHomeData() {
      try {
        const res = await fetch('/api/admin/home', { credentials: 'same-origin' });
        if (!active) return;
        if (res.status === 401) {
          onSessionExpired();
          return;
        }
        const payload = await readApiPayload(res);
        if (!active) return;
        if (res.ok) {
          setSchemaMissing(false);
          applyData(payload as unknown as HomeManageData);
        } else if (payload.code === 'HOME_SCHEMA_MISSING') {
          setSchemaMissing(true);
        } else {
          onNotify(messageForCode(payload.code, 'message.homeLoadFailed'), true);
        }
      } catch {
        if (active) onNotify(tr('message.networkError'), true);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadHomeData();
    return () => {
      active = false;
    };
  }, [applyData, messageForCode, onNotify, onSessionExpired, tr]);

  async function mutateHome(
    method: 'PUT' | 'DELETE',
    body: Record<string, unknown>,
    successKey: string,
    fallbackErrorKey: string,
  ): Promise<boolean> {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/home', {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        onSessionExpired();
        return false;
      }
      const payload = await readApiPayload(res);
      if (res.ok) {
        applyData(payload as unknown as HomeManageData);
        onNotify(tr(successKey), false);
        return true;
      }
      if (payload.code === 'HOME_SCHEMA_MISSING') {
        setSchemaMissing(true);
      }
      onNotify(messageForCode(payload.code, fallbackErrorKey), true);
      return false;
    } catch {
      onNotify(tr('message.networkError'), true);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveStatus(event: React.FormEvent) {
    event.preventDefault();
    if (!statusText.trim() || !locationText.trim()) {
      onNotify(tr('message.homeStatusInvalid'), true);
      return;
    }
    await mutateHome(
      'PUT',
      { section: 'status', data: { text: statusText, location: locationText } },
      'message.homeStatusSaved',
      'message.homeSaveFailed',
    );
  }

  async function handleSaveTool(event: React.FormEvent) {
    event.preventDefault();
    if (!toolDraft.name.trim()) {
      onNotify(tr('message.homeToolInvalid'), true);
      return;
    }
    const ok = await mutateHome(
      'PUT',
      { section: 'tool', data: toolDraft },
      'message.homeToolSaved',
      'message.homeSaveFailed',
    );
    if (ok) {
      setToolFormOpen(false);
      setToolDraft(EMPTY_TOOL_DRAFT);
    }
  }

  async function handleToggleToolVisible(tool: HomeToolItem) {
    await mutateHome(
      'PUT',
      { section: 'tool', data: { ...tool, visible: !tool.visible } },
      'message.homeToolSaved',
      'message.homeSaveFailed',
    );
  }

  async function handleMoveTool(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= tools.length) return;
    const nextIds = tools.map((item) => item.id);
    [nextIds[index], nextIds[target]] = [nextIds[target], nextIds[index]];
    await mutateHome(
      'PUT',
      { section: 'reorder', target: 'tool', ids: nextIds },
      'message.homeOrderSaved',
      'message.homeSaveFailed',
    );
  }

  async function handleDeleteTool(id: string) {
    const ok = await mutateHome(
      'DELETE',
      { section: 'tool', id },
      'message.homeDeleted',
      'message.homeDeleteFailed',
    );
    if (ok) {
      setDeleteToolId(null);
      if (toolDraft.id === id) {
        setToolFormOpen(false);
        setToolDraft(EMPTY_TOOL_DRAFT);
      }
    }
  }

  async function handleSaveBook(event: React.FormEvent) {
    event.preventDefault();
    if (!bookDraft.title.trim()) {
      onNotify(tr('message.homeBookInvalid'), true);
      return;
    }
    const ok = await mutateHome(
      'PUT',
      { section: 'book', data: bookDraft },
      'message.homeBookSaved',
      'message.homeSaveFailed',
    );
    if (ok) {
      setBookFormOpen(false);
      setBookDraft(EMPTY_BOOK_DRAFT);
    }
  }

  async function handleToggleBookVisible(book: HomeBookItem) {
    await mutateHome(
      'PUT',
      { section: 'book', data: { ...book, visible: !book.visible } },
      'message.homeBookSaved',
      'message.homeSaveFailed',
    );
  }

  async function handleToggleBookStatus(book: HomeBookItem) {
    const nextStatus: HomeBookStatus = book.status === 'reading' ? 'finished' : 'reading';
    await mutateHome(
      'PUT',
      { section: 'book', data: { ...book, status: nextStatus } },
      'message.homeBookSaved',
      'message.homeSaveFailed',
    );
  }

  async function handleMoveBook(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= books.length) return;
    const nextIds = books.map((item) => item.id);
    [nextIds[index], nextIds[target]] = [nextIds[target], nextIds[index]];
    await mutateHome(
      'PUT',
      { section: 'reorder', target: 'book', ids: nextIds },
      'message.homeOrderSaved',
      'message.homeSaveFailed',
    );
  }

  async function handleDeleteBook(id: string) {
    const ok = await mutateHome(
      'DELETE',
      { section: 'book', id },
      'message.homeDeleted',
      'message.homeDeleteFailed',
    );
    if (ok) {
      setDeleteBookId(null);
      if (bookDraft.id === id) {
        setBookFormOpen(false);
        setBookDraft(EMPTY_BOOK_DRAFT);
      }
    }
  }

  if (loading) {
    return (
      <div className="flex animate-pulse flex-col items-center gap-3 py-16">
        <div className="h-4 w-48 rounded bg-neutral-900" />
        <div className="h-3 w-32 rounded bg-neutral-900" />
      </div>
    );
  }

  if (schemaMissing) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900/20 px-6 py-12 text-center">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-neutral-300">
          {tr('home.schemaMissingTitle')}
        </p>
        <p className="mx-auto mt-2 max-w-lg font-mono text-xs leading-relaxed text-neutral-500">
          {tr('home.schemaMissingHint')}
        </p>
      </div>
    );
  }

  const tabs: Array<{ id: HomeTab; label: string; count?: number }> = [
    { id: 'status', label: tr('home.tabs.status') },
    { id: 'tools', label: tr('home.tabs.tools'), count: tools.length },
    { id: 'books', label: tr('home.tabs.books'), count: books.length },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Sub-tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label={tr('title.home')}
          className="inline-flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900/50 p-1"
        >
          {tabs.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-3 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                  selected
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300'
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span className="text-[10px] opacity-65 tabular-nums">{tab.count}</span>
                )}
              </button>
            );
          })}
        </div>

        {activeTab === 'tools' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setToolDraft(EMPTY_TOOL_DRAFT);
              setToolFormOpen((open) => (toolDraft.id ? true : !open));
            }}
            className="h-8 cursor-pointer items-center gap-1.5 border-neutral-800 bg-neutral-900 px-3 font-mono text-[10px] uppercase leading-none tracking-[0.16em] text-neutral-300 hover:bg-neutral-800 hover:text-white"
          >
            <FiPlus className="h-3.5 w-3.5" />
            <span className="text-trim-caps">{tr('home.addTool')}</span>
          </Button>
        )}

        {activeTab === 'books' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setBookDraft(EMPTY_BOOK_DRAFT);
              setBookFormOpen((open) => (bookDraft.id ? true : !open));
            }}
            className="h-8 cursor-pointer items-center gap-1.5 border-neutral-800 bg-neutral-900 px-3 font-mono text-[10px] uppercase leading-none tracking-[0.16em] text-neutral-300 hover:bg-neutral-800 hover:text-white"
          >
            <FiPlus className="h-3.5 w-3.5" />
            <span className="text-trim-caps">{tr('home.addBook')}</span>
          </Button>
        )}
      </div>

      {/* Tab 1: Status Bar */}
      {activeTab === 'status' && (
        <form
          onSubmit={handleSaveStatus}
          className="space-y-6 rounded-xl border border-neutral-900 bg-neutral-950 p-6 shadow-sm"
        >
          <div className="space-y-2.5">
            <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              {tr('home.preview')}
            </span>
            <div className="flex justify-center rounded-lg border border-dashed border-neutral-800 bg-neutral-900/30 px-4 py-6">
              <div className="inline-flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5 rounded-md border border-hud-line bg-[#fffef9]/82 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-hud shadow-sm dark:bg-[#121212]/80">
                <div className="flex h-5 items-center gap-2">
                  <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-trim-caps text-hud-muted">STATUS:</span>
                    <span className="text-trim-caps font-medium text-hud-strong">
                      {statusText.trim() || DEFAULT_HOME_STATUS.text}
                    </span>
                  </span>
                </div>
                <span aria-hidden="true" className="h-3 w-px shrink-0 bg-hud-line" />
                <div className="flex h-5 items-center gap-1.5 text-hud">
                  <MapPin aria-hidden="true" className="h-3 w-3 shrink-0 text-hud-muted" strokeWidth={1.75} />
                  <span className="text-trim-caps">
                    {locationText.trim() || DEFAULT_HOME_STATUS.location}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="home-status-input" className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                {tr('home.statusLabel')}
              </Label>
              <Input
                id="home-status-input"
                value={statusText}
                maxLength={32}
                onChange={(event) => setStatusText(event.target.value)}
                placeholder={tr('home.statusPlaceholder')}
                className="h-9 border-neutral-800 bg-neutral-900/50 font-mono text-xs uppercase text-white focus:bg-neutral-900"
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="mr-1 font-mono text-[10px] text-neutral-500">{tr('home.presets')}:</span>
                {HOME_STATUS_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setStatusText(preset)}
                    className={`cursor-pointer rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
                      statusText.trim().toUpperCase() === preset
                        ? 'border-neutral-600 bg-neutral-800 text-white'
                        : 'border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="home-location-input" className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                {tr('home.locationLabel')}
              </Label>
              <Input
                id="home-location-input"
                value={locationText}
                maxLength={32}
                onChange={(event) => setLocationText(event.target.value)}
                placeholder={tr('home.locationPlaceholder')}
                className="h-9 border-neutral-800 bg-neutral-900/50 font-mono text-xs uppercase text-white focus:bg-neutral-900"
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-neutral-900 pt-4">
            <Button
              type="submit"
              disabled={saving}
              className="h-8 cursor-pointer items-center gap-1.5 bg-white px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-black hover:bg-neutral-200"
            >
              <FiSave className="h-3.5 w-3.5" />
              <span className="text-trim-caps">{saving ? tr('btn.saving') : tr('home.saveStatus')}</span>
            </Button>
          </div>
        </form>
      )}

      {/* Tab 2: Tools */}
      {activeTab === 'tools' && (
        <div className="space-y-4">
          {toolFormOpen && (
            <form
              onSubmit={handleSaveTool}
              className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/40 p-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-white">
                  {toolDraft.id ? tr('home.editTool') : tr('home.addTool')}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setToolFormOpen(false);
                    setToolDraft(EMPTY_TOOL_DRAFT);
                  }}
                  aria-label={tr('home.cancel')}
                  className="cursor-pointer rounded p-1 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-white"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="home-tool-name" className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                    {tr('home.toolName')}
                  </Label>
                  <Input
                    id="home-tool-name"
                    required
                    maxLength={60}
                    value={toolDraft.name}
                    onChange={(event) => setToolDraft((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder={tr('home.toolNamePlaceholder')}
                    className="h-9 border-neutral-800 bg-neutral-950 text-sm text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="home-tool-link" className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                    {tr('home.toolLink')}
                  </Label>
                  <Input
                    id="home-tool-link"
                    required
                    maxLength={500}
                    value={toolDraft.link}
                    onChange={(event) => setToolDraft((prev) => ({ ...prev, link: event.target.value }))}
                    placeholder={tr('home.toolLinkPlaceholder')}
                    className="h-9 border-neutral-800 bg-neutral-950 font-mono text-xs text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="home-tool-desc-zh" className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                    {tr('home.toolDescZh')}
                  </Label>
                  <Input
                    id="home-tool-desc-zh"
                    maxLength={160}
                    value={toolDraft.descriptionZh}
                    onChange={(event) => setToolDraft((prev) => ({ ...prev, descriptionZh: event.target.value }))}
                    placeholder={tr('home.toolDescZhPlaceholder')}
                    className="h-9 border-neutral-800 bg-neutral-950 text-sm text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="home-tool-desc-en" className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                    {tr('home.toolDescEn')}
                  </Label>
                  <Input
                    id="home-tool-desc-en"
                    maxLength={160}
                    value={toolDraft.descriptionEn}
                    onChange={(event) => setToolDraft((prev) => ({ ...prev, descriptionEn: event.target.value }))}
                    placeholder={tr('home.toolDescEnPlaceholder')}
                    className="h-9 border-neutral-800 bg-neutral-950 text-sm text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                  {tr('home.toolIcon')}
                </span>
                <div className="flex flex-wrap gap-2">
                  {HOME_TOOL_ICONS.map((iconKey) => {
                    const selected = toolDraft.icon === iconKey;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        title={iconKey}
                        aria-label={iconKey}
                        aria-pressed={selected}
                        onClick={() => setToolDraft((prev) => ({ ...prev, icon: iconKey }))}
                        className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border transition-colors ${
                          selected
                            ? 'border-neutral-500 bg-neutral-800 text-white'
                            : 'border-neutral-800 bg-neutral-950 text-neutral-500 hover:border-neutral-700 hover:text-neutral-200'
                        }`}
                      >
                        <HomeToolIcon name={iconKey} className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800/80 pt-4">
                <label className="inline-flex cursor-pointer items-center gap-2 font-mono text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={toolDraft.visible}
                    onChange={(event) => setToolDraft((prev) => ({ ...prev, visible: event.target.checked }))}
                    className="h-3.5 w-3.5 accent-white"
                  />
                  <span>{tr('home.visible')}</span>
                </label>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setToolFormOpen(false);
                      setToolDraft(EMPTY_TOOL_DRAFT);
                    }}
                    className="h-8 cursor-pointer border-neutral-800 bg-neutral-900 px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400 hover:bg-neutral-800 hover:text-white"
                  >
                    <span className="text-trim-caps">{tr('home.cancel')}</span>
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="h-8 cursor-pointer bg-white px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-black hover:bg-neutral-200"
                  >
                    <span className="text-trim-caps">{saving ? tr('btn.saving') : tr('home.save')}</span>
                  </Button>
                </div>
              </div>
            </form>
          )}

          {tools.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-900 bg-neutral-900/20 py-12 text-center">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-600">
                {tr('home.emptyTools')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {tools.map((tool, index) => (
                <div
                  key={tool.id}
                  className="group flex flex-col gap-3 rounded-xl border border-neutral-900 bg-neutral-950 p-4 shadow-sm transition-all hover:border-neutral-800 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300">
                      <HomeToolIcon name={tool.icon} className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-bold text-neutral-200">{tool.name}</h3>
                        {!tool.visible && (
                          <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] uppercase text-amber-400">
                            {tr('home.hidden')}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate font-mono text-xs text-neutral-400">
                        {tool.descriptionZh || tool.descriptionEn || '—'}
                        {tool.descriptionZh && tool.descriptionEn ? ` · ${tool.descriptionEn}` : ''}
                      </p>
                      <p className="mt-1 truncate font-mono text-[10px] text-neutral-600">{tool.link}</p>
                    </div>
                  </div>

                  <div className="relative flex shrink-0 items-center gap-1 self-end sm:self-center">
                    <button
                      type="button"
                      disabled={saving || index === 0}
                      onClick={() => void handleMoveTool(index, -1)}
                      title={tr('home.moveUp')}
                      aria-label={tr('home.moveUp')}
                      className="cursor-pointer rounded-md p-2 text-neutral-500 transition-colors hover:bg-neutral-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <FiArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={saving || index === tools.length - 1}
                      onClick={() => void handleMoveTool(index, 1)}
                      title={tr('home.moveDown')}
                      aria-label={tr('home.moveDown')}
                      className="cursor-pointer rounded-md p-2 text-neutral-500 transition-colors hover:bg-neutral-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <FiArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleToggleToolVisible(tool)}
                      title={tool.visible ? tr('home.hide') : tr('home.show')}
                      aria-label={tool.visible ? tr('home.hide') : tr('home.show')}
                      className="cursor-pointer rounded-md p-2 text-neutral-500 transition-colors hover:bg-neutral-900 hover:text-white disabled:opacity-30"
                    >
                      {tool.visible ? <FiEye className="h-3.5 w-3.5" /> : <FiEyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setToolDraft({
                          id: tool.id,
                          name: tool.name,
                          descriptionZh: tool.descriptionZh,
                          descriptionEn: tool.descriptionEn,
                          link: tool.link,
                          icon: tool.icon,
                          visible: tool.visible,
                        });
                        setToolFormOpen(true);
                      }}
                      title={tr('home.edit')}
                      aria-label={tr('home.edit')}
                      className="cursor-pointer rounded-md p-2 text-neutral-500 transition-colors hover:bg-neutral-900 hover:text-white"
                    >
                      <FiEdit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteToolId(deleteToolId === tool.id ? null : tool.id)}
                      title={tr('list.delete')}
                      aria-label={tr('list.delete')}
                      className={`cursor-pointer rounded-md p-2 transition-colors ${
                        deleteToolId === tool.id
                          ? 'bg-red-500/10 text-red-500'
                          : 'text-neutral-500 hover:bg-red-950/30 hover:text-red-400'
                      }`}
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                    </button>
                    {deleteToolId === tool.id && (
                      <div className="absolute bottom-full right-0 z-20 mb-2 min-w-[160px] rounded-lg border border-neutral-800 bg-neutral-900 p-2 shadow-2xl">
                        <p className="mb-2 px-1 font-mono text-[10px] text-neutral-400">
                          {tr('home.confirmDelete')}
                        </p>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setDeleteToolId(null)}
                            className="flex-1 cursor-pointer rounded bg-neutral-800 py-1 font-mono text-[10px] uppercase text-neutral-400 hover:bg-neutral-700"
                          >
                            {tr('confirm.no')}
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => void handleDeleteTool(tool.id)}
                            className="flex-1 cursor-pointer rounded border border-red-900/50 bg-red-900/40 py-1 font-mono text-[10px] uppercase text-red-200 hover:bg-red-900/60"
                          >
                            {tr('confirm.yes')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Reading / Bookshelf */}
      {activeTab === 'books' && (
        <div className="space-y-4">
          {bookFormOpen && (
            <form
              onSubmit={handleSaveBook}
              className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/40 p-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-white">
                  {bookDraft.id ? tr('home.editBook') : tr('home.addBook')}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setBookFormOpen(false);
                    setBookDraft(EMPTY_BOOK_DRAFT);
                  }}
                  aria-label={tr('home.cancel')}
                  className="cursor-pointer rounded p-1 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-white"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_132px]">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="home-book-title" className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                        {tr('home.bookTitle')}
                      </Label>
                      <Input
                        id="home-book-title"
                        required
                        maxLength={100}
                        value={bookDraft.title}
                        onChange={(event) => setBookDraft((prev) => ({ ...prev, title: event.target.value }))}
                        placeholder={tr('home.bookTitlePlaceholder')}
                        className="h-9 border-neutral-800 bg-neutral-950 text-sm text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="home-book-author" className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                        {tr('home.bookAuthor')}
                      </Label>
                      <Input
                        id="home-book-author"
                        maxLength={80}
                        value={bookDraft.author}
                        onChange={(event) => setBookDraft((prev) => ({ ...prev, author: event.target.value }))}
                        placeholder={tr('home.bookAuthorPlaceholder')}
                        className="h-9 border-neutral-800 bg-neutral-950 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="home-book-cover" className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                        {tr('home.bookCover')}
                      </Label>
                      <Input
                        id="home-book-cover"
                        maxLength={500}
                        value={bookDraft.cover}
                        onChange={(event) => setBookDraft((prev) => ({ ...prev, cover: event.target.value }))}
                        placeholder={tr('home.bookCoverPlaceholder')}
                        className="h-9 border-neutral-800 bg-neutral-950 font-mono text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="home-book-link" className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                        {tr('home.bookLink')}
                      </Label>
                      <Input
                        id="home-book-link"
                        maxLength={500}
                        value={bookDraft.link}
                        onChange={(event) => setBookDraft((prev) => ({ ...prev, link: event.target.value }))}
                        placeholder={tr('home.bookLinkPlaceholder')}
                        className="h-9 border-neutral-800 bg-neutral-950 font-mono text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="home-book-note" className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                      {tr('home.bookNote')}
                    </Label>
                    <Textarea
                      id="home-book-note"
                      rows={2}
                      maxLength={240}
                      value={bookDraft.note}
                      onChange={(event) => setBookDraft((prev) => ({ ...prev, note: event.target.value }))}
                      placeholder={tr('home.bookNotePlaceholder')}
                      className="resize-none border-neutral-800 bg-neutral-950 font-mono text-xs text-white"
                    />
                  </div>
                </div>

                {/* Live 3:4 Cover Preview */}
                <div className="hidden md:flex md:flex-col md:items-center md:gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    {tr('home.preview')}
                  </span>
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-sm border border-neutral-800 bg-neutral-950">
                    {bookDraft.cover.trim() && (/^https?:\/\//i.test(bookDraft.cover.trim()) || bookDraft.cover.trim().startsWith('/')) ? (
                      <Image
                        src={bookDraft.cover.trim()}
                        alt={bookDraft.title || 'Cover preview'}
                        width={240}
                        height={320}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col justify-between p-3 font-mono text-neutral-400">
                        <FiBookOpen className="h-3.5 w-3.5 text-neutral-600" />
                        <div className="space-y-1">
                          <p className="line-clamp-3 text-[11px] font-semibold leading-snug text-neutral-200">
                            {bookDraft.title.trim() || tr('home.bookTitle')}
                          </p>
                          {bookDraft.author.trim() && (
                            <p className="truncate text-[10px] text-neutral-500">{bookDraft.author.trim()}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800/80 pt-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="inline-flex items-center gap-1 rounded-md border border-neutral-800 bg-neutral-950 p-0.5">
                    {(['reading', 'finished'] as const).map((statusValue) => (
                      <button
                        key={statusValue}
                        type="button"
                        onClick={() => setBookDraft((prev) => ({ ...prev, status: statusValue }))}
                        className={`cursor-pointer rounded px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
                          bookDraft.status === statusValue
                            ? 'bg-neutral-800 text-white'
                            : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                      >
                        {statusValue === 'reading' ? tr('home.statusReading') : tr('home.statusFinished')}
                      </button>
                    ))}
                  </div>

                  <label className="inline-flex cursor-pointer items-center gap-2 font-mono text-xs text-neutral-300">
                    <input
                      type="checkbox"
                      checked={bookDraft.visible}
                      onChange={(event) => setBookDraft((prev) => ({ ...prev, visible: event.target.checked }))}
                      className="h-3.5 w-3.5 accent-white"
                    />
                    <span>{tr('home.visible')}</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBookFormOpen(false);
                      setBookDraft(EMPTY_BOOK_DRAFT);
                    }}
                    className="h-8 cursor-pointer border-neutral-800 bg-neutral-900 px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400 hover:bg-neutral-800 hover:text-white"
                  >
                    <span className="text-trim-caps">{tr('home.cancel')}</span>
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="h-8 cursor-pointer bg-white px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-black hover:bg-neutral-200"
                  >
                    <span className="text-trim-caps">{saving ? tr('btn.saving') : tr('home.save')}</span>
                  </Button>
                </div>
              </div>
            </form>
          )}

          {books.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-900 bg-neutral-900/20 py-12 text-center">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-neutral-600">
                {tr('home.emptyBooks')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {books.map((book, index) => (
                <div
                  key={book.id}
                  className="group flex flex-col gap-3 rounded-xl border border-neutral-900 bg-neutral-950 p-4 shadow-sm transition-all hover:border-neutral-800 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3.5">
                    <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-sm border border-neutral-800 bg-neutral-900">
                      {book.cover ? (
                        <Image
                          src={book.cover}
                          alt={book.title}
                          width={88}
                          height={112}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-neutral-600">
                          <FiBookOpen className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-bold text-neutral-200">{book.title}</h3>
                        {book.author && (
                          <span className="truncate font-mono text-xs text-neutral-500">· {book.author}</span>
                        )}
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void handleToggleBookStatus(book)}
                          className={`cursor-pointer rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase transition-colors ${
                            book.status === 'reading'
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:border-emerald-500/50'
                              : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700 hover:text-white'
                          }`}
                        >
                          {book.status === 'reading' ? tr('home.statusReading') : tr('home.statusFinished')}
                        </button>
                        {!book.visible && (
                          <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] uppercase text-amber-400">
                            {tr('home.hidden')}
                          </span>
                        )}
                      </div>
                      {book.note && (
                        <p className="mt-1 line-clamp-1 font-mono text-xs text-neutral-400">{book.note}</p>
                      )}
                      {book.link && (
                        <p className="mt-0.5 truncate font-mono text-[10px] text-neutral-600">{book.link}</p>
                      )}
                    </div>
                  </div>

                  <div className="relative flex shrink-0 items-center gap-1 self-end sm:self-center">
                    <button
                      type="button"
                      disabled={saving || index === 0}
                      onClick={() => void handleMoveBook(index, -1)}
                      title={tr('home.moveUp')}
                      aria-label={tr('home.moveUp')}
                      className="cursor-pointer rounded-md p-2 text-neutral-500 transition-colors hover:bg-neutral-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <FiArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={saving || index === books.length - 1}
                      onClick={() => void handleMoveBook(index, 1)}
                      title={tr('home.moveDown')}
                      aria-label={tr('home.moveDown')}
                      className="cursor-pointer rounded-md p-2 text-neutral-500 transition-colors hover:bg-neutral-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <FiArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleToggleBookVisible(book)}
                      title={book.visible ? tr('home.hide') : tr('home.show')}
                      aria-label={book.visible ? tr('home.hide') : tr('home.show')}
                      className="cursor-pointer rounded-md p-2 text-neutral-500 transition-colors hover:bg-neutral-900 hover:text-white disabled:opacity-30"
                    >
                      {book.visible ? <FiEye className="h-3.5 w-3.5" /> : <FiEyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBookDraft({
                          id: book.id,
                          title: book.title,
                          author: book.author,
                          cover: book.cover,
                          note: book.note,
                          link: book.link,
                          status: book.status,
                          visible: book.visible,
                        });
                        setBookFormOpen(true);
                      }}
                      title={tr('home.edit')}
                      aria-label={tr('home.edit')}
                      className="cursor-pointer rounded-md p-2 text-neutral-500 transition-colors hover:bg-neutral-900 hover:text-white"
                    >
                      <FiEdit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteBookId(deleteBookId === book.id ? null : book.id)}
                      title={tr('list.delete')}
                      aria-label={tr('list.delete')}
                      className={`cursor-pointer rounded-md p-2 transition-colors ${
                        deleteBookId === book.id
                          ? 'bg-red-500/10 text-red-500'
                          : 'text-neutral-500 hover:bg-red-950/30 hover:text-red-400'
                      }`}
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                    </button>
                    {deleteBookId === book.id && (
                      <div className="absolute bottom-full right-0 z-20 mb-2 min-w-[160px] rounded-lg border border-neutral-800 bg-neutral-900 p-2 shadow-2xl">
                        <p className="mb-2 px-1 font-mono text-[10px] text-neutral-400">
                          {tr('home.confirmDelete')}
                        </p>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setDeleteBookId(null)}
                            className="flex-1 cursor-pointer rounded bg-neutral-800 py-1 font-mono text-[10px] uppercase text-neutral-400 hover:bg-neutral-700"
                          >
                            {tr('confirm.no')}
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => void handleDeleteBook(book.id)}
                            className="flex-1 cursor-pointer rounded border border-red-900/50 bg-red-900/40 py-1 font-mono text-[10px] uppercase text-red-200 hover:bg-red-900/60"
                          >
                            {tr('confirm.yes')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
