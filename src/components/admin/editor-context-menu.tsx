'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Bold, CheckSquare, ChevronRight, Clipboard, Code, Copy, Italic,
  Link2, List, ListOrdered, Quote, Scissors, Trash2, type LucideIcon,
} from 'lucide-react';

export type EditorContextMenuState = {
  x: number;
  y: number;
  selectionStart: number;
  selectionEnd: number;
};

export type EditorContextAction =
  | 'cut' | 'copy' | 'paste' | 'delete' | 'copyPlainText' | 'pasteQuote'
  | 'bold' | 'italic' | 'inlineCode' | 'link'
  | 'quote' | 'orderedList' | 'bulletList' | 'taskList';

type MenuProps = {
  menu: EditorContextMenuState | null;
  onAction: (action: EditorContextAction, selectionStart: number, selectionEnd: number) => void;
  onClose: () => void;
};
type IconItem = { action: EditorContextAction; Icon: LucideIcon; label: string; disabled?: boolean };

export function EditorContextMenu(props: MenuProps) {
  return props.menu ? <OpenEditorContextMenu {...props} menu={props.menu} /> : null;
}

function OpenEditorContextMenu({ menu, onAction, onClose }: MenuProps & { menu: EditorContextMenuState }) {
  const tr = useTranslations('admin.editorMenu');
  const menuRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const submenuTriggerRef = useRef<HTMLButtonElement>(null);
  const [submenuOpen, setSubmenuOpen] = useState(false);

  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const margin = 8;
    const left = Math.min(Math.max(margin, menu.x), Math.max(margin, window.innerWidth - rect.width - margin));
    const top = Math.min(Math.max(margin, menu.y), Math.max(margin, window.innerHeight - rect.height - margin));
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    if (submenuRef.current) {
      const opensLeft = left + rect.width + 184 > window.innerWidth;
      submenuRef.current.style.setProperty('--submenu-left', opensLeft ? 'auto' : '100%');
      submenuRef.current.style.setProperty('--submenu-right', opensLeft ? '100%' : 'auto');
    }
  }, [menu, submenuOpen]);

  useEffect(() => {
    const editor = document.activeElement as HTMLElement | null;
    menuRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({ preventScroll: true });
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        editor?.focus({ preventScroll: true });
      }
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('resize', onClose);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  const hasSelection = menu.selectionEnd > menu.selectionStart;
  const trigger = (action: EditorContextAction) => {
    onClose();
    onAction(action, menu.selectionStart, menu.selectionEnd);
  };
  const keepFocus = (event: React.MouseEvent) => event.preventDefault();
  const editRow: IconItem[] = [
    { action: 'cut', Icon: Scissors, label: tr('cut'), disabled: !hasSelection },
    { action: 'copy', Icon: Copy, label: tr('copy'), disabled: !hasSelection },
    { action: 'paste', Icon: Clipboard, label: tr('paste') },
    { action: 'delete', Icon: Trash2, label: tr('delete'), disabled: !hasSelection },
  ];
  const formatRows: IconItem[] = [
    { action: 'bold', Icon: Bold, label: `${tr('bold')} (Ctrl/Cmd+B)` },
    { action: 'italic', Icon: Italic, label: `${tr('italic')} (Ctrl/Cmd+I)` },
    { action: 'inlineCode', Icon: Code, label: `${tr('inlineCode')} (Ctrl/Cmd+E)` },
    { action: 'link', Icon: Link2, label: `${tr('link')} (Ctrl/Cmd+K)` },
    { action: 'quote', Icon: Quote, label: tr('quote') },
    { action: 'orderedList', Icon: ListOrdered, label: tr('orderedList') },
    { action: 'bulletList', Icon: List, label: tr('bulletList') },
    { action: 'taskList', Icon: CheckSquare, label: tr('taskList') },
  ];
  const buttonClass = 'cursor-pointer rounded border border-[var(--admin-line-soft)] bg-[var(--admin-panel-soft)] text-[var(--admin-text)] transition-colors hover:bg-[var(--admin-panel-strong)] hover:text-[var(--admin-strong)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--admin-muted)] disabled:cursor-default disabled:opacity-30';
  const renderIcon = ({ action, Icon, label, disabled }: IconItem) => (
    <button key={action} type="button" role="menuitem" title={label} aria-label={label}
      disabled={disabled} onMouseDown={keepFocus} onClick={() => trigger(action)}
      className={`inline-flex h-7 items-center justify-center ${buttonClass}`}>
      <Icon className="h-4 w-4" strokeWidth={1.8} />
    </button>
  );

  return (
    <div ref={menuRef} role="menu" aria-label={tr('menuLabel')}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft' && submenuOpen) {
          event.preventDefault();
          setSubmenuOpen(false);
          submenuTriggerRef.current?.focus();
          return;
        }
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const buttons = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
          : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
        buttons[next]?.focus();
      }}
      style={{ left: menu.x, top: menu.y }}
      className="fixed z-[120] w-[248px] select-none rounded-lg border border-[var(--admin-line)] bg-[var(--admin-panel)] p-1.5 shadow-xl">
      <div className="grid grid-cols-4 gap-1">{editRow.map(renderIcon)}</div>
      <div className="relative mt-1" onMouseEnter={() => setSubmenuOpen(true)} onMouseLeave={() => setSubmenuOpen(false)}>
        <button ref={submenuTriggerRef} type="button" role="menuitem" aria-haspopup="menu" aria-expanded={submenuOpen}
          onMouseDown={keepFocus} onClick={() => setSubmenuOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') {
              event.preventDefault();
              setSubmenuOpen(true);
              requestAnimationFrame(() => submenuRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus());
            }
          }}
          className="flex h-8 w-full cursor-pointer items-center justify-between rounded px-2 text-xs text-[var(--admin-text)] hover:bg-[var(--admin-panel-strong)] focus-visible:outline-2 focus-visible:outline-[var(--admin-muted)]">
          <span>{tr('copyPasteAs')}</span><ChevronRight className="h-3.5 w-3.5" />
        </button>
        {submenuOpen && (
          <div ref={submenuRef} className="absolute top-0 left-[var(--submenu-left,100%)] right-[var(--submenu-right,auto)] w-[184px] px-1 max-[460px]:static max-[460px]:w-full max-[460px]:px-0 max-[460px]:pt-1">
            <div role="menu" aria-label={tr('copyPasteAs')} className="rounded-md border border-[var(--admin-line)] bg-[var(--admin-panel)] p-1 shadow-lg">
              {(['copyPlainText', 'pasteQuote'] as const).map((action) => (
                <button key={action} type="button" role="menuitem" disabled={action === 'copyPlainText' && !hasSelection}
                  onMouseDown={keepFocus} onClick={() => trigger(action)}
                  className="block h-8 w-full cursor-pointer rounded px-2 text-left text-xs text-[var(--admin-text)] hover:bg-[var(--admin-panel-strong)] focus-visible:outline-2 focus-visible:outline-[var(--admin-muted)] disabled:cursor-default disabled:opacity-30">
                  {tr(action)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="my-1.5 h-px bg-[var(--admin-line)]" />
      <div className="grid grid-cols-4 gap-1">{formatRows.map(renderIcon)}</div>
    </div>
  );
}
