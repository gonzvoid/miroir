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

export default function Header({
  theme, setTheme, filter, setFilter, now, unlocked, setUnlocked,
  name, tags, setTags, onOpenLayoutEditor, onOpenSettings,
}) {
  const [showTagEditor, setShowTagEditor] = useState(false);
  const [newTagDraft, setNewTagDraft] = useState({ label: '', color: TAG_PALETTE[0] });
  const [addingTag, setAddingTag] = useState(false);

  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 19 ? 'Good afternoon' : 'Good evening';
  const displayName = name || 'there';

  const updateTag = (id, changes) => setTags((ts) => ts.map((t) => (t.id === id ? { ...t, ...changes } : t)));
  const deleteTag = (id) => { setTags((ts) => ts.filter((t) => t.id !== id)); if (filter === id) setFilter('all'); };
  const addTag = () => {
    if (!newTagDraft.label.trim()) return;
    const id = newTagDraft.label.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    setTags((ts) => [...ts, { id, label: newTagDraft.label.trim(), color: newTagDraft.color }]);
    setNewTagDraft({ label: '', color: TAG_PALETTE[0] });
    setAddingTag(false);
  };

  return (
    <div>
      {/* Top strip — icons left, window controls right, flush to top */}
      <div className="titlebar-drag flex items-center justify-between h-8 mb-2">

        {/* LEFT: app action icons */}
        <div className="flex items-center gap-0.5">
          <button onClick={onOpenLayoutEditor} title="Edit layout"
            className="w-8 h-8 grid place-items-center text-text-3 hover:text-text hover:bg-surface-2 rounded-lg transition-colors">
            <GridIcon size={14} />
          </button>
          <button onClick={() => setUnlocked((v) => !v)} title={unlocked ? 'Lock layout' : 'Unlock layout'}
            className={`w-8 h-8 grid place-items-center rounded-lg transition-colors ${unlocked ? 'text-accent' : 'text-text-3 hover:text-text hover:bg-surface-2'}`}>
            {unlocked ? <LockOpen size={14} /> : <Lock size={14} />}
          </button>
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'cream' : 'light')}
            title={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'cream' : 'light'} mode`}
            className="w-8 h-8 grid place-items-center text-text-3 hover:text-text hover:bg-surface-2 rounded-lg transition-colors">
            {theme === 'light' ? <Moon size={14} /> : theme === 'dark' ? <Leaf size={14} /> : <Sun size={14} />}
          </button>
          <button onClick={onOpenSettings} title="Settings"
            className="w-8 h-8 grid place-items-center text-text-3 hover:text-text hover:bg-surface-2 rounded-lg transition-colors">
            <Settings size={14} />
          </button>
        </div>

        {/* RIGHT: window controls — Electron only */}
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

      {/* Main header — greeting + filter pills */}
      <div className="titlebar-drag mb-5">
        <div className="flex items-center justify-between gap-4">

          {/* left: greeting */}
          <div className="min-w-0">
            <div className="text-[12px] text-text-2 mb-0.5">
              {now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <div className="text-[22px] font-semibold tracking-tight leading-none">{greeting}, {displayName}</div>
          </div>

          {/* filter pills + tag editor */}
          <div className="relative flex items-center gap-1 shrink-0">
            <div className="flex bg-surface-2 rounded-full p-[3px]">
              <button onClick={() => setFilter('all')}
                className={`text-[13px] px-4 py-[7px] rounded-full transition-colors ${filter === 'all' ? 'bg-surface text-text font-medium shadow-sm' : 'text-text-2'}`}>
                All
              </button>
              {(tags || []).map((t) => (
                <button key={t.id} onClick={() => setFilter(t.id)}
                  className={`flex items-center gap-1.5 text-[13px] px-3.5 py-[7px] rounded-full transition-colors ${filter === t.id ? 'bg-surface text-text font-medium shadow-sm' : 'text-text-2'}`}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: t.color }} />
                  {t.label}
                </button>
              ))}
            </div>

            <button onClick={() => { setShowTagEditor((v) => !v); setAddingTag(false); }} title="Edit tags"
              className={`w-7 h-7 grid place-items-center rounded-full transition-colors ${showTagEditor ? 'bg-accent text-white' : 'bg-surface-2 text-text-3 hover:text-text'}`}>
              <PencilIcon size={13} />
            </button>

            {showTagEditor && (
              <div className="absolute right-0 top-full mt-2 bg-surface border border-stroke rounded-2xl shadow-lg p-3 z-50"
                style={{ minWidth: 220 }}
                onMouseLeave={() => { if (!addingTag) setShowTagEditor(false); }}>
                <div className="text-[11px] tracking-widest uppercase text-text-3 mb-2.5 px-1">Tags</div>
                {(tags || []).map((t) => (
                  <div key={t.id} className="flex items-center gap-2 px-1 py-1.5 rounded-xl hover:bg-surface-2 group">
                    <ColorSwatch current={t.color} onChange={(c) => updateTag(t.id, { color: c })} />
                    <input value={t.label} onChange={(e) => updateTag(t.id, { label: e.target.value })}
                      className="flex-1 text-[13px] bg-transparent outline-none min-w-0" />
                    <button onClick={() => deleteTag(t.id)}
                      className="opacity-0 group-hover:opacity-100 text-text-3 hover:text-[#c0564b] p-0.5 transition-all shrink-0">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                {addingTag ? (
                  <div className="mt-1 px-1 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <ColorSwatch current={newTagDraft.color} onChange={(c) => setNewTagDraft((d) => ({ ...d, color: c }))} />
                      <input autoFocus value={newTagDraft.label}
                        onChange={(e) => setNewTagDraft((d) => ({ ...d, label: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') addTag(); if (e.key === 'Escape') setAddingTag(false); }}
                        placeholder="Tag name"
                        className="flex-1 text-[13px] bg-surface-2 rounded-xl px-2.5 py-1.5 outline-none min-w-0" />
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={addTag} className="flex-1 text-[12px] py-1.5 rounded-full bg-accent text-white">Add</button>
                      <button onClick={() => setAddingTag(false)} className="flex-1 text-[12px] py-1.5 rounded-full bg-surface-2 text-text-2">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setAddingTag(true)}
                    className="mt-1 flex items-center gap-1.5 w-full px-2.5 py-2 rounded-xl text-text-3 hover:text-text hover:bg-surface-2 text-[13px] transition-colors">
                    <Plus size={13} /> New tag
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
