import { useState } from 'react';
import { Sun, Moon, Leaf, X, Lock, LockOpen, Trash2, Plus, Settings } from './icons';

function WinMinIcon() {
  return <svg width="11" height="2" viewBox="0 0 11 2"><line x1="0.5" y1="1" x2="10.5" y2="1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;
}
function WinMaxIcon() {
  return <svg width="10" height="10" viewBox="0 0 10 10"><rect x="0.75" y="0.75" width="8.5" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>;
}
function WinCloseIcon() {
  return <svg width="10" height="10" viewBox="0 0 10 10"><line x1="0.5" y1="0.5" x2="9.5" y2="9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><line x1="9.5" y1="0.5" x2="0.5" y2="9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;
}

function GridIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="1.5" y="9.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
    </svg>
  );
}

function PencilIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.5 2.5a1.414 1.414 0 0 1 2 2L5 13 2 14l1-3 8.5-8.5z" />
    </svg>
  );
}

const TAG_PALETTE = [
  '#334155', '#3D5A40', '#5A7D9A', '#8B5A80',
  '#7A9D6F', '#E3B95E', '#D06B6B', '#9A7A5A',
  '#5A7A9A', '#9A5A7A', '#6B9A7A', '#C07A40',
];

function ColorSwatch({ current, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button onClick={() => setOpen((v) => !v)}
        className="w-4 h-4 rounded-full border-2 border-transparent hover:border-text-3 transition-colors"
        style={{ background: current }} />
      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-[60] bg-surface border border-stroke rounded-2xl shadow-lg p-2"
          style={{ width: 120 }} onMouseLeave={() => setOpen(false)}>
          <div className="grid grid-cols-4 gap-1.5">
            {TAG_PALETTE.map((c) => (
              <button key={c} onClick={() => { onChange(c); setOpen(false); }}
                className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                style={{ background: c, outline: current === c ? '2px solid var(--text)' : 'none', outlineOffset: 2 }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sticky top bar — window controls only ── */
export function TopBar() {
  return (
    <div className="titlebar-drag flex items-center justify-end h-8 pr-1.5">
      {typeof window !== 'undefined' && window.lumen?.winClose && (
        <div className="flex items-center gap-0.5">
          <button onClick={() => window.lumen.winMinimize()} title="Minimize"
            className="w-8 h-8 grid place-items-center text-text-3 hover:text-text hover:bg-surface-2 rounded-lg transition-colors">
            <WinMinIcon />
          </button>
          <button onClick={() => window.lumen.winMaximize()} title="Maximize"
            className="w-8 h-8 grid place-items-center text-text-3 hover:text-text hover:bg-surface-2 rounded-lg transition-colors">
            <WinMaxIcon />
          </button>
          <button onClick={() => window.lumen.winClose()} title="Close"
            className="w-8 h-8 grid place-items-center text-text-3 hover:text-white hover:bg-[#c0564b] rounded-lg transition-colors">
            <WinCloseIcon />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Bottom dock pill — layout + settings controls ── */
export function BottomDock({ theme, setTheme, unlocked, setUnlocked, onOpenLayoutEditor, onOpenSettings, hasBg, updateReady }) {
  return (
    <div className="flex items-center gap-0.5 px-1.5 py-1" style={{
      background: hasBg ? 'color-mix(in srgb, var(--surface) 75%, transparent)' : 'var(--surface)',
      backdropFilter: hasBg ? 'blur(16px) saturate(140%)' : undefined,
      WebkitBackdropFilter: hasBg ? 'blur(16px) saturate(140%)' : undefined,
      border: '1px solid var(--stroke)',
      borderRadius: 99,
      boxShadow: '0 2px 16px -6px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <button onClick={onOpenLayoutEditor} title="Edit layout"
        className="w-8 h-8 grid place-items-center text-text-3 hover:text-text hover:bg-surface-2 rounded-full transition-colors">
        <GridIcon size={14} />
      </button>
      <button onClick={() => setUnlocked((v) => !v)} title={unlocked ? 'Lock layout' : 'Unlock layout'}
        className={`w-8 h-8 grid place-items-center rounded-full transition-colors ${unlocked ? 'text-accent' : 'text-text-3 hover:text-text hover:bg-surface-2'}`}>
        {unlocked ? <LockOpen size={14} /> : <Lock size={14} />}
      </button>
      <div className="w-px h-4 mx-1" style={{ background: 'var(--stroke)' }} />
      <button
        onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'cream' : 'light')}
        title={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'cream' : 'light'} mode`}
        className="w-8 h-8 grid place-items-center text-text-3 hover:text-text hover:bg-surface-2 rounded-full transition-colors">
        {theme === 'light' ? <Moon size={14} /> : theme === 'dark' ? <Leaf size={14} /> : <Sun size={14} />}
      </button>
      <button onClick={onOpenSettings} title={updateReady ? 'Update available — open Settings' : 'Settings'}
        className="relative w-8 h-8 grid place-items-center text-text-3 hover:text-text hover:bg-surface-2 rounded-full transition-colors">
        <Settings size={14} />
        {updateReady && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full"
            style={{ background: 'var(--accent)', boxShadow: '0 0 0 2px var(--surface)' }} />
        )}
      </button>
    </div>
  );
}

/* ── Greeting + layout-template tabs — scrolls with content ── */
export default function Header({
  now, name, templates = [], activeTemplate,
  onSwitchTemplate, onAddTemplate, onRenameTemplate, onRecolorTemplate, onDeleteTemplate,
}) {
  const [editingId, setEditingId] = useState(null);

  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 19 ? 'Good afternoon' : 'Good evening';
  const displayName = name || 'there';
  const editing = templates.find((t) => t.id === editingId);

  return (
    <div className="mb-5">
        <div className="flex items-center justify-between gap-4">

          {/* left: greeting */}
          <div className="min-w-0">
            <div className="text-[12px] text-text-2 mb-0.5">
              {now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <div className="text-[22px] font-semibold tracking-tight leading-none" style={{ textWrap: 'balance' }}>{greeting}, {displayName}</div>
          </div>

          {/* layout template tabs + new */}
          <div className="relative flex items-center gap-1 shrink-0">
            <div className="flex bg-surface-2 rounded-full p-[3px]">
              {templates.map((t) => {
                const on = t.id === activeTemplate;
                return (
                  <button key={t.id}
                    onClick={() => { if (on) setEditingId((v) => (v === t.id ? null : t.id)); else { onSwitchTemplate(t.id); setEditingId(null); } }}
                    title={on ? 'Edit template' : `Switch to ${t.name}`}
                    className={`flex items-center gap-2 text-[13px] px-3.5 py-[7px] rounded-full transition-colors ${on ? 'bg-surface text-text font-medium shadow-sm' : 'text-text-2'}`}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: t.color }} />
                    {t.name}
                  </button>
                );
              })}
            </div>

            <button onClick={onAddTemplate} title="New template (duplicates current)"
              className="w-7 h-7 grid place-items-center rounded-full bg-surface-2 text-text-3 hover:text-text transition-colors shrink-0">
              <Plus size={14} />
            </button>

            {editing && (
              <div className="absolute right-0 top-full mt-2 bg-surface border border-stroke rounded-2xl shadow-lg p-3 z-50"
                style={{ minWidth: 230 }}
                onMouseLeave={() => setEditingId(null)}>
                <div className="text-[11px] tracking-widest uppercase text-text-3 mb-2.5 px-1">Template</div>
                <div className="flex items-center gap-2 px-1 mb-2.5">
                  <ColorSwatch current={editing.color} onChange={(c) => onRecolorTemplate(editing.id, c)} />
                  <input value={editing.name} onChange={(e) => onRenameTemplate(editing.id, e.target.value)}
                    className="flex-1 text-[13px] bg-surface-2 rounded-xl px-2.5 py-1.5 outline-none min-w-0" />
                </div>
                <button onClick={() => { onDeleteTemplate(editing.id); setEditingId(null); }}
                  disabled={templates.length <= 1}
                  className="flex items-center gap-1.5 w-full px-2.5 py-2 rounded-xl text-[13px] transition-colors text-text-2 hover:text-[#c0564b] hover:bg-surface-2 disabled:opacity-30 disabled:cursor-default disabled:hover:text-text-2 disabled:hover:bg-transparent">
                  <Trash2 size={13} /> Delete template
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
