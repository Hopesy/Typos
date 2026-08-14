'use client';

import type { LucideIcon } from 'lucide-react';

export type MdTool =
  | { Icon: LucideIcon; title: string; before: string; after?: string; placeholder?: string }
  | { divider: true };

export function MarkdownTools({
  tools,
  onInsert,
}: {
  tools: MdTool[];
  onInsert: (before: string, after?: string, placeholder?: string) => void;
}) {
  return tools.map((tool, index) => {
    if ('divider' in tool) {
      return <span key={`md-div-${index}`} className="mx-1 h-5 w-px bg-neutral-800/70" aria-hidden />;
    }

    const Icon = tool.Icon;
    return (
      <button
        key={tool.title}
        type="button"
        title={tool.title}
        aria-label={tool.title}
        onClick={() => onInsert(tool.before, tool.after, tool.placeholder)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </button>
    );
  });
}
