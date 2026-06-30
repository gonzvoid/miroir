import { useEffect, useMemo, useRef, useState } from 'react';
import { LANES, STATUSES, bucketOf, dateForLane } from '../lib/utils';
import { Plus, Check, Trash2, MoreVertical, GripVertical } from './icons';

const TAG_PALETTE = [
  '#334155', '#3D5A40', '#5A7D9A', '#8B5A80',
  '#7A9D6F', '#E3B95E', '#D06B6B', '#9A7A5A',
  '#5A7A9A', '#9A5A7A', '#6B9A7A', '#C07A40',
];

function PencilIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.5 2.5a1.414 1.414 0 0 1 2 2L5 13 2 14l1-3 8.5-8.5z" />
    </svg>
  );
}

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

export default function Focal({
  tasks, addTask, cycleTask, delTask, editTask,
  setTaskStatus, setTaskLane, moveTask, reorderTask,
  composerRef, tags, setTags,
}) {
  const [draft, setDraft] = useState('');
  const [lane, setLane] = useState('today');
  const [tagId, setTagId] = useState(() => tags?.[0]?.id ?? 'work');
  const [editing, setEditing] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [menuTab, setMenuTab] = useState('status'); // 'status' | 'tag'
  const [dragId, setDragId] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showTagEditor, setShowTagEditor] = useState(false);
  const [addingTag, setAddingTag] = useState(false);
  const [newTagDraft, setNewTagDraft] = useState({ label: '', color: TAG_PALETTE[0] });

  const updateTag = (id, changes) => setTags?.((ts) => ts.map((t) => (t.id === id ? { ...t, ...changes } : t)));
  const deleteTag = (id) => { setTags?.((ts) => ts.filter((t) => t.id !== id)); if (filter === id) setFilter('all'); };
  const addTag = () => {
    if (!newTagDraft.label.trim()) return;
    const id = newTagDraft.label.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    setTags?.((ts) => [...ts, { id, label: newTagDraft.label.trim(), color: newTagDraft.color }]);
    setNewTagDraft({ label: '', color: TAG_PALETTE[0] });
    setAddingTag(false);
  };

  const composerWrapRef = useRef(null);
  const ringRef = useRef(null);
  const isFocused = useRef(false);

  useEffect(() => {
    const onMove = (e) => {
      if (!composerWrapRef.current || !ringRef.current || isFocused.current) return;
      const r = composerWrapRef.current.getBoundingClientRect();
      const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
      const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
      const intent = Math.max(0, 1 - Math.hypot(dx, dy) / 180) ** 2;
      ringRef.current.style.opacity = intent.toFixed(3);
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    return () => document.removeEventListener('pointermove', onMove);
  }, []);

  const submit = () => { if (!draft.trim()) return; addTask(draft, tagId, dateForLane(lane)); setDraft(''); };

  const grouped = useMemo(() => {
    const g = { today: [], tomorrow: [], week: [], future: [] };
    tasks.forEach((t) => {
      if ((t.state || 0) === 2) return; // completed go to their own section
      if (filter !== 'all' && t.lane !== filter) return;
      g[bucketOf(t.date)]?.push(t);
    });
    return g;
  }, [tasks, filter]);

  const completedTasks = useMemo(() =>
    tasks
      .filter((t) => (t.state || 0) === 2 && (filter === 'all' || t.lane === filter))
      .sort((a, b) => (b.completedAt || b.date || '').localeCompare(a.completedAt || a.date || '')),
    [tasks, filter]
  );

  const tagColor = (id) => tags?.find((t) => t.id === id)?.color ?? 'var(--accent)';
  const tagLabel = (id) => tags?.find((t) => t.id === id)?.label ?? id;

  const openMenu = (id) => { setMenuId(menuId === id ? null : id); setMenuTab('status'); };

  return (
    <section className="bg-surface rounded-focal p-7 pb-6 shadow-lg">
      <div className="mb-5">
        <div className="text-[15px] font-semibold tracking-tight mb-3">Things to do</div>

        {/* tag filter + editor */}
        <div className="relative flex items-center gap-1">
          <div className="flex bg-surface-2 rounded-full p-[3px] flex-wrap">
            <button onClick={() => setFilter('all')}
              className={`text-[12px] px-3 py-[6px] rounded-full transition-colors ${filter === 'all' ? 'bg-surface text-text font-medium shadow-sm' : 'text-text-2'}`}>
              All
            </button>
            {(tags || []).map((t) => (
              <button key={t.id} onClick={() => setFilter(t.id)}
                className={`flex items-center gap-1.5 text-[12px] px-3 py-[6px] rounded-full transition-colors ${filter === t.id ? 'bg-surface text-text font-medium shadow-sm' : 'text-text-2'}`}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: t.color }} />
                {t.label}
              </button>
            ))}
          </div>

          {setTags && (
            <button onClick={() => { setShowTagEditor((v) => !v); setAddingTag(false); }} title="Edit tags"
              className={`w-7 h-7 grid place-items-center rounded-full transition-colors shrink-0 ${showTagEditor ? 'bg-accent text-white' : 'bg-surface-2 text-text-3 hover:text-text'}`}>
              <PencilIcon size={13} />
            </button>
          )}

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
                    className="opacity-0 group-hover:opacity-100 text-text-3 hover:text-[#c0564b] p-0.5 transition-opacity shrink-0">
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

      {/* composer */}
      <div ref={composerWrapRef} className="relative flex gap-1.5 items-center bg-surface-2 rounded-full pl-4 pr-[5px] py-[5px] mb-5">
        <div ref={ringRef} className="pointer-events-none absolute rounded-full border border-text-3"
          style={{ opacity: 0, inset: '-2px', transition: 'opacity 0.15s ease' }} />
        <input ref={composerRef} value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="Add a task…"
          onFocus={() => { isFocused.current = true; if (ringRef.current) ringRef.current.style.opacity = '1'; }}
          onBlur={() => { isFocused.current = false; if (ringRef.current) ringRef.current.style.opacity = '0'; }}
          className="flex-1 min-w-0 bg-transparent outline-none text-sm py-[9px] placeholder:text-text-3" />
        <select value={lane} onChange={(e) => setLane(e.target.value)}
          className="bg-transparent text-xs text-text-2 outline-none cursor-pointer">
          {LANES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
        <select value={tagId} onChange={(e) => setTagId(e.target.value)}
          className="bg-transparent text-xs text-text-2 outline-none cursor-pointer">
          {(tags || []).map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <button onClick={submit}
          className="w-9 h-9 shrink-0 grid place-items-center bg-text text-canvas rounded-full hover:scale-105 transition-transform">
          <Plus size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {LANES.map((l) => (
          <div key={l.id}
            onDragOver={(e) => { if (dragId) e.preventDefault(); }}
            onDrop={() => { if (dragId) { moveTask(dragId, l.id); setDragId(null); } }}>
            <div className="flex items-center gap-2.5 mb-3">
              <span className={`text-[11px] tracking-wider uppercase ${l.id === 'today' ? 'text-accent-text' : 'text-text-2'}`}>{l.label}</span>
              <span className="text-[11px] text-text-3">{grouped[l.id].length}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              {grouped[l.id].length === 0 && <div className="text-[13px] text-text-3 py-0.5">Nothing here</div>}
              {grouped[l.id].map((t) => {
                const st = t.state || 0;
                const tCol = tagColor(t.lane);

                return (
                  <div key={t.id}
                    className={`group flex items-center gap-3 px-1.5 py-2.5 rounded-xl transition-all duration-150
                      ${dragId === t.id ? 'opacity-30 scale-[0.97]' : ''}
                      ${hoverId === t.id && dragId && dragId !== t.id ? 'bg-accent-tint ring-1 ring-accent/40' : dragId !== t.id ? 'hover:bg-surface-2' : ''}`}
                    onDragOver={(e) => { if (dragId && dragId !== t.id) { e.preventDefault(); setHoverId(t.id); } }}
                    onDragLeave={() => setHoverId(null)}
                    onDrop={(e) => { e.stopPropagation(); if (dragId && dragId !== t.id) { reorderTask(dragId, t.id); setDragId(null); setHoverId(null); } }}>

                    <span className="cursor-grab active:cursor-grabbing flex items-center text-text-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      draggable onDragStart={() => setDragId(t.id)} onDragEnd={() => setDragId(null)}>
                      <GripVertical size={14} />
                    </span>

                    {/* checkbox — colour from tag */}
                    <button onClick={() => cycleTask(t.id)}
                      className="shrink-0 w-5 h-5 rounded-[7px] border-[1.5px] grid place-items-center relative overflow-hidden transition-all"
                      style={{
                        borderColor: tCol,
                        background: st === 2 ? tCol : 'transparent',
                        color: st === 2 ? 'var(--canvas)' : 'transparent',
                      }}>
                      {st === 1 && (
                        <span className="absolute left-0 top-0 bottom-0 w-1/2" style={{ background: tCol }} />
                      )}
                      {st === 2 && <Check size={12} className="relative z-10" />}
                    </button>


                    {editing === t.id ? (
                      <input autoFocus defaultValue={t.title}
                        onBlur={(e) => { editTask(t.id, e.target.value.trim() || t.title); setEditing(null); }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { editTask(t.id, e.target.value.trim() || t.title); setEditing(null); }
                          if (e.key === 'Escape') setEditing(null);
                        }}
                        className="flex-1 text-sm bg-surface-3 rounded-md px-2 py-1 outline-none" />
                    ) : (
                      <span onClick={() => setEditing(t.id)}
                        className={`flex-1 text-sm leading-tight cursor-text ${st === 2 ? 'text-text-3 line-through' : ''}`}>
                        {t.title}
                      </span>
                    )}

                    {t.status && (
                      <span className={`text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-full whitespace-nowrap
                        ${t.status === 'pending'   ? 'text-[#2563eb] bg-[#dbeafe]' : ''}
                        ${t.status === 'started'   ? 'text-[#166534] bg-[#dcfce7]' : ''}
                        ${t.status === 'hold'      ? 'text-[#9a6b1e] bg-[#f6e8cf]' : ''}
                        ${t.status === 'postponed' ? 'text-text-2 bg-surface-3' : ''}`}>
                        {STATUSES.find((s) => s.id === t.status)?.label}
                      </span>
                    )}

                    <button onClick={() => delTask(t.id)}
                      className="opacity-0 group-hover:opacity-100 text-text-3 hover:text-[#c0564b] transition-all p-0.5">
                      <Trash2 size={14} />
                    </button>

                    {/* context menu */}
                    <div className="relative">
                      <button onClick={() => openMenu(t.id)}
                        className="opacity-0 group-hover:opacity-100 text-text-3 hover:text-text transition-all p-0.5">
                        <MoreVertical size={15} />
                      </button>

                      {menuId === t.id && (
                        <div onMouseLeave={() => setMenuId(null)}
                          className="absolute right-0 top-full mt-1 bg-surface border border-stroke rounded-xl shadow-lg p-1.5 z-20 min-w-[150px]">

                          {/* tab switcher */}
                          <div className="flex bg-surface-2 rounded-lg p-0.5 mb-1.5">
                            {['status', 'tag'].map((tab) => (
                              <button key={tab} onClick={() => setMenuTab(tab)}
                                className={`flex-1 text-[11px] py-1 rounded-md capitalize transition-colors
                                  ${menuTab === tab ? 'bg-surface text-text font-medium shadow-sm' : 'text-text-3'}`}>
                                {tab}
                              </button>
                            ))}
                          </div>

                          {menuTab === 'status' && STATUSES.map((s) => (
                            <button key={s.id} onClick={() => { setTaskStatus(t.id, s.id); setMenuId(null); }}
                              className={`flex items-center gap-2 text-left text-[13px] px-2.5 py-2 rounded-lg hover:bg-surface-2 w-full
                                ${t.status === s.id ? 'text-accent-text font-medium' : 'text-text'}`}>
                              {t.status === s.id && <span className="w-1 h-1 rounded-full bg-accent shrink-0" />}
                              {s.label}
                            </button>
                          ))}

                          {menuTab === 'tag' && (tags || []).map((tg) => (
                            <button key={tg.id} onClick={() => { setTaskLane(t.id, tg.id); setMenuId(null); }}
                              className={`flex items-center gap-2 text-left text-[13px] px-2.5 py-2 rounded-lg hover:bg-surface-2 w-full
                                ${t.lane === tg.id ? 'font-medium text-text' : 'text-text-2'}`}>
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: tg.color }} />
                              {tg.label}
                              {t.lane === tg.id && <span className="ml-auto text-[11px] text-text-3">✓</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Completed ──────────────────────────────────────── */}
      {completedTasks.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setCompletedOpen((v) => !v)}
            className="flex w-full items-center gap-2.5 py-1 mb-1 text-left">
            <span className="text-[11px] tracking-wider uppercase text-text-3">Completed</span>
            <span className="text-[11px] text-text-3">{completedTasks.length}</span>
            <span className="ml-auto text-[10px] text-text-3 leading-none select-none">
              {completedOpen ? '▲' : '▼'}
            </span>
          </button>

          <div className="collapsible" style={{ maxHeight: completedOpen ? 800 : 0, opacity: completedOpen ? 1 : 0 }}>
            <div className="flex flex-col gap-0.5 pt-1">
              {completedTasks.map((t) => {
                const tCol = tagColor(t.lane);
                return (
                  <div key={t.id}
                    className="group flex items-center gap-3 px-1.5 py-2 rounded-xl hover:bg-surface-2 transition-colors">
                    <button onClick={() => cycleTask(t.id)}
                      className="shrink-0 w-5 h-5 rounded-[7px] border-[1.5px] grid place-items-center relative overflow-hidden transition-all"
                      style={{ borderColor: tCol, background: tCol }}>
                      <Check size={12} className="relative z-10 text-canvas" />
                    </button>
                    <span className="flex-1 text-sm text-text-3 line-through leading-tight">{t.title}</span>
                    <button onClick={() => delTask(t.id)}
                      className="opacity-0 group-hover:opacity-100 text-text-3 hover:text-[#c0564b] transition-all p-0.5">
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
