'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FiKey, FiTrash2 } from 'react-icons/fi';

export type ApiToken = {
  id: string;
  name: string;
  tokenPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
};

export function TokensView({
  tokens,
  loading,
  dbUnavailable,
  deleteTokenId,
  onRequestDelete,
  onConfirmDelete,
}: {
  tokens: ApiToken[];
  loading: boolean;
  dbUnavailable: boolean;
  deleteTokenId: string | null;
  onRequestDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
}) {
  const tr = useTranslations('admin');
  const [nowMs] = useState(() => Date.now());
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-site.com';
  const endpoint = `${origin}/api/v1/posts`;
  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const timestamp = Date.parse(expiresAt.replace(' ', 'T') + 'Z');
    return !Number.isNaN(timestamp) && timestamp <= nowMs;
  };
  const curlExample = `curl -X POST ${endpoint} \\
  -H "Authorization: Bearer typos_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "My Post",
    "date": "2026-06-15",
    "category": ["随笔"],
    "content": "# Hello\\n\\nMarkdown body here."
  }'`;
  const markdownExample = `curl -X POST ${endpoint} \\
  -H "Authorization: Bearer typos_xxx" \\
  -H "Content-Type: text/markdown" \\
  --data-binary @post.md`;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {dbUnavailable ? (
        <div className="rounded-lg border border-dashed border-neutral-900 bg-neutral-900/20 py-12 text-center">
          <p className="font-mono text-xs tracking-wide text-neutral-600">{tr('tokens.needDb')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {loading ? (
            <div className="flex animate-pulse flex-col items-center gap-3 py-12">
              <div className="h-4 w-48 rounded bg-neutral-900" />
              <div className="h-3 w-32 rounded bg-neutral-900" />
            </div>
          ) : tokens.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-900 bg-neutral-900/20 py-12 text-center">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-600">{tr('tokens.empty')}</p>
            </div>
          ) : tokens.map((token) => {
            const expired = isExpired(token.expiresAt);
            return (
              <div key={token.id} className="group flex items-center justify-between rounded-xl border border-neutral-900 bg-neutral-950 p-5 shadow-sm transition-all hover:border-neutral-800">
                <div className="min-w-0 flex-1 pr-6">
                  <div className="mb-1.5 flex items-center gap-3">
                    <h3 className="truncate text-sm font-bold text-neutral-200">{token.name}</h3>
                    <span className="shrink-0 rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5 font-mono text-[10px] tracking-normal text-neutral-500">{token.tokenPrefix}…</span>
                    <span className={expired ? 'shrink-0 rounded border border-red-500/20 bg-red-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-normal text-red-400' : 'shrink-0 rounded border border-green-500/10 bg-green-500/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-normal text-green-500/70'}>
                      {expired ? tr('tokens.expired') : tr('tokens.active')}
                    </span>
                  </div>
                  <p className="space-x-3 font-mono text-xs text-neutral-500">
                    <span>{tr('tokens.created')}: {token.createdAt}</span>
                    <span>{tr('tokens.lastUsed')}: {token.lastUsedAt || tr('tokens.neverUsed')}</span>
                    <span>{tr('tokens.expires')}: {token.expiresAt || tr('tokens.neverExpires')}</span>
                  </p>
                </div>
                <div className="relative">
                  <button type="button" onClick={() => onRequestDelete(token.id)} className={`cursor-pointer rounded-md p-2 transition-all ${deleteTokenId === token.id ? 'bg-red-500/10 text-red-500' : 'text-neutral-600 opacity-0 hover:bg-red-950/30 hover:text-red-400 group-hover:opacity-100'}`} title={tr('tokens.delete')} aria-label={tr('tokens.delete')}>
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                  {deleteTokenId === token.id && (
                    <div className="absolute bottom-full right-0 z-10 mb-2 min-w-[160px] rounded-lg border border-neutral-800 bg-neutral-900 p-2 shadow-2xl">
                      <p className="mb-2 px-1 font-mono text-[10px] tracking-normal text-neutral-400">{tr('tokens.confirmDelete')}</p>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => onRequestDelete(token.id)} className="flex-1 rounded bg-neutral-800 py-1 font-mono text-[10px] uppercase text-neutral-400 transition-colors hover:bg-neutral-700">{tr('confirm.no')}</button>
                        <button type="button" onClick={() => onConfirmDelete(token.id)} className="flex-1 rounded border border-red-900/50 bg-red-900/40 py-1 font-mono text-[10px] uppercase text-red-200 transition-colors hover:bg-red-900/60">{tr('confirm.yes')}</button>
                      </div>
                      <div className="absolute right-3 top-full h-2 w-2 -translate-y-1 rotate-45 border-b border-r border-neutral-800 bg-neutral-900" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <section className="space-y-4 rounded-xl border border-neutral-900 bg-neutral-950 p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-200"><FiKey className="h-3.5 w-3.5 text-neutral-500" />{tr('tokens.docs.title')}</h2>
        <div className="space-y-1"><p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">{tr('tokens.docs.endpoint')}</p><code className="block break-all rounded bg-neutral-900 px-3 py-2 font-mono text-xs text-blue-400">POST {endpoint}</code></div>
        <div className="space-y-1"><p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">{tr('tokens.docs.jsonExample')}</p><pre className="overflow-x-auto whitespace-pre rounded bg-neutral-900 px-3 py-2 font-mono text-xs text-neutral-300">{curlExample}</pre></div>
        <div className="space-y-1"><p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">{tr('tokens.docs.markdownExample')}</p><pre className="overflow-x-auto whitespace-pre rounded bg-neutral-900 px-3 py-2 font-mono text-xs text-neutral-300">{markdownExample}</pre></div>
        <p className="font-mono text-[10px] leading-relaxed text-amber-500/70">⚠ {tr('tokens.docs.note')}</p>
      </section>
    </div>
  );
}
