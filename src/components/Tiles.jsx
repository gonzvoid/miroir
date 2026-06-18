import { useEffect, useMemo, useRef, useState } from 'react';
import {
  WEEKDAYS, SEGMENTS, MOODS, MOOD_SCORE, moodColor, COUNTDOWNS,
  startOfDay, addDays, sameDay, ymd, parseYmd,
} from '../lib/utils';
import {
  Plus, Check, X, ChevronLeft, ChevronRight, Trash2, ArrowRight, Link2,
  CheckSquare, CalIcon, Globe, Clock, Droplets, ExternalLink, Settings,
} from './icons';

const Card = ({ children, className = '' }) => (
  <section className={`bg-surface rounded-card p-[22px] shadow-sm ${className}`}>{children}</section>
);
const Head = ({ title, right }) => (
  <div className="flex justify-between items-center mb-4">
    <div className="text-[15px] font-semibold tracking-tight">{title}</div>
    {right}
  </div>
);

/* ---- DatePicker ---- */
const PICKER_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function DatePicker({ value, onChange, placeholder = 'Pick a date' }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    const d = value ? new Date(value + 'T00:00:00') : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const ref = useRef(null);

  useEffect(() => {
    const down = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, []);

  const todayStr = ymd(new Date());
  const year = view.getFullYear(), month = view.getMonth();
  const dow0 = new Date(year, month, 1).getDay();
  const offset = dow0 === 0 ? 6 : dow0 - 1;
  const gridStart = new Date(year, month, 1 - offset);
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d;
  });
  const label = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full text-left text-[13px] bg-surface-2 rounded-xl px-3 py-2 outline-none flex items-center justify-between gap-2 hover:bg-surface-3 transition-colors">
        <span className={label ? 'text-text' : 'text-text-3'}>{label || placeholder}</span>
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="text-text-3 shrink-0">
          <rect x="1" y="2" width="12" height="11" rx="2" /><line x1="1" y1="6" x2="13" y2="6" />
          <line x1="4" y1="0" x2="4" y2="4" /><line x1="10" y1="0" x2="10" y2="4" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 bg-surface border border-stroke rounded-2xl p-3"
          style={{ width: 238, boxShadow: 'var(--shadow-lg)' }}>
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setView(new Date(year, month - 1, 1))}
              className="w-7 h-7 grid place-items-center text-text-2 hover:text-text hover:bg-surface-2 rounded-full transition-colors">
              <ChevronLeft size={14} />
            </button>
            <span className="text-[13px] font-medium text-text">{PICKER_MONTHS[month]} {year}</span>
            <button onClick={() => setView(new Date(year, month + 1, 1))}
              className="w-7 h-7 grid place-items-center text-text-2 hover:text-text hover:bg-surface-2 rounded-full transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {['M','T','W','T','F','S','S'].map((d, i) => (
              <span key={i} className="text-center text-[10px] tracking-wide uppercase text-text-3">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-[2px]">
            {days.map((d, i) => {
              const str = ymd(d);
              const inMonth = d.getMonth() === month;
              const isSel = str === value;
              const isToday = str === todayStr;
              return (
                <button key={i} onClick={() => { onChange(ymd(d)); setOpen(false); }}
                  className={[
                    'aspect-square rounded-[8px] text-[12px] flex items-center justify-center transition-colors',
                    isSel ? 'bg-accent font-semibold' : isToday ? 'bg-accent-tint text-accent-text font-semibold' : 'hover:bg-surface-2 text-text',
                    !inMonth ? 'opacity-25' : '',
                  ].join(' ')}
                  style={isSel ? { color: 'var(--canvas)' } : undefined}>
                  {d.getDate()}
                </button>
              );
            })}
          </div>
          <div className="mt-2 pt-2 border-t border-stroke flex justify-between">
            <button onClick={() => { onChange(''); setOpen(false); }}
              className="text-[11.5px] text-text-3 hover:text-text transition-colors">Clear</button>
            <button onClick={() => {
              onChange(todayStr);
              setView(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
              setOpen(false);
            }} className="text-[11.5px] text-text-3 hover:text-text transition-colors">Today</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Timeline (Today) ---------------- */
export function Timeline({ events, now }) {
  const todayEvents = useMemo(
    () => events.filter((e) => sameDay(parseYmd(e.start), now) && e.time).sort((a, b) => a.time.localeCompare(b.time)),
    [events, now]
  );
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  let nowPlaced = false;
  return (
    <Card>
      <Head title="Today" />
      <div className="flex flex-col">
        {todayEvents.length === 0 && <div className="text-xs text-text-3 py-1.5">No timed events today</div>}
        {todayEvents.map((e, i) => {
          const isNow = !nowPlaced && toMin(e.time) <= nowMin && (i === todayEvents.length - 1 || toMin(todayEvents[i + 1].time) > nowMin);
          if (isNow) nowPlaced = true;
          const [h, m] = e.time.split(':'); const hh = ((+h + 11) % 12) + 1; const ap = +h < 12 ? 'AM' : 'PM';
          return (
            <div key={e.id} className="flex gap-3 items-stretch min-h-[36px]">
              <div className="text-[10.5px] text-text-3 w-12 shrink-0 pt-0.5 tracking-wide">{hh}:{m} {ap}</div>
              <div className="w-0.5 bg-stroke shrink-0 rounded" />
              <div className="flex-1 pb-3">
                <div className={`rounded-xl px-3.5 py-2.5 ${isNow ? 'bg-accent-tint' : 'bg-surface-2'}`} style={{ borderLeft: `3px solid ${e.calendarId === 'life' ? 'var(--text-3)' : 'var(--accent)'}` }}>
                  <div className="text-[13.5px] font-medium">
                    {e.title}
                    {isNow && <span className="text-[9.5px] tracking-wider uppercase text-white bg-accent px-[7px] py-0.5 rounded-full ml-2">Now</span>}
                  </div>
                  {e.loc && <div className="text-[11.5px] text-text-2 mt-0.5">{e.loc}</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------------- Quick capture (dark) ---------------- */
export function QuickCapture({ ideas, addIdea, delIdea, ideaToTask, addEvent, focusComposer }) {
  const [draft, setDraft] = useState('');
  const [addingEvent, setAddingEvent] = useState(false);
  const [evDraft, setEvDraft] = useState({ title: '', date: ymd(new Date()), time: '', calendarId: 'work' });

  const submit = () => { if (draft.trim()) { addIdea(draft); setDraft(''); } };

  const saveEvent = () => {
    if (!evDraft.title.trim()) return;
    addEvent({ ...evDraft });
    setEvDraft({ title: '', date: ymd(new Date()), time: '', calendarId: 'work' });
    setAddingEvent(false);
  };

  const btns = [
    { ic: <CheckSquare size={16} />, label: 'New task', kbd: '⌘T', onClick: focusComposer },
    { ic: <CalIcon size={16} />, label: 'New event', kbd: '⌘E', onClick: () => setAddingEvent(true) },
  ];

  const inputCls = 'w-full rounded-xl px-3 py-2 text-[12.5px] outline-none';
  const inputStyle = { background: 'rgba(255,255,255,.09)', color: 'var(--dark-cap-text)' };

  return (
    <section className="rounded-card p-[22px] shadow-sm" style={{ background: 'var(--dark-cap)' }}>
      <div className="text-[11px] tracking-widest uppercase mb-3" style={{ color: 'var(--dark-cap-2)' }}>Quick capture</div>
      <textarea value={draft} onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
        placeholder="Dump anything — half-ideas, references, reminders…"
        className="w-full rounded-xl px-3.5 py-3 text-[13.5px] outline-none resize-none min-h-[46px] leading-relaxed mb-2"
        style={{ background: 'rgba(255,255,255,.06)', color: 'var(--dark-cap-text)' }} />
      {draft.trim() && (
        <button onClick={submit} className="bg-accent text-white text-xs flex items-center gap-1.5 px-3.5 py-[7px] rounded-full mb-2">
          <Plus size={14} /> Capture
        </button>
      )}

      {/* inline event form */}
      {addingEvent && (
        <div className="flex flex-col gap-2 mb-2 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,.06)' }}>
          <input value={evDraft.title} onChange={(e) => setEvDraft((d) => ({ ...d, title: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && saveEvent()}
            placeholder="Event title" autoFocus className={inputCls} style={inputStyle} />
          <div className="flex gap-2">
            <input type="date" value={evDraft.date} onChange={(e) => setEvDraft((d) => ({ ...d, date: e.target.value }))}
              className={inputCls + ' flex-1'} style={inputStyle} />
            <input type="time" value={evDraft.time} onChange={(e) => setEvDraft((d) => ({ ...d, time: e.target.value }))}
              className={inputCls + ' flex-1'} style={inputStyle} />
          </div>
          <select value={evDraft.calendarId} onChange={(e) => setEvDraft((d) => ({ ...d, calendarId: e.target.value }))}
            className={inputCls} style={inputStyle}>
            <option value="work">Work</option>
            <option value="life">Personal</option>
          </select>
          <div className="flex gap-2">
            <button onClick={saveEvent} className="flex-1 bg-accent text-white text-[12px] py-1.5 rounded-full">Add event</button>
            <button onClick={() => setAddingEvent(false)} className="flex-1 text-[12px] py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,.08)', color: 'var(--dark-cap-text)' }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-[7px]">
        {btns.map((b, i) => (
          <button key={i} onClick={b.onClick} className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-left w-full transition-colors hover:brightness-125"
            style={{ background: 'rgba(255,255,255,.06)' }}>
            <span style={{ color: 'var(--dark-cap-text)' }}>{b.ic}</span>
            <span className="flex-1 text-[13.5px]" style={{ color: 'var(--dark-cap-text)' }}>{b.label}</span>
            <span className="text-[11px]" style={{ color: 'var(--dark-cap-2)' }}>{b.kbd}</span>
          </button>
        ))}
      </div>
      {ideas.length > 0 && (
        <div className="mt-2.5 flex flex-col gap-1">
          {ideas.slice(0, 4).map((i) => (
            <div key={i.id} className="flex items-start gap-2 px-2.5 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,.04)' }}>
              <span className="flex-1 text-[12.5px] leading-snug" style={{ color: 'var(--dark-cap-text)' }}>{i.text}</span>
              <button onClick={() => ideaToTask(i)} title="Make task" style={{ color: 'var(--dark-cap-2)' }}><ArrowRight size={13} /></button>
              <button onClick={() => delIdea(i.id)} title="Delete" style={{ color: 'var(--dark-cap-2)' }}><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------------- Daily loops (customizable) ---------------- */
export function DailyLoops({ loops, setLoops }) {
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState(null);

  const tick = (id) => setLoops((ls) => ls.map((l) => (l.id === id ? { ...l, done: l.done + 1 > l.goal ? 0 : l.done + 1 } : l)));
  const R = 15, C = 2 * Math.PI * R;

  const startEdit = () => { setDrafts(loops.map((l) => ({ ...l }))); setEditing(true); };
  const cancelEdit = () => { setDrafts(null); setEditing(false); };
  const saveEdit = () => { setLoops(drafts.filter((d) => d.label.trim())); setEditing(false); setDrafts(null); };

  const addLoop = () => setDrafts((ds) => [...ds, { id: Date.now() + '', label: '', goal: 7, done: 0 }]);
  const delDraft = (id) => setDrafts((ds) => ds.filter((d) => d.id !== id));
  const patchDraft = (id, k, v) => setDrafts((ds) => ds.map((d) => d.id === id ? { ...d, [k]: v } : d));

  return (
    <Card>
      <Head title="Daily loops" right={
        editing
          ? <div className="flex gap-2">
              <button onClick={saveEdit} className="text-[11.5px] text-accent-text font-medium px-3 py-1 rounded-full bg-accent-tint">Save</button>
              <button onClick={cancelEdit} className="text-[11.5px] text-text-2 px-3 py-1 rounded-full bg-surface-2">Cancel</button>
            </div>
          : <button onClick={startEdit} className="text-[11.5px] text-text-2 hover:text-text px-2 py-0.5 rounded-full hover:bg-surface-2">Edit</button>
      } />

      {editing ? (
        <div className="flex flex-col gap-2">
          {drafts.map((d) => (
            <div key={d.id} className="flex items-center gap-2">
              <input value={d.label} onChange={(e) => patchDraft(d.id, 'label', e.target.value)}
                placeholder="Habit name" className="flex-1 text-[13px] bg-surface-2 rounded-xl px-3 py-2 outline-none" />
              <input type="number" min={1} max={99} value={d.goal} onChange={(e) => patchDraft(d.id, 'goal', Math.max(1, +e.target.value))}
                className="w-14 text-[13px] bg-surface-2 rounded-xl px-2 py-2 outline-none text-center" />
              <span className="text-[11px] text-text-3 shrink-0">/wk</span>
              <button onClick={() => delDraft(d.id)} className="text-text-3 hover:text-[#c0564b] p-1 shrink-0"><Trash2 size={14} /></button>
            </div>
          ))}
          <button onClick={addLoop} className="flex items-center gap-1.5 text-[13px] text-text-2 hover:text-text mt-1 px-1">
            <Plus size={14} /> Add loop
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {loops.map((l) => {
            const pct = l.goal ? l.done / l.goal : 0;
            return (
              <button key={l.id} onClick={() => tick(l.id)} title="Click to log"
                className="flex items-center gap-3 p-3 bg-surface-2 hover:bg-surface-3 rounded-2xl text-left transition-colors">
                <svg width="40" height="40" viewBox="0 0 40 40" className="shrink-0">
                  <circle cx="20" cy="20" r={R} fill="none" stroke="var(--surface-3)" strokeWidth="4" />
                  <circle cx="20" cy="20" r={R} fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={C} strokeDashoffset={C * (1 - pct)} transform="rotate(-90 20 20)" />
                  <text x="20" y="24" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text)">{l.done}</text>
                </svg>
                <div>
                  <div className="text-[13.5px] font-medium leading-snug">{l.label}</div>
                  <div className="text-[11.5px] text-text-2 mt-0.5">{l.done} / {l.goal} weekly</div>
                </div>
              </button>
            );
          })}
          {loops.length === 0 && (
            <button onClick={startEdit} className="col-span-2 text-[13px] text-text-3 hover:text-text py-3">+ Add your first loop</button>
          )}
        </div>
      )}
    </Card>
  );
}

/* ---------------- Summary ---------------- */
export function Summary({ tasks, moods, now }) {
  const s = useMemo(() => {
    const today = startOfDay(now); const weekAgo = addDays(today, -6);
    const done = tasks.filter((t) => (t.state || 0) === 2).length;
    let sum = 0, cnt = 0;
    Object.entries(moods).forEach(([k, day]) => {
      const dd = parseYmd(k);
      if (dd >= weekAgo && dd <= today) SEGMENTS.forEach((sg) => { const lv = day[sg.id]?.level; if (lv) { sum += MOOD_SCORE[lv]; cnt++; } });
    });
    const avg = cnt ? sum / cnt : 0;
    const moodId = cnt ? (avg >= 4.5 ? 'great' : avg >= 3.5 ? 'good' : avg >= 2.5 ? 'okay' : avg >= 1.5 ? 'low' : 'rough') : null;
    return { done, cnt, moodId, month: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) };
  }, [tasks, moods, now]);
  return (
    <Card>
      <Head title="Summary" right={<span className="text-xs text-text-2">{s.month}</span>} />
      <div className="flex flex-col gap-3.5">
        <Stat v={s.done} l="Done this week" />
        <Stat v={s.cnt} l="Moments logged" />
        <div>
          <div className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            {s.moodId ? <><span className="w-4 h-4 rounded-full" style={{ background: moodColor(s.moodId) }} />{MOODS.find((m) => m.id === s.moodId)?.label}</> : '—'}
          </div>
          <div className="text-xs text-text-2 mt-0.5">Avg mood</div>
        </div>
      </div>
    </Card>
  );
}
const Stat = ({ v, l }) => (<div><div className="text-2xl font-semibold tracking-tight">{v}</div><div className="text-xs text-text-2 mt-0.5">{l}</div></div>);

/* ---------------- Countdown ---------------- */
export function Countdown({ countdowns, setCountdowns }) {
  const today = startOfDay(new Date());
  const [adding, setAdding] = useState(!countdowns?.length);
  const [draft, setDraft] = useState({ label: '', date: '' });
  const [editId, setEditId] = useState(null);

  const items = (countdowns || [])
    .map((c) => ({ ...c, days: Math.round((startOfDay(parseYmd(c.date)) - today) / 86400000) }))
    .sort((a, b) => a.days - b.days);

  const save = () => {
    if (!draft.label.trim() || !draft.date) return;
    if (editId) {
      setCountdowns((cs) => cs.map((c) => c.id === editId ? { ...c, ...draft } : c));
      setEditId(null);
    } else {
      setCountdowns((cs) => [...(cs || []), { id: Date.now() + '', ...draft }]);
    }
    setDraft({ label: '', date: '' });
    setAdding(false);
  };

  const startEdit = (c) => { setEditId(c.id); setDraft({ label: c.label, date: c.date }); setAdding(true); };
  const del = (id) => setCountdowns((cs) => cs.filter((c) => c.id !== id));
  const cancel = () => { setAdding(false); setEditId(null); setDraft({ label: '', date: '' }); };

  return (
    <Card>
      <Head title="Counting down" right={
        !adding && <button onClick={() => setAdding(true)} className="text-[11.5px] text-text-2 hover:text-text px-2 py-0.5 rounded-full hover:bg-surface-2"><Plus size={13} /></button>
      } />
      {adding ? (
        <div className="flex flex-col gap-2">
          <input value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
            placeholder="Label (e.g. Wedding)" autoFocus
            className="w-full text-[13px] bg-surface-2 rounded-xl px-3 py-2 outline-none" />
          <DatePicker value={draft.date} onChange={(v) => setDraft((d) => ({ ...d, date: v }))} />
          <div className="flex gap-2 mt-1">
            <button onClick={save} className="flex-1 bg-accent text-white text-[12px] py-1.5 rounded-full">
              {editId ? 'Save' : 'Add'}
            </button>
            <button onClick={cancel} className="flex-1 bg-surface-2 text-text-2 text-[12px] py-1.5 rounded-full">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.length === 0 && (
            <button onClick={() => setAdding(true)} className="text-[13px] text-text-3 hover:text-text text-left">+ Add a countdown</button>
          )}
          {items.map((c) => (
            <div key={c.id} className="group flex items-end justify-between">
              <div>
                <div className="text-xs text-text-2 mb-0.5">{c.label}</div>
                <div className="text-[32px] font-semibold tracking-tight text-accent-text leading-none">
                  {c.days < 0 ? '✓' : c.days}<span className="text-[12px] font-normal text-text-2 ml-1.5">{c.days < 0 ? 'passed' : 'days'}</span>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pb-0.5">
                <button onClick={() => startEdit(c)} className="text-text-3 hover:text-text p-1"><Check size={12} /></button>
                <button onClick={() => del(c.id)} className="text-text-3 hover:text-red-400 p-1"><X size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ---------------- Sources (calendars) ---------------- */
export function Sources({ calendars, setCalendars, googleAccounts, onConnect, onDisconnect, onRename, clearLocalEvents, syncErrors = {}, onRefresh }) {
  const [editing, setEditing] = useState(null);
  const [draftName, setDraftName] = useState('');
  const toggle = (id) => setCalendars((cs) => cs.map((c) => (c.id === id ? { ...c, connected: !c.connected } : c)));
  const localCals = calendars.filter((c) => c.id !== 'google');
  const hasGoogle = googleAccounts.length > 0;

  const startEdit = (acct) => { setEditing(acct.email); setDraftName(acct.displayName || ''); };
  const commitEdit = (email) => { onRename(email, draftName.trim()); setEditing(null); };

  return (
    <Card>
      <Head title="Calendars" />
      <div>
        {!hasGoogle && localCals.map((c) => (
          <div key={c.id} className="flex items-center gap-3 py-2.5 border-b border-stroke last:border-0">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
            <span className="flex-1 text-sm">{c.name}</span>
            <button onClick={() => toggle(c.id)}
              className={`text-[11.5px] px-3.5 py-[5px] rounded-full ${c.connected ? 'bg-accent-tint text-accent-text font-medium' : 'bg-surface-2 text-text-2'}`}>
              {c.connected ? 'On' : 'Off'}
            </button>
          </div>
        ))}
        {googleAccounts.map((acct) => (
          <div key={acct.email} className="flex items-center gap-2 py-2.5 border-b border-stroke last:border-0">
            <span className="w-2 h-2 rounded-full shrink-0"
              style={{ background: syncErrors[acct.email] ? '#ef4444' : '#4285F4' }}
              title={syncErrors[acct.email] ? `Sync error: ${syncErrors[acct.email]}` : 'Connected'} />
            <div className="flex-1 min-w-0">
              {editing === acct.email ? (
                <input autoFocus value={draftName} onChange={(e) => setDraftName(e.target.value)}
                  onBlur={() => commitEdit(acct.email)}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(acct.email); if (e.key === 'Escape') setEditing(null); }}
                  className="w-full text-[13px] bg-surface-2 rounded-lg px-2 py-0.5 outline-none"
                  placeholder={acct.email} />
              ) : (
                <button onClick={() => startEdit(acct)} className="text-left w-full">
                  <div className="text-[13px] font-medium truncate">{acct.displayName || acct.email}</div>
                  {acct.displayName && <div className="text-[10.5px] text-text-3 truncate">{acct.email}</div>}
                </button>
              )}
            </div>
            <button onClick={() => onDisconnect(acct.email)} className="text-[11px] px-2.5 py-[5px] rounded-full bg-surface-2 text-text-2 hover:text-red-400 shrink-0">
              Remove
            </button>
          </div>
        ))}
      </div>
      <button onClick={onConnect} className="mt-3 w-full flex items-center justify-center gap-2 bg-surface-2 hover:text-text text-text-2 text-[13px] py-2.5 rounded-[14px]">
        <Link2 size={15} /> {hasGoogle ? 'Add another account' : 'Connect Google Calendar'}
      </button>
      {hasGoogle && onRefresh && (
        <button onClick={onRefresh}
          className="mt-2 w-full text-[12px] text-text-3 hover:text-text py-2 rounded-[14px] hover:bg-surface-2 transition-colors">
          ↻ Sync calendars
        </button>
      )}
      {clearLocalEvents && (
        <button onClick={clearLocalEvents}
          className="mt-2 w-full text-[12px] text-text-3 hover:text-[#c0564b] py-2 rounded-[14px] hover:bg-surface-2 transition-colors">
          Clear local events
        </button>
      )}
    </Card>
  );
}

const DAY_ABBR = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/* ---------------- Mood panel (logger + 30-day heatmap) ---------------- */
export function MoodPanel({ selDay, shiftDay, setSelDay, moods, setMoodSeg, now }) {
  const d = parseYmd(selDay); const isToday = sameDay(d, new Date());
  const dm = moods[selDay] || {};
  const [moodView, setMoodView] = useState('month');

  const monthCols = useMemo(() => {
    const today = startOfDay(now); const arr = [];
    for (let i = 29; i >= 0; i--) { const dd = addDays(today, -i); arr.push({ d: dd, key: ymd(dd) }); }
    return arr;
  }, [now]);

  const weekCols = useMemo(() => {
    const base = parseYmd(selDay);
    const dow = (base.getDay() + 6) % 7;
    const monday = addDays(base, -dow);
    return Array.from({ length: 7 }, (_, i) => { const dd = addDays(monday, i); return { d: dd, key: ymd(dd) }; });
  }, [selDay]);

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <div className="text-[15px] font-semibold tracking-tight">Mood</div>
        <div className="flex items-center gap-1">
          <button onClick={() => shiftDay(-1)} className="w-6 h-6 grid place-items-center text-text-2 hover:text-text hover:bg-surface-2 rounded-full"><ChevronLeft size={13} /></button>
          <span className="text-xs text-text-2 min-w-[52px] text-center">{isToday ? 'Today' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          <button onClick={() => shiftDay(1)} disabled={isToday} className="w-6 h-6 grid place-items-center text-text-2 hover:text-text hover:bg-surface-2 rounded-full disabled:opacity-30 disabled:cursor-default"><ChevronRight size={13} /></button>
        </div>
      </div>
      {SEGMENTS.map((seg) => {
        const cur = dm[seg.id] || {};
        return (
          <div key={seg.id} className="flex items-center gap-2.5 py-[5px]">
            <span className="text-[12.5px] text-text-2 w-[58px] shrink-0">{seg.label}</span>
            <div className="flex gap-1.5 flex-1">
              {MOODS.map((m) => (
                <button key={m.id} title={m.label} onClick={() => setMoodSeg(selDay, seg.id, { level: cur.level === m.id ? null : m.id })}
                  className={`w-[22px] h-[22px] rounded-[7px] border-2 transition-transform hover:scale-110 ${cur.level === m.id ? 'border-text' : 'border-transparent'}`}
                  style={{ background: m.color }} />
              ))}
            </div>
          </div>
        );
      })}

      <div className="mt-4 pt-3.5 border-t border-stroke">
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-[12px] font-medium">{moodView === 'month' ? 'Last 30 days' : 'This week'}</span>
          <div className="flex bg-surface-2 rounded-full p-0.5">
            {['month', 'week'].map((v) => (
              <button key={v} onClick={() => setMoodView(v)}
                className={`text-[10.5px] px-2.5 py-[3px] rounded-full ${moodView === v ? 'bg-surface text-text font-medium shadow-sm' : 'text-text-3'}`}>
                {v === 'month' ? '30d' : '7d'}
              </button>
            ))}
          </div>
        </div>

        {moodView === 'month' && (
          <>
            <div className="flex gap-[3px]">
              {monthCols.map(({ d: dd, key }) => {
                const hm = moods[key] || {};
                const isSel = key === selDay;
                const c0 = hm.morning?.level ? moodColor(hm.morning.level) : 'var(--surface-2)';
                const c1 = hm.midday?.level  ? moodColor(hm.midday.level)  : 'var(--surface-2)';
                const c2 = hm.evening?.level ? moodColor(hm.evening.level) : 'var(--surface-2)';
                return (
                  <div key={key}
                    onClick={() => setSelDay(key)}
                    className={`flex-1 min-w-0 rounded-[5px] cursor-pointer hover:opacity-80 transition-opacity ${isSel ? 'ring-2 ring-accent ring-offset-1 ring-offset-surface' : ''}`}
                    style={{ height: 38, background: `linear-gradient(to bottom, ${c0}, ${c1}, ${c2})` }}
                    title={dd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                );
              })}
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-text-3">{monthCols[0]?.d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              <span className="text-[10px] text-text-3">Today</span>
            </div>
          </>
        )}

        {moodView === 'week' && (
          <div className="flex gap-2">
            {weekCols.map(({ d: dd, key }) => {
              const hm = moods[key] || {};
              const isSel = key === selDay;
              const isT = sameDay(dd, now);
              const c0 = hm.morning?.level ? moodColor(hm.morning.level) : 'var(--surface-2)';
              const c1 = hm.midday?.level  ? moodColor(hm.midday.level)  : 'var(--surface-2)';
              const c2 = hm.evening?.level ? moodColor(hm.evening.level) : 'var(--surface-2)';
              return (
                <div key={key} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10.5px] text-text-3">{DAY_ABBR[dd.getDay()]}</span>
                  <div onClick={() => setSelDay(key)}
                    className={`w-full rounded-[8px] cursor-pointer hover:opacity-80 transition-opacity ${isSel ? 'ring-2 ring-accent ring-offset-1 ring-offset-surface' : ''}`}
                    style={{ height: 64, background: `linear-gradient(to bottom, ${c0}, ${c1}, ${c2})` }}
                    title={dd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                  <span className={`text-[11px] ${isT ? 'font-semibold text-text' : 'text-text-3'}`}>{dd.getDate()}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ---------------- Calendar (Month / Week / Day) ---------------- */
export function CalCard({ viewMonth, setViewMonth, events, calendars, addEvent }) {
  const today = startOfDay(new Date());
  const [view, setView] = useState('month');
  const [selDay, setSelDay] = useState(ymd(today));
  const [weekStart, setWeekStart] = useState(() => { const dow = (today.getDay() + 6) % 7; return addDays(today, -dow); });
  const [addingEvent, setAddingEvent] = useState(false);
  const [evDraft, setEvDraft] = useState({ title: '', date: ymd(today), time: '', calendarId: 'work' });

  const colorOf = (id) => calendars.find((c) => c.id === id)?.color || 'var(--text-3)';
  const eventsOn = (d) => events.filter((e) => sameDay(parseYmd(e.start), d)).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const saveEvent = () => {
    if (!evDraft.title.trim()) return;
    addEvent?.({ ...evDraft });
    setEvDraft({ title: '', date: selDay, time: '', calendarId: 'work' });
    setAddingEvent(false);
  };

  const grid = useMemo(() => {
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const s = (first.getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, i) => addDays(first, i - s));
  }, [viewMonth]);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${addDays(weekStart, 6).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  const viewDayEvents = eventsOn(parseYmd(selDay));
  const viewDayDate = parseYmd(selDay);

  const goDay = (key) => { setSelDay(key); setView('day'); };

  const navLabel = view === 'month'
    ? viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : view === 'week' ? weekLabel
    : viewDayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const navPrev = () => {
    if (view === 'month') setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
    else if (view === 'week') setWeekStart((d) => addDays(d, -7));
    else setSelDay((d) => ymd(addDays(parseYmd(d), -1)));
  };
  const navNext = () => {
    if (view === 'month') setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
    else if (view === 'week') setWeekStart((d) => addDays(d, 7));
    else setSelDay((d) => ymd(addDays(parseYmd(d), 1)));
  };

  return (
    <Card>
      <div className="flex justify-between items-center mb-3">
        <div className="text-[15px] font-semibold tracking-tight">Calendar</div>
        <div className="flex items-center gap-1.5">
          <div className="flex bg-surface-2 rounded-full p-0.5">
            {['month', 'week', 'day'].map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`text-[10.5px] px-2.5 py-[3px] rounded-full capitalize ${view === v ? 'bg-surface text-text font-medium shadow-sm' : 'text-text-3'}`}>
                {v}
              </button>
            ))}
          </div>
          {addEvent && (
            <button onClick={() => { setAddingEvent((v) => !v); setEvDraft((d) => ({ ...d, date: selDay })); }}
              className={`w-7 h-7 grid place-items-center rounded-full transition-colors ${addingEvent ? 'bg-accent text-white' : 'bg-surface-2 text-text-2 hover:text-text'}`}>
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>

      {/* inline add-event form */}
      {addingEvent && (
        <div className="mb-3 p-3 bg-surface-2 rounded-[14px] flex flex-col gap-2">
          <input value={evDraft.title} onChange={(e) => setEvDraft((d) => ({ ...d, title: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && saveEvent()}
            placeholder="Event title" autoFocus
            className="w-full text-[13px] bg-surface rounded-xl px-3 py-2 outline-none border border-stroke" />
          <div className="flex gap-2">
            <input type="date" value={evDraft.date} onChange={(e) => setEvDraft((d) => ({ ...d, date: e.target.value }))}
              className="flex-1 text-[12px] bg-surface rounded-xl px-3 py-2 outline-none border border-stroke" />
            <input type="time" value={evDraft.time} onChange={(e) => setEvDraft((d) => ({ ...d, time: e.target.value }))}
              className="flex-1 text-[12px] bg-surface rounded-xl px-3 py-2 outline-none border border-stroke" />
          </div>
          <select value={evDraft.calendarId} onChange={(e) => setEvDraft((d) => ({ ...d, calendarId: e.target.value }))}
            className="w-full text-[12px] bg-surface rounded-xl px-3 py-2 outline-none border border-stroke">
            {calendars.filter((c) => c.id !== 'google').map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={saveEvent} className="flex-1 bg-accent text-white text-[12px] py-1.5 rounded-full">Add</button>
            <button onClick={() => setAddingEvent(false)} className="flex-1 bg-surface text-text-2 text-[12px] py-1.5 rounded-full border border-stroke">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <button onClick={navPrev} className="w-7 h-7 grid place-items-center text-text-2 hover:text-text hover:bg-surface-2 rounded-full"><ChevronLeft size={15} /></button>
        <span className="text-[13px] text-text-2 text-center">{navLabel}</span>
        <button onClick={navNext} className="w-7 h-7 grid place-items-center text-text-2 hover:text-text hover:bg-surface-2 rounded-full"><ChevronRight size={15} /></button>
      </div>

      {view === 'month' && (
        <>
          <div className="grid grid-cols-7 mb-1.5">{WEEKDAYS.map((w, i) => <span key={i} className="text-center text-[10px] tracking-wide uppercase text-text-3">{w}</span>)}</div>
          <div className="grid grid-cols-7 gap-[3px]">
            {grid.map((d, i) => {
              const out = d.getMonth() !== viewMonth.getMonth(); const key = ymd(d);
              const isToday = sameDay(d, today); const isSel = key === selDay;
              return (
                <div key={i} onClick={() => { setSelDay(key); if (isSel) goDay(key); }}
                  onDoubleClick={() => goDay(key)}
                  className={`aspect-square rounded-[9px] flex flex-col items-center justify-center gap-[3px] cursor-pointer ${isSel ? 'ring-2 ring-accent' : ''} ${isToday && !isSel ? 'ring-2 ring-accent ring-inset' : ''}`}>
                  <span className={`text-[12.5px] ${out ? 'text-text-3' : 'text-text'} ${isToday ? 'font-semibold' : ''}`}>{d.getDate()}</span>
                  <div className="flex gap-0.5 h-[5px]">{eventsOn(d).slice(0, 3).map((e, j) => <span key={j} className="w-1 h-1 rounded-full" style={{ background: colorOf(e.calendarId) }} />)}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-stroke">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[12px] font-medium">{parseYmd(selDay).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              <button onClick={() => goDay(selDay)} className="text-[11px] text-accent-text hover:underline">Day view →</button>
            </div>
            {eventsOn(parseYmd(selDay)).length === 0
              ? <div className="text-xs text-text-3">No events</div>
              : eventsOn(parseYmd(selDay)).map((e) => (
                <div key={e.id} className="flex items-center gap-1.5 text-[12.5px] py-[3px]">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: colorOf(e.calendarId) }} />
                  {e.time && <span className="text-text-2 text-[11px]">{e.time}</span>}
                  <span className="truncate">{e.title}</span>
                </div>
              ))
            }
          </div>
        </>
      )}

      {view === 'week' && (
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((d) => {
            const key = ymd(d); const isToday = sameDay(d, today); const dayEvs = eventsOn(d);
            return (
              <div key={key} className={`flex flex-col rounded-xl overflow-hidden ${isToday ? 'bg-accent-tint' : 'bg-surface-2'}`}>
                <div className="text-center pt-2 pb-1 cursor-pointer" onClick={() => goDay(key)}>
                  <div className="text-[9.5px] uppercase tracking-wide text-text-3">{DAY_ABBR[d.getDay()]}</div>
                  <div className={`text-[14px] leading-none mt-0.5 ${isToday ? 'font-bold text-accent-text' : 'text-text'}`}>{d.getDate()}</div>
                </div>
                <div className="flex flex-col gap-[3px] px-1 pb-2 min-h-[60px]">
                  {dayEvs.slice(0, 5).map((e) => (
                    <div key={e.id} className="rounded-[4px] px-1 py-[2px] text-[9.5px] leading-tight truncate"
                      style={{ background: colorOf(e.calendarId) + '28', borderLeft: `2px solid ${colorOf(e.calendarId)}` }}>
                      {e.time && <span className="opacity-60">{e.time} </span>}{e.title}
                    </div>
                  ))}
                  {dayEvs.length > 5 && <div className="text-[9px] text-text-3 px-0.5">+{dayEvs.length - 5} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'day' && (
        <div className="flex flex-col gap-2">
          {viewDayEvents.length === 0 && <div className="text-sm text-text-3 py-1">No events</div>}
          {viewDayEvents.map((e) => {
            const [h, m] = (e.time || '').split(':').map(Number);
            const hh = ((h + 11) % 12) + 1; const ap = h < 12 ? 'AM' : 'PM';
            return (
              <div key={e.id} className="flex gap-3 items-stretch min-h-[36px]">
                <div className="text-[10.5px] text-text-3 w-12 shrink-0 pt-1">{e.time ? `${hh}:${String(m).padStart(2,'0')} ${ap}` : ''}</div>
                <div className="w-0.5 bg-stroke shrink-0 rounded" />
                <div className="flex-1 pb-2">
                  <div className="rounded-xl px-3 py-2" style={{ borderLeft: `3px solid ${colorOf(e.calendarId)}`, background: colorOf(e.calendarId) + '18' }}>
                    <div className="text-[13px] font-medium">{e.title}</div>
                    {e.loc && <div className="text-[11px] text-text-2 mt-0.5">{e.loc}</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ---------------- Task History (dot grid + log) ---------------- */
export function TaskHistory({ tasks, now }) {
  const [view, setView] = useState('dots');

  const completed = useMemo(() =>
    tasks.filter((t) => (t.state || 0) === 2 && (t.completedAt || t.date)),
    [tasks]
  );

  const activityMap = useMemo(() => {
    const map = {};
    completed.forEach((t) => {
      const k = t.completedAt || t.date;
      if (k) map[k] = (map[k] || 0) + 1;
    });
    return map;
  }, [completed]);

  // Build 16-week grid (Mon–Sun columns)
  const weeks = useMemo(() => {
    const today = startOfDay(now);
    const dow = (today.getDay() + 6) % 7; // 0=Mon
    const gridStart = addDays(today, -(15 * 7 + dow));
    const result = [];
    for (let w = 0; w < 16; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const dd = addDays(gridStart, w * 7 + d);
        const key = ymd(dd);
        week.push({ d: dd, key, count: activityMap[key] || 0 });
      }
      result.push(week);
    }
    return result;
  }, [activityMap, now]);

  // Bar chart data — last 30 days
  const barData = useMemo(() => {
    const arr = [];
    for (let i = 29; i >= 0; i--) {
      const dd = addDays(startOfDay(now), -i);
      const k = ymd(dd);
      arr.push({ key: k, d: dd, count: activityMap[k] || 0 });
    }
    return arr;
  }, [activityMap, now]);
  const maxBar = Math.max(1, ...barData.map((b) => b.count));

  // Log: recent completed tasks grouped by date
  const logGroups = useMemo(() => {
    const byDate = {};
    [...completed].reverse().forEach((t) => {
      const k = t.completedAt || t.date;
      if (!byDate[k]) byDate[k] = [];
      byDate[k].push(t);
    });
    return Object.entries(byDate).sort(([a], [b]) => b.localeCompare(a)).slice(0, 7);
  }, [completed]);

  const dotStyle = (count) => count > 0
    ? { background: 'var(--accent)', opacity: Math.min(0.28 + (count - 1) * 0.24, 1) }
    : { background: 'var(--surface-2)', opacity: 1 };

  return (
    <Card>
      <Head title="Task history" right={
        <div className="flex bg-surface-2 rounded-full p-0.5">
          {[['dots', 'Activity'], ['chart', 'Chart'], ['log', 'Log']].map(([v, label]) => (
            <button key={v} onClick={() => setView(v)}
              className={`text-[10.5px] px-2.5 py-[3px] rounded-full ${view === v ? 'bg-surface text-text font-medium shadow-sm' : 'text-text-3'}`}>
              {label}
            </button>
          ))}
        </div>
      } />

      {/* Obsidian-style dot grid */}
      {view === 'dots' && (
        <div>
          <div className="flex gap-[3px] overflow-x-auto pb-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px] shrink-0">
                {week.map(({ key, count, d }) => (
                  <div key={key}
                    title={`${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${count} task${count !== 1 ? 's' : ''} done`}
                    className="w-[11px] h-[11px] rounded-[2.5px] hover:opacity-60 cursor-default transition-opacity"
                    style={dotStyle(count)} />
                ))}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-text-3">16 weeks ago</span>
            <span className="text-[10px] text-text-3">Today</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-[10px] text-text-3">Less</span>
            {[0, 1, 2, 3, 4].map((v) => (
              <div key={v} className="w-[10px] h-[10px] rounded-[2px]" style={dotStyle(v)} />
            ))}
            <span className="text-[10px] text-text-3">More</span>
          </div>
        </div>
      )}

      {/* Bar chart */}
      {view === 'chart' && (
        <div>
          <div className="flex items-end gap-[2px] h-24">
            {barData.map(({ key, count, d }) => (
              <div key={key} className="flex-1 flex flex-col justify-end"
                title={`${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${count}`}>
                <div className="rounded-t-[2px] transition-all"
                  style={{
                    height: count ? `${Math.round((count / maxBar) * 88) + 4}px` : '3px',
                    background: count ? 'var(--accent)' : 'var(--surface-2)',
                    opacity: count ? 1 : 0.5,
                  }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-text-3">30 days ago</span>
            <span className="text-[10px] text-text-3">Today</span>
          </div>
        </div>
      )}

      {/* Log list */}
      {view === 'log' && (
        <div className="flex flex-col gap-3 max-h-56 overflow-y-auto pr-1">
          {logGroups.length === 0 && <div className="text-[13px] text-text-3">No completed tasks yet</div>}
          {logGroups.map(([date, ts]) => (
            <div key={date}>
              <div className="text-[11px] text-text-2 mb-1.5 font-medium">
                {parseYmd(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
              {ts.map((t) => (
                <div key={t.id} className="flex items-center gap-2 py-[3px]">
                  <Check size={11} className="shrink-0" style={{ color: 'var(--accent)' }} />
                  <span className="text-[13px] text-text-2 line-through leading-snug">{t.title}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ---------------- Weekly lunch menu ---------------- */
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function LunchMenu({ lunchMenu, setLunchMenu, now }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState('');

  const monday = useMemo(() => {
    const today = startOfDay(now);
    const dow = (today.getDay() + 6) % 7; // 0 = Mon
    return addDays(today, -dow + weekOffset * 7);
  }, [now, weekOffset]);

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(monday, i)),
    [monday]
  );

  const weekLabel = `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${addDays(monday, 6).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  const startEdit = (key, current) => { setEditing(key); setDraft(current || ''); };
  const saveEdit = () => {
    if (!editing) return;
    setLunchMenu((m) => draft.trim() ? { ...(m || {}), [editing]: draft.trim() } : (() => { const n = { ...(m || {}) }; delete n[editing]; return n; })());
    setEditing(null); setDraft('');
  };
  const clearDay = (key) => setLunchMenu((m) => { const n = { ...(m || {}) }; delete n[key]; return n; });

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <div className="text-[15px] font-semibold tracking-tight">Weekly menu</div>
        <div className="flex items-center gap-1">
          <button onClick={() => setWeekOffset((v) => v - 1)}
            className="w-6 h-6 grid place-items-center text-text-2 hover:text-text hover:bg-surface-2 rounded-full">
            <ChevronLeft size={13} />
          </button>
          <button onClick={() => setWeekOffset(0)}
            className="text-[11px] text-text-2 hover:text-text min-w-[80px] text-center transition-colors">
            {weekOffset === 0 ? 'This week' : weekLabel}
          </button>
          <button onClick={() => setWeekOffset((v) => v + 1)}
            className="w-6 h-6 grid place-items-center text-text-2 hover:text-text hover:bg-surface-2 rounded-full">
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        {weekDays.map((d, i) => {
          const key = ymd(d);
          const meal = (lunchMenu || {})[key] || '';
          const isToday = sameDay(d, now);
          const isPast = startOfDay(d) < startOfDay(now);
          const isEdit = editing === key;

          return (
            <div key={key}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors
                ${isToday ? 'bg-accent-tint' : 'hover:bg-surface-2'}`}>
              <div className="w-8 shrink-0 text-center">
                <div className={`text-[10px] uppercase tracking-wide leading-none
                  ${isToday ? 'text-accent-text font-semibold' : 'text-text-3'}`}>
                  {WEEK_DAYS[i]}
                </div>
                <div className={`text-[14px] font-medium leading-tight mt-0.5
                  ${isToday ? 'text-accent-text' : isPast ? 'text-text-3' : 'text-text'}`}>
                  {d.getDate()}
                </div>
              </div>

              <div className="w-px h-7 bg-stroke shrink-0" />

              {isEdit ? (
                <input autoFocus value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') saveEdit(); }}
                  onBlur={saveEdit}
                  placeholder="What's for lunch?"
                  className="flex-1 text-[13px] bg-transparent outline-none" />
              ) : (
                <button onClick={() => startEdit(key, meal)}
                  className={`flex-1 text-left text-[13px] transition-colors
                    ${meal ? (isPast ? 'text-text-2' : 'text-text') : 'text-text-3'}`}>
                  {meal || <span className="italic">Add meal…</span>}
                </button>
              )}

              {meal && !isEdit && (
                <button onClick={() => clearDay(key)}
                  className="opacity-0 group-hover:opacity-100 text-text-3 hover:text-[#c0564b] transition-all p-0.5 shrink-0">
                  <X size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------------- Daily doodle (canvas) ---------------- */
const DOODLE_COLORS = ['#3D5A40', '#5A7D9A', '#8B5A80', '#E3B95E', '#D06B6B', '#141414', '#FFFFFF'];

export function Doodle({ doodles, setDoodles, now }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef(null);
  const [color, setColor] = useState(DOODLE_COLORS[0]);
  const [size, setSize] = useState(4);
  const [erasing, setErasing] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const today = ymd(now);

  // Load today's doodle when date changes or gallery closes (canvas remounts)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (doodles?.[today]) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = doodles[today];
    }
  }, [today, showGallery]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * sx, y: (clientY - rect.top) * sy };
  };

  const startDraw = (e) => {
    e.preventDefault();
    drawing.current = true;
    lastPos.current = getPos(e);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = erasing ? 'rgba(0,0,0,1)' : color;
    ctx.lineWidth = erasing ? size * 4 : size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = erasing ? 'destination-out' : 'source-over';
    ctx.stroke();
    lastPos.current = pos;
  };

  const endDraw = (e) => {
    if (!drawing.current) return;
    drawing.current = false;
    lastPos.current = null;
    const canvas = canvasRef.current;
    setDoodles((d) => ({ ...(d || {}), [today]: canvas.toDataURL('image/png') }));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDoodles((d) => { const nd = { ...(d || {}) }; delete nd[today]; return nd; });
  };

  // Past doodles (last 7 days with content)
  const pastDoodles = useMemo(() => {
    if (!doodles) return [];
    return Object.entries(doodles)
      .filter(([k]) => k !== today)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 6);
  }, [doodles, today]);

  return (
    <Card>
      <Head title="Daily doodle" right={
        <div className="flex items-center gap-1.5">
          {pastDoodles.length > 0 && (
            <button onClick={() => setShowGallery((v) => !v)}
              className={`text-[11.5px] px-3 py-[5px] rounded-full ${showGallery ? 'bg-accent-tint text-accent-text' : 'bg-surface-2 text-text-2 hover:text-text'}`}>
              Past
            </button>
          )}
          <button onClick={clear} className="text-[11.5px] text-text-2 hover:text-[#c0564b] px-3 py-[5px] rounded-full hover:bg-surface-2">Clear</button>
        </div>
      } />

      {showGallery ? (
        <div>
          <div className="grid grid-cols-3 gap-2">
            {pastDoodles.map(([k, src]) => (
              <div key={k} className="relative group cursor-pointer" onClick={() => setShowGallery(false)}>
                <img src={src} alt={k} className="w-full rounded-xl border border-stroke" style={{ background: 'var(--surface-2)', aspectRatio: '2/1', objectFit: 'contain' }} />
                <div className="absolute bottom-1 left-1 right-1 text-center text-[9px] text-text-3">
                  {parseYmd(k).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setShowGallery(false)} className="mt-3 text-[12px] text-text-2 hover:text-text">← Back to today</button>
        </div>
      ) : (
        <>
          {/* color + size toolbar */}
          <div className="flex items-center gap-2 mb-3">
            {DOODLE_COLORS.map((c) => (
              <button key={c} onClick={() => { setColor(c); setErasing(false); }}
                className={`w-5 h-5 rounded-full border-2 shrink-0 transition-transform hover:scale-110 ${color === c && !erasing ? 'border-text scale-110' : 'border-transparent'}`}
                style={{ background: c }} />
            ))}
            <div className="flex-1 flex items-center gap-1.5 ml-1">
              <input type="range" min={2} max={18} value={size} onChange={(e) => setSize(+e.target.value)}
                className="flex-1 accent-[var(--accent)]" />
              <button onClick={() => { setErasing((v) => !v); }}
                className={`text-[11px] px-2.5 py-[3px] rounded-full border shrink-0 ${erasing ? 'bg-accent text-white border-accent' : 'border-stroke text-text-2 hover:text-text'}`}>
                Erase
              </button>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            width={520} height={260}
            className="w-full rounded-xl touch-none"
            style={{ background: 'var(--surface-2)', cursor: erasing ? 'cell' : 'crosshair' }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
          />

          <div className="mt-2 text-[11px] text-text-3 text-center">
            {parseYmd(today).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </>
      )}
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────
   Focus Timer (Pomodoro) — slot-drum redesign
───────────────────────────────────────────────────────────── */

const FD = { H: 116, FS: 100 };

function FocusResetIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
    </svg>
  );
}
function FocusPlayIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
function FocusPauseIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="6" y1="4" x2="6" y2="20" />
      <line x1="18" y1="4" x2="18" y2="20" />
    </svg>
  );
}
function FocusSkipIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="5,3 11,8 5,13" />
    </svg>
  );
}

function FlipDigit({ value }) {
  const [shown, setShown] = useState(value);
  const [anim, setAnim]   = useState(null);
  const t1 = useRef(null);
  const t2 = useRef(null);

  useEffect(() => {
    if (value === shown) return;
    clearTimeout(t1.current); clearTimeout(t2.current);
    const next = value;
    setAnim('out');
    t1.current = setTimeout(() => {
      setShown(next);
      setAnim('in');
      t2.current = setTimeout(() => setAnim(null), 240);
    }, 190);
    return () => { clearTimeout(t1.current); clearTimeout(t2.current); };
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      height: FD.H,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, userSelect: 'none',
      maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
      WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
    }}>
      <span style={{
        fontSize: FD.FS, fontWeight: 900,
        color: 'var(--text)',
        fontVariantNumeric: 'tabular-nums',
        fontFeatureSettings: '"tnum"',
        letterSpacing: '-0.03em',
        lineHeight: 1,
        animation: anim === 'out' ? 'focus-digit-out 0.19s ease-in forwards'
                 : anim === 'in'  ? 'focus-digit-in 0.24s ease-out forwards'
                 : 'none',
      }}>
        {shown}
      </span>
    </div>
  );
}

export function FocusTile({ pomodoroLog = [], onLogSession }) {
  const [workMins, setWorkMins]   = useState(25);
  const [breakMins, setBreakMins] = useState(5);
  const [mode, setMode]           = useState('work');
  const [secsLeft, setSecsLeft]   = useState(25 * 60);
  const [running, setRunning]     = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const totalSecs = mode === 'work' ? workMins * 60 : breakMins * 60;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (secsLeft > 0 || !running) return;
    setRunning(false);
    if (mode === 'work') {
      onLogSession?.();
      setMode('break');
      setSecsLeft(breakMins * 60);
    } else {
      setMode('work');
      setSecsLeft(workMins * 60);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secsLeft]);

  const changeWork  = (v) => { setWorkMins(v);  if (mode === 'work')  { setRunning(false); setSecsLeft(v * 60); } };
  const changeBreak = (v) => { setBreakMins(v); if (mode === 'break') { setRunning(false); setSecsLeft(v * 60); } };
  const toggle = () => setRunning((r) => !r);
  const reset  = () => { setRunning(false); setSecsLeft(totalSecs); };
  const skip   = () => {
    setRunning(false);
    const next = mode === 'work' ? 'break' : 'work';
    setMode(next);
    setSecsLeft(next === 'work' ? workMins * 60 : breakMins * 60);
  };

  const mm = String(Math.floor(secsLeft / 60)).padStart(2, '0');
  const ss = String(secsLeft % 60).padStart(2, '0');
  const today = ymd(new Date());
  const todaySessions = pomodoroLog.filter((l) => l.date === today).length;

  return (
    <Card>
      <Head title="Focus" right={
        <button onClick={() => setShowSettings((s) => !s)}
          className="text-[11px] text-text-3 hover:text-text transition-colors">
          {showSettings ? 'Done' : 'Settings'}
        </button>
      } />

      {showSettings ? (
        <div className="flex flex-col gap-4 py-2">
          {[
            ['Work', workMins, changeWork, 5, 90, 5],
            ['Break', breakMins, changeBreak, 1, 30, 1],
          ].map(([label, val, setter, min, max, step]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[13px] text-text-2">{label}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setter(Math.max(min, val - step))}
                  className="w-7 h-7 rounded-full bg-surface-2 border border-stroke text-text-2 hover:text-text flex items-center justify-center text-sm transition-colors">−</button>
                <span className="text-[13px] w-10 text-center tabular-nums">{val}m</span>
                <button onClick={() => setter(Math.min(max, val + step))}
                  className="w-7 h-7 rounded-full bg-surface-2 border border-stroke text-text-2 hover:text-text flex items-center justify-center text-sm transition-colors">+</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* digit display */}
          <div className="flex items-center justify-center mb-5">
            <FlipDigit value={mm[0]} />
            <FlipDigit value={mm[1]} />
            <div className="flex flex-col mx-3" style={{ gap: 11, alignSelf: 'center' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-3)' }} />
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-3)' }} />
            </div>
            <FlipDigit value={ss[0]} />
            <FlipDigit value={ss[1]} />
          </div>

          {/* controls */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <button onClick={reset}
              className="w-9 h-9 rounded-full border border-stroke text-text-3 hover:text-text grid place-items-center transition-colors">
              <FocusResetIcon size={15} />
            </button>
            <button onClick={toggle}
              className="w-12 h-12 rounded-full bg-text text-canvas grid place-items-center hover:opacity-80 transition-opacity">
              {running ? <FocusPauseIcon size={16} /> : <FocusPlayIcon size={16} />}
            </button>
            <button onClick={skip}
              className="w-9 h-9 rounded-full border border-stroke text-text-3 hover:text-text grid place-items-center transition-colors">
              <FocusSkipIcon size={15} />
            </button>
          </div>

          {/* session dots */}
          <div className="flex items-center justify-center gap-1.5">
            {Array.from({ length: Math.max(4, todaySessions + 1) }, (_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full"
                style={{ background: i < todaySessions ? 'var(--accent)' : 'var(--stroke)' }} />
            ))}
            {todaySessions > 0 && (
              <span className="text-[11px] text-text-3 ml-1">
                {todaySessions} session{todaySessions !== 1 ? 's' : ''} today
              </span>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────
   Project Tracker
───────────────────────────────────────────────────────────── */
const PRJ_COLORS = ['#5A7D9A', '#3D5A40', '#8B5A80', '#C4874A', '#7A9D6F', '#9A5A5A', '#5A6E9A', '#A08060'];

export function ProjectsTile({ projects = [], onAdd, onUpdate, onDelete }) {
  const [expandedId, setExpandedId] = useState(null);
  const [addingProject, setAddingProject] = useState(false);
  const [projDraft, setProjDraft] = useState('');
  const [projColor, setProjColor] = useState(PRJ_COLORS[0]);
  const [taskDrafts, setTaskDrafts] = useState({});

  const submitProject = () => {
    if (!projDraft.trim()) return;
    onAdd({ id: Date.now().toString(), name: projDraft.trim(), color: projColor, status: 'active', tasks: [] });
    setProjDraft('');
    setProjColor(PRJ_COLORS[0]);
    setAddingProject(false);
  };

  const addTask = (pId) => {
    const text = (taskDrafts[pId] || '').trim();
    if (!text) return;
    const p = projects.find((x) => x.id === pId);
    if (!p) return;
    onUpdate(pId, { tasks: [...p.tasks, { id: Date.now().toString(), text, done: false }] });
    setTaskDrafts((d) => ({ ...d, [pId]: '' }));
  };

  const toggleTask = (pId, tId) => {
    const p = projects.find((x) => x.id === pId);
    if (!p) return;
    onUpdate(pId, { tasks: p.tasks.map((t) => t.id === tId ? { ...t, done: !t.done } : t) });
  };

  const removeTask = (pId, tId) => {
    const p = projects.find((x) => x.id === pId);
    if (!p) return;
    onUpdate(pId, { tasks: p.tasks.filter((t) => t.id !== tId) });
  };

  const cycleStatus = (p, e) => {
    e.stopPropagation();
    const order = ['active', 'paused', 'done'];
    onUpdate(p.id, { status: order[(order.indexOf(p.status) + 1) % order.length] });
  };

  return (
    <Card>
      <Head title="Projects" right={
        <button onClick={() => setAddingProject((a) => !a)}
          className="w-6 h-6 rounded-full bg-surface-2 border border-stroke flex items-center justify-center text-text-2 hover:text-text transition-colors">
          <Plus size={11} />
        </button>
      } />

      {addingProject && (
        <div className="flex flex-col gap-2 mb-4">
          <input autoFocus value={projDraft} onChange={(e) => setProjDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitProject(); if (e.key === 'Escape') setAddingProject(false); }}
            placeholder="Project name…"
            className="w-full text-sm bg-surface-2 border border-stroke rounded-xl px-3 py-2 outline-none placeholder:text-text-3" />
          <div className="flex items-center gap-1.5 flex-wrap">
            {PRJ_COLORS.map((c) => (
              <button key={c} onClick={() => setProjColor(c)}
                className="w-5 h-5 rounded-full transition-transform hover:scale-110 shrink-0"
                style={{ background: c, outline: projColor === c ? '2px solid var(--text)' : 'none', outlineOffset: 2 }} />
            ))}
          </div>
          <button onClick={submitProject}
            className="w-full py-2 bg-text text-canvas rounded-xl text-[12px] font-medium">Add project</button>
        </div>
      )}

      <div className="flex flex-col gap-0.5">
        {projects.length === 0 && <div className="text-[13px] text-text-3 py-1">No projects yet</div>}

        {projects.map((p) => {
          const done  = p.tasks.filter((t) => t.done).length;
          const total = p.tasks.length;
          const pct   = total === 0 ? 0 : Math.round((done / total) * 100);
          // null = all expanded · p.id = only this one focused
          const isFocused = expandedId === p.id;
          const showTasks = expandedId === null ? p.tasks.length > 0 : isFocused;

          return (
            <div key={p.id} className="border-b border-stroke/50 last:border-0 pb-2 mb-1 last:pb-0 last:mb-0">
              <div className="group flex items-center gap-2.5 py-1.5 cursor-pointer"
                onClick={() => setExpandedId(isFocused ? null : p.id)}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                <span className="flex-1 text-[13px] font-medium text-text truncate">{p.name}</span>
                <button onClick={(e) => cycleStatus(p, e)}
                  className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                    p.status === 'done'   ? 'bg-surface-2 text-text-3' :
                    p.status === 'paused' ? 'bg-surface-2 text-text-2' :
                    'bg-accent-tint text-accent-text'}`}>
                  {p.status === 'active' ? 'Active' : p.status === 'done' ? 'Done' : 'Paused'}
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}
                  className="opacity-0 group-hover:opacity-100 text-text-3 hover:text-red-400 transition-all p-0.5">
                  <Trash2 size={12} />
                </button>
              </div>

              {total > 0 && (
                <div className="flex items-center gap-2 mb-1 pl-[18px]">
                  <div className="flex-1 h-[3px] rounded-full bg-surface-3">
                    <div className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, background: p.color }} />
                  </div>
                  <span className="text-[10px] text-text-3 w-7 text-right tabular-nums">{pct}%</span>
                </div>
              )}

              {/* task list — always rendered, height animated */}
              <div className="collapsible" style={{ maxHeight: (expandedId === null || isFocused) ? 600 : 0, opacity: (expandedId === null || isFocused) ? 1 : 0 }}>
                {p.tasks.length > 0 && (
                  <div className="pl-[18px] flex flex-col gap-1 mt-1.5 pb-0.5">
                    {p.tasks.map((t) => (
                      <div key={t.id} className="group/task flex items-center gap-2 py-0.5">
                        <button onClick={() => toggleTask(p.id, t.id)}
                          className="w-4 h-4 rounded-[4px] border shrink-0 flex items-center justify-center transition-colors"
                          style={{ background: t.done ? p.color : 'transparent', borderColor: t.done ? p.color : 'var(--stroke)' }}>
                          {t.done && <Check size={9} className="text-canvas" />}
                        </button>
                        <span className={`flex-1 text-[12px] leading-tight ${t.done ? 'line-through text-text-3' : 'text-text-2'}`}>
                          {t.text}
                        </span>
                        <button onClick={() => removeTask(p.id, t.id)}
                          className="opacity-0 group-hover/task:opacity-100 text-text-3 hover:text-red-400 transition-all p-0.5">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    {isFocused && (
                      <div className="flex gap-1.5 mt-1">
                        <input value={taskDrafts[p.id] || ''}
                          onChange={(e) => setTaskDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && addTask(p.id)}
                          placeholder="Add task…"
                          className="flex-1 text-[12px] bg-surface-2 border border-stroke rounded-lg px-2.5 py-1.5 outline-none placeholder:text-text-3" />
                        <button onClick={() => addTask(p.id)}
                          className="w-7 h-7 rounded-lg bg-text text-canvas flex items-center justify-center">
                          <Plus size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {p.tasks.length === 0 && isFocused && (
                  <div className="pl-[18px] flex flex-col gap-1 mt-1.5 pb-0.5">
                    <div className="text-[12px] text-text-3 italic py-0.5">No tasks yet</div>
                    <div className="flex gap-1.5 mt-1">
                      <input value={taskDrafts[p.id] || ''}
                        onChange={(e) => setTaskDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && addTask(p.id)}
                        placeholder="Add task…"
                        className="flex-1 text-[12px] bg-surface-2 border border-stroke rounded-lg px-2.5 py-1.5 outline-none placeholder:text-text-3" />
                      <button onClick={() => addTask(p.id)}
                        className="w-7 h-7 rounded-lg bg-text text-canvas flex items-center justify-center">
                        <Plus size={11} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────
   Book Tracker
───────────────────────────────────────────────────────────── */
const BOOK_COLORS = ['#5A7D9A', '#3D5A40', '#8B5A80', '#C4874A', '#7A9D6F', '#9A5A5A'];

export function BooksTile({ books = { current: null, completed: [] }, onSet, onUpdate, onComplete, onDeleteCompleted }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', author: '', totalPages: '', color: BOOK_COLORS[0] });

  const submitBook = () => {
    if (!form.title.trim()) return;
    onSet({ ...form, totalPages: parseInt(form.totalPages) || 100, currentPage: 0, started: ymd(new Date()) });
    setAdding(false);
    setForm({ title: '', author: '', totalPages: '', color: BOOK_COLORS[0] });
  };

  const { current, completed = [] } = books;
  const pct = current ? Math.round((current.currentPage / Math.max(1, current.totalPages)) * 100) : 0;

  return (
    <Card>
      <Head title="Books" right={
        !current && !adding && (
          <button onClick={() => setAdding(true)}
            className="w-6 h-6 rounded-full bg-surface-2 border border-stroke flex items-center justify-center text-text-2 hover:text-text transition-colors">
            <Plus size={11} />
          </button>
        )
      } />

      {current ? (
        <div className="mb-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-11 rounded-md shrink-0 shadow-sm" style={{ background: current.color }} />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-text leading-tight">{current.title}</div>
              {current.author && <div className="text-[12px] text-text-3 mt-0.5">{current.author}</div>}
            </div>
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            <input type="range" min={0} max={current.totalPages} value={current.currentPage}
              onChange={(e) => onUpdate(parseInt(e.target.value))}
              className="flex-1" style={{ accentColor: current.color }} />
            <span className="text-[11px] text-text-3 tabular-nums w-8 text-right">{pct}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-3">p.{current.currentPage} / {current.totalPages}</span>
            <button onClick={onComplete}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-surface-2 border border-stroke text-text-2 hover:text-text transition-colors">
              Mark done ✓
            </button>
          </div>
        </div>
      ) : adding ? (
        <div className="flex flex-col gap-2.5 mb-4">
          <input autoFocus value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Title" className="text-sm bg-surface-2 border border-stroke rounded-xl px-3 py-2 outline-none placeholder:text-text-3" />
          <input value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
            placeholder="Author" className="text-sm bg-surface-2 border border-stroke rounded-xl px-3 py-2 outline-none placeholder:text-text-3" />
          <input type="number" value={form.totalPages} onChange={(e) => setForm((f) => ({ ...f, totalPages: e.target.value }))}
            placeholder="Pages" className="text-sm bg-surface-2 border border-stroke rounded-xl px-3 py-2 outline-none placeholder:text-text-3" />
          <div className="flex gap-1.5 items-center">
            <span className="text-[11px] text-text-3">Color</span>
            {BOOK_COLORS.map((c) => (
              <button key={c} onClick={() => setForm((f) => ({ ...f, color: c }))}
                className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                style={{ background: c, outline: form.color === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)}
              className="flex-1 py-2 rounded-xl border border-stroke text-text-2 text-[13px] hover:bg-surface-2 transition-colors">Cancel</button>
            <button onClick={submitBook}
              className="flex-1 py-2 rounded-xl bg-text text-canvas text-[13px] font-medium hover:opacity-75 transition-opacity">Add</button>
          </div>
        </div>
      ) : (
        <div className="text-[13px] text-text-3 py-1 mb-3">No book in progress</div>
      )}

      {completed.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-text-3 mb-2">
            {completed.length} read this year
          </div>
          <div className="flex flex-wrap gap-1.5">
            {completed.map((b, i) => (
              <div key={i} className="group relative w-8 h-11 rounded-md shadow-sm cursor-default"
                style={{ background: b.color }} title={b.title}>
                <button onClick={() => onDeleteCompleted(i)}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-surface border border-stroke opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <X size={7} className="text-text-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────
   Next Trip
───────────────────────────────────────────────────────────── */
export function TripTile({ trip, onSet, onUpdate, onClear }) {
  const [setting, setSetting] = useState(false);
  const [form, setForm] = useState({ destination: '', date: '' });
  const [itemDraft, setItemDraft] = useState('');

  const daysLeft = trip
    ? Math.max(0, Math.ceil((parseYmd(trip.date) - new Date()) / 86400000))
    : null;

  const submitTrip = () => {
    if (!form.destination.trim() || !form.date) return;
    onSet({ ...form, checklist: [] });
    setSetting(false);
  };

  const addItem = () => {
    if (!itemDraft.trim()) return;
    onUpdate({ checklist: [...(trip.checklist || []), { id: Date.now().toString(), text: itemDraft.trim(), done: false }] });
    setItemDraft('');
  };

  const toggleItem = (id) => onUpdate({ checklist: trip.checklist.map((t) => t.id === id ? { ...t, done: !t.done } : t) });
  const removeItem = (id) => onUpdate({ checklist: trip.checklist.filter((t) => t.id !== id) });

  if (!trip || setting) {
    return (
      <Card>
        <Head title="Next trip" right={
          trip && setting && (
            <button onClick={() => setSetting(false)} className="text-text-3 hover:text-text transition-colors text-[11px]">Cancel</button>
          )
        } />
        {setting ? (
          <div className="flex flex-col gap-2.5">
            <input autoFocus value={form.destination} onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
              placeholder="Destination" className="text-sm bg-surface-2 border border-stroke rounded-xl px-3 py-2 outline-none placeholder:text-text-3" />
            <DatePicker value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} />
            <button onClick={submitTrip}
              className="w-full py-2.5 rounded-xl bg-text text-canvas text-[13px] font-medium hover:opacity-75 transition-opacity">
              Set trip
            </button>
          </div>
        ) : (
          <button onClick={() => setSetting(true)}
            className="flex items-center gap-1.5 text-[13px] text-text-3 hover:text-text transition-colors">
            <Plus size={13} /> Plan a trip
          </button>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <Head title="Next trip" right={
        <div className="flex items-center gap-2">
          <button onClick={() => { setForm({ destination: trip.destination, date: trip.date }); setSetting(true); }}
            className="text-[11px] text-text-3 hover:text-text transition-colors">Edit</button>
          <button onClick={onClear} className="text-text-3 hover:text-text transition-colors">
            <X size={13} />
          </button>
        </div>
      } />

      <div className="mb-4">
        <div className="text-[22px] font-semibold tracking-tight text-text leading-tight mb-1">
          {trip.destination}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[44px] font-semibold text-text leading-none tabular-nums">{daysLeft}</span>
          <span className="text-[14px] text-text-3 mb-1">{daysLeft === 1 ? 'day' : 'days'} to go</span>
        </div>
        <div className="text-[12px] text-text-3">
          {parseYmd(trip.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      <div className="flex flex-col gap-0.5 mb-3">
        {(trip.checklist || []).map((t) => (
          <div key={t.id} className="group flex items-center gap-2 py-1">
            <button onClick={() => toggleItem(t.id)}
              className="w-4 h-4 rounded-[4px] border shrink-0 flex items-center justify-center transition-colors"
              style={{ background: t.done ? 'var(--accent)' : 'transparent', borderColor: t.done ? 'var(--accent)' : 'var(--stroke)' }}>
              {t.done && <Check size={9} className="text-canvas" />}
            </button>
            <span className={`flex-1 text-[13px] ${t.done ? 'line-through text-text-3' : 'text-text'}`}>{t.text}</span>
            <button onClick={() => removeItem(t.id)}
              className="opacity-0 group-hover:opacity-100 text-text-3 hover:text-red-400 transition-all p-0.5">
              <X size={11} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5">
        <input value={itemDraft} onChange={(e) => setItemDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder="Add to list…"
          className="flex-1 text-sm bg-surface-2 border border-stroke rounded-xl px-3 py-2 outline-none placeholder:text-text-3" />
        <button onClick={addItem}
          className="w-9 h-9 rounded-xl bg-text text-canvas flex items-center justify-center shrink-0">
          <Plus size={13} />
        </button>
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────
   World Clock
───────────────────────────────────────────────────────────── */
const COMMON_TZS = [
  ['Europe/Madrid',        'Madrid'],
  ['America/New_York',     'New York'],
  ['America/Los_Angeles',  'Los Angeles'],
  ['America/Chicago',      'Chicago'],
  ['Europe/London',        'London'],
  ['Europe/Paris',         'Paris'],
  ['Asia/Tokyo',           'Tokyo'],
  ['Asia/Shanghai',        'Shanghai'],
  ['Australia/Sydney',     'Sydney'],
  ['America/Sao_Paulo',    'São Paulo'],
  ['Asia/Dubai',           'Dubai'],
  ['Asia/Kolkata',         'Mumbai'],
];

function formatTime(tz) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date());
  } catch { return '--:--'; }
}

function formatOffset(tz) {
  try {
    const s = new Intl.DateTimeFormat('en', {
      timeZone: tz, timeZoneName: 'shortOffset',
    }).formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value ?? '';
    return s.replace('GMT', 'UTC');
  } catch { return ''; }
}

function getTzParts(tz) {
  try {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: tz, hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false,
    }).formatToParts(new Date());
    const get = (t) => +parts.find((p) => p.type === t)?.value || 0;
    return { h: get('hour') % 12, m: get('minute'), s: get('second') };
  } catch { return { h: 0, m: 0, s: 0 }; }
}

/* Analog clock SVG face */
function AnalogFace({ clock, size = 220 }) {
  const { h, m, s } = getTzParts(clock?.tz ?? 'UTC');
  const cx = size / 2, cy = size / 2, r = size / 2 - 6;
  const deg = (angle) => (angle - 90) * (Math.PI / 180);
  const pt  = (angle, len) => ({
    x: cx + len * Math.cos(deg(angle)),
    y: cy + len * Math.sin(deg(angle)),
  });

  const secDeg = s * 6;
  const minDeg = m * 6 + s * 0.1;
  const hrDeg  = h * 30 + m * 0.5;

  const minEnd = pt(minDeg, r * 0.68);
  const hrEnd  = pt(hrDeg,  r * 0.48);
  const secEnd = pt(secDeg, r * 0.76);
  const secTail = pt(secDeg + 180, r * 0.14);

  const ticks = Array.from({ length: 60 }, (_, i) => {
    const a = i * 6;
    const isHour = i % 5 === 0;
    const outer = r + 2;
    const inner = isHour ? r - 10 : r - 5;
    return { p1: pt(a, inner), p2: pt(a, outer), isHour };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      {/* Face */}
      <circle cx={cx} cy={cy} r={r + 4} fill="var(--surface)" />
      {/* Ticks */}
      {ticks.map((t, i) => (
        <line key={i} x1={t.p1.x} y1={t.p1.y} x2={t.p2.x} y2={t.p2.y}
          stroke="var(--text)" strokeOpacity={t.isHour ? 0.22 : 0.1}
          strokeWidth={t.isHour ? 1.5 : 0.8} strokeLinecap="round" />
      ))}
      {/* Hour hand */}
      <line x1={cx} y1={cy} x2={hrEnd.x} y2={hrEnd.y}
        stroke="var(--text)" strokeWidth={2.8} strokeLinecap="round" />
      {/* Minute hand */}
      <line x1={cx} y1={cy} x2={minEnd.x} y2={minEnd.y}
        stroke="var(--text)" strokeWidth={1.5} strokeLinecap="round" strokeOpacity={0.85} />
      {/* Second hand */}
      <line x1={secTail.x} y1={secTail.y} x2={secEnd.x} y2={secEnd.y}
        stroke="#c0564b" strokeWidth={0.9} strokeLinecap="round" />
      {/* Center */}
      <circle cx={cx} cy={cy} r={3.5} fill="var(--text)" />
      <circle cx={cx} cy={cy} r={1.8} fill="#c0564b" />
    </svg>
  );
}

/* Orb clock — warm gradient blob with subtle hands */
function OrbFace({ clock, size = 260 }) {
  const { h, m } = getTzParts(clock?.tz ?? 'UTC');
  const cx = size / 2, cy = size / 2, r = size / 2 - 8;
  const deg = (angle) => (angle - 90) * (Math.PI / 180);
  const pt  = (angle, len) => ({
    x: cx + len * Math.cos(deg(angle)),
    y: cy + len * Math.sin(deg(angle)),
  });

  const minDeg = m * 6;
  const hrDeg  = h * 30 + m * 0.5;
  const minEnd = pt(minDeg, r * 0.62);
  const hrEnd  = pt(hrDeg,  r * 0.42);
  const uid    = clock?.id ?? 'orb';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <defs>
        <radialGradient id={`og-${uid}`} cx="48%" cy="46%" r="55%">
          <stop offset="0%"   stopColor="#b83220" stopOpacity="0.96" />
          <stop offset="28%"  stopColor="#d94020" stopOpacity="0.92" />
          <stop offset="58%"  stopColor="#f97316" stopOpacity="0.82" />
          <stop offset="88%"  stopColor="#ffb347" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#fdf8f3"  stopOpacity="0" />
        </radialGradient>
        <filter id={`on-${uid}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" seed="3" result="noise" />
          <feColorMatrix in="noise" type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.07 0" result="noiseMask" />
          <feComposite in="noiseMask" in2="SourceGraphic" operator="in" result="masked" />
          <feBlend in="SourceGraphic" in2="masked" mode="overlay" />
        </filter>
      </defs>
      <rect width={size} height={size} fill="var(--surface)" />
      {/* Orb */}
      <circle cx={cx} cy={cy} r={r * 0.72} fill={`url(#og-${uid})`} filter={`url(#on-${uid})`} />
      {/* Hour hand */}
      <line x1={cx} y1={cy} x2={hrEnd.x} y2={hrEnd.y}
        stroke="rgba(255,255,255,0.55)" strokeWidth={1.8} strokeLinecap="round" />
      {/* Minute hand */}
      <line x1={cx} y1={cy} x2={minEnd.x} y2={minEnd.y}
        stroke="rgba(255,255,255,0.45)" strokeWidth={1.1} strokeLinecap="round" />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r={2.5} fill="rgba(255,255,255,0.7)" />
    </svg>
  );
}

/* Face toggle button row */
const FACE_OPTS = [
  { id: 'list',
    icon: <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect y="1" width="11" height="1.5" rx="0.75" fill="currentColor"/><rect y="4.75" width="11" height="1.5" rx="0.75" fill="currentColor"/><rect y="8.5" width="11" height="1.5" rx="0.75" fill="currentColor"/></svg> },
  { id: 'analog',
    icon: <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.1"/><line x1="5.5" y1="5.5" x2="5.5" y2="2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><line x1="5.5" y1="5.5" x2="7.5" y2="5.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg> },
  { id: 'orb',
    icon: <svg width="11" height="11" viewBox="0 0 11 11"><defs><radialGradient id="tg" cx="40%" cy="38%" r="60%"><stop offset="0%" stopColor="#c0392b"/><stop offset="60%" stopColor="#f97316"/><stop offset="100%" stopColor="#f97316" stopOpacity="0"/></radialGradient></defs><circle cx="5.5" cy="5.5" r="4.5" fill="url(#tg)"/></svg> },
];

export function WorldClockTile({ clocks, setClocks, clockFace = 'list', setClockFace }) {
  const [, setTick] = useState(0);
  const [adding, setAdding] = useState(false);
  const [selTz, setSelTz] = useState(COMMON_TZS[0][0]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const addClock = () => {
    if (clocks.some((c) => c.tz === selTz)) return;
    const label = COMMON_TZS.find(([tz]) => tz === selTz)?.[1] ?? selTz;
    setClocks([...clocks, { id: `c${Date.now()}`, city: label, tz: selTz }]);
    setAdding(false);
  };

  const removeClock = (id) => setClocks(clocks.filter((c) => c.id !== id));

  const activeClock = clocks[activeIdx % Math.max(1, clocks.length)];
  const cycleCity = () => {
    if (clocks.length > 1) setActiveIdx((i) => (i + 1) % clocks.length);
  };

  const faceToggle = (
    <div className="flex items-center bg-surface-3 rounded-full p-0.5 gap-0.5">
      {FACE_OPTS.map(({ id, icon }) => (
        <button key={id} onClick={() => setClockFace?.(id)}
          title={id}
          className={`w-6 h-6 flex items-center justify-center rounded-full transition-all
            ${clockFace === id
              ? 'bg-surface text-text shadow-sm'
              : 'text-text-3 hover:text-text-2'}`}>
          {icon}
        </button>
      ))}
    </div>
  );

  if (clockFace === 'analog') {
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute top-[18px] right-[18px] z-10 flex items-center gap-2">
          {faceToggle}
        </div>
        {clocks.length === 0 ? (
          <p className="text-[13px] text-text-3 py-4 text-center">Add a clock in list mode first.</p>
        ) : (
          <div className="flex flex-col items-center gap-3 pt-1 pb-1">
            <div onClick={cycleCity} className={clocks.length > 1 ? 'cursor-pointer' : ''}>
              <AnalogFace clock={activeClock} size={200} />
            </div>
            <div className="text-center">
              <div className="text-[14px] font-medium text-text">{activeClock?.city}</div>
              <div className="text-[11px] text-text-3">{formatOffset(activeClock?.tz)}</div>
              {clocks.length > 1 && (
                <div className="text-[10px] text-text-3 mt-0.5 opacity-60">tap to cycle</div>
              )}
            </div>
          </div>
        )}
      </Card>
    );
  }

  if (clockFace === 'orb') {
    return (
      <section className="rounded-card shadow-sm relative overflow-hidden" style={{ background: 'var(--surface)' }}>
        <div className="absolute top-[14px] right-[14px] z-10 flex items-center gap-2">
          {faceToggle}
        </div>
        {clocks.length === 0 ? (
          <p className="text-[13px] text-text-3 py-8 text-center">Add a clock in list mode first.</p>
        ) : (
          <div className="flex flex-col items-center" onClick={cycleCity}
            style={{ cursor: clocks.length > 1 ? 'pointer' : 'default' }}>
            <OrbFace clock={activeClock} size={260} />
            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
              <div className="text-[13px] font-medium text-text-2">{activeClock?.city}</div>
              <div className="text-[11px] text-text-3">{formatTime(activeClock?.tz)}</div>
            </div>
          </div>
        )}
      </section>
    );
  }

  /* ── list mode (default) ── */
  return (
    <Card>
      <Head
        title="World clock"
        right={
          <div className="flex items-center gap-2">
            {faceToggle}
            <button onClick={() => setAdding((v) => !v)}
              className="w-7 h-7 rounded-full bg-surface-2 border border-stroke flex items-center justify-center
                text-text-3 hover:text-text transition-colors">
              <Plus size={12} />
            </button>
          </div>
        }
      />

      {adding && (
        <div className="flex gap-2 mb-4">
          <select value={selTz} onChange={(e) => setSelTz(e.target.value)}
            className="flex-1 text-sm bg-surface-2 border border-stroke rounded-xl px-3 py-2 outline-none text-text">
            {COMMON_TZS.filter(([tz]) => !clocks.some((c) => c.tz === tz)).map(([tz, lbl]) => (
              <option key={tz} value={tz}>{lbl}</option>
            ))}
          </select>
          <button onClick={addClock}
            className="w-9 h-9 rounded-xl bg-text text-canvas flex items-center justify-center shrink-0">
            <Plus size={13} />
          </button>
        </div>
      )}

      <div className="flex flex-col divide-y divide-stroke">
        {clocks.map((c) => (
          <div key={c.id} className="group flex items-center justify-between py-3 first:pt-0 last:pb-0">
            <div className="flex items-center gap-2.5">
              <Globe size={13} className="text-text-3 shrink-0" />
              <div>
                <div className="text-[13px] font-medium text-text leading-tight">{c.city}</div>
                <div className="text-[11px] text-text-3">{formatOffset(c.tz)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[22px] font-semibold tracking-tight tabular-nums text-text">
                {formatTime(c.tz)}
              </span>
              <button onClick={() => removeClock(c.id)}
                className="opacity-0 group-hover:opacity-100 text-text-3 hover:text-red-400 transition-all">
                <X size={12} />
              </button>
            </div>
          </div>
        ))}
        {clocks.length === 0 && (
          <p className="text-[13px] text-text-3 py-2">No clocks yet. Add one above.</p>
        )}
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────
   Inspiration Links
───────────────────────────────────────────────────────────── */
function getDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
}

export function InspoLinksTile({ links, setLinks }) {
  const [draft, setDraft]     = useState('');
  const [titleDraft, setTitle] = useState('');
  const [adding, setAdding]   = useState(false);

  const addLink = () => {
    const url = draft.trim();
    if (!url) return;
    const title = titleDraft.trim() || getDomain(url);
    setLinks([...links, { id: `l${Date.now()}`, url, title }]);
    setDraft('');
    setTitle('');
    setAdding(false);
  };

  const removeLink = (id) => setLinks(links.filter((l) => l.id !== id));

  const open = (url) => window.lumen?.openExternal?.(url);

  return (
    <Card>
      <Head
        title="Inspiration"
        right={
          <button onClick={() => setAdding((v) => !v)}
            className="w-7 h-7 rounded-full bg-surface-2 border border-stroke flex items-center justify-center
              text-text-3 hover:text-text transition-colors">
            <Plus size={12} />
          </button>
        }
      />

      {adding && (
        <div className="flex flex-col gap-2 mb-4">
          <input value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addLink()}
            placeholder="https://…"
            className="text-sm bg-surface-2 border border-stroke rounded-xl px-3 py-2 outline-none placeholder:text-text-3" />
          <div className="flex gap-2">
            <input value={titleDraft} onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addLink()}
              placeholder="Title (optional)"
              className="flex-1 text-sm bg-surface-2 border border-stroke rounded-xl px-3 py-2 outline-none placeholder:text-text-3" />
            <button onClick={addLink}
              className="w-9 h-9 rounded-xl bg-text text-canvas flex items-center justify-center shrink-0">
              <Plus size={13} />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        {links.map((l) => (
          <div key={l.id}
            className="group flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-surface-2 transition-colors">
            <Link2 size={12} className="text-text-3 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-text truncate leading-tight">{l.title}</div>
              <div className="text-[11px] text-text-3 truncate">{getDomain(l.url)}</div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button onClick={() => open(l.url)}
                className="text-text-3 hover:text-accent transition-colors p-0.5">
                <ExternalLink size={12} />
              </button>
              <button onClick={() => removeLink(l.id)}
                className="text-text-3 hover:text-red-400 transition-colors p-0.5">
                <X size={12} />
              </button>
            </div>
          </div>
        ))}
        {links.length === 0 && (
          <p className="text-[13px] text-text-3 py-1">No links yet.</p>
        )}
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────
   Plant Tracker
───────────────────────────────────────────────────────────── */
const PLANT_COLORS = ['#4ade80', '#86efac', '#bbf7d0', '#fbbf24', '#f97316', '#f87171'];
const WATER_INTERVALS = [
  { days: 2,  label: 'Every 2 days' },
  { days: 3,  label: 'Every 3 days' },
  { days: 5,  label: 'Every 5 days' },
  { days: 7,  label: 'Every week' },
  { days: 10, label: 'Every 10 days' },
  { days: 14, label: 'Every 2 weeks' },
  { days: 21, label: 'Every 3 weeks' },
  { days: 30, label: 'Every month' },
];

function plantWaterStatus(plant) {
  const { lastWatered, intervalDays = 7 } = plant;
  if (!lastWatered) return { color: 'var(--text-3)', label: 'Never watered', urgent: false };

  const daysSince = (Date.now() - new Date(lastWatered).getTime()) / 86400000;
  const daysLeft  = Math.round(intervalDays - daysSince);

  if (daysLeft > 1)  return { color: '#22c55e', label: `Next watering in ${daysLeft}d`, urgent: false };
  if (daysLeft === 1) return { color: '#f59e0b', label: 'Water tomorrow', urgent: false };
  if (daysLeft === 0) return { color: '#f59e0b', label: 'Water today', urgent: true };
  return { color: '#ef4444', label: `Overdue by ${Math.abs(daysLeft)}d`, urgent: true };
}

export function PlantTrackerTile({ plants, setPlants }) {
  const [adding, setAdding]       = useState(false);
  const [nameDraft, setName]       = useState('');
  const [plantColor, setPlantColor] = useState(PLANT_COLORS[0]);
  const [interval, setInterval]    = useState(7);

  const addPlant = () => {
    const name = nameDraft.trim();
    if (!name) return;
    setPlants([...plants, {
      id: `p${Date.now()}`, name, color: plantColor,
      intervalDays: interval, lastWatered: null,
    }]);
    setName('');
    setPlantColor(PLANT_COLORS[0]);
    setInterval(7);
    setAdding(false);
  };

  const water = (id) =>
    setPlants(plants.map((p) => p.id === id ? { ...p, lastWatered: new Date().toISOString() } : p));

  const removePlant = (id) => setPlants(plants.filter((p) => p.id !== id));

  return (
    <Card>
      <Head
        title="Plants"
        right={
          <button onClick={() => setAdding((v) => !v)}
            className="w-7 h-7 rounded-full bg-surface-2 border border-stroke flex items-center justify-center
              text-text-3 hover:text-text transition-colors">
            <Plus size={12} />
          </button>
        }
      />

      {adding && (
        <div className="flex flex-col gap-2 mb-4">
          <input value={nameDraft} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPlant()}
            placeholder="Plant name…"
            className="text-sm bg-surface-2 border border-stroke rounded-xl px-3 py-2 outline-none placeholder:text-text-3" />
          <div className="flex gap-2 items-center">
            <select value={interval} onChange={(e) => setInterval(Number(e.target.value))}
              className="flex-1 text-sm bg-surface-2 border border-stroke rounded-xl px-3 py-2 outline-none text-text">
              {WATER_INTERVALS.map(({ days, label }) => (
                <option key={days} value={days}>{label}</option>
              ))}
            </select>
            <button onClick={addPlant}
              className="w-9 h-9 rounded-xl bg-text text-canvas flex items-center justify-center shrink-0">
              <Plus size={13} />
            </button>
          </div>
          <div className="flex gap-1.5 items-center">
            {PLANT_COLORS.map((c) => (
              <button key={c} onClick={() => setPlantColor(c)}
                className="w-5 h-5 rounded-full transition-transform hover:scale-110 shrink-0"
                style={{ background: c, outline: plantColor === c ? '2px solid var(--text)' : 'none', outlineOffset: 2 }} />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        {plants.map((p) => {
          const status = plantWaterStatus(p);
          return (
            <div key={p.id}
              className="group flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-surface-2 transition-colors">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: p.color ?? '#4ade80' }} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-text leading-tight">{p.name}</div>
                <div className="text-[11px] truncate" style={{ color: status.color }}>{status.label}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => water(p.id)}
                  className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg transition-colors
                    ${status.urgent
                      ? 'bg-[#dbeafe] text-[#2563eb] hover:bg-[#bfdbfe]'
                      : 'bg-surface-3 text-text-2 hover:bg-accent-tint hover:text-accent-text'}`}>
                  <Droplets size={10} />
                  Water
                </button>
                <button onClick={() => removePlant(p.id)}
                  className="opacity-0 group-hover:opacity-100 text-text-3 hover:text-red-400 transition-all p-0.5">
                  <X size={12} />
                </button>
              </div>
            </div>
          );
        })}
        {plants.length === 0 && (
          <p className="text-[13px] text-text-3 py-1">No plants yet.</p>
        )}
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────
   Social Planner
───────────────────────────────────────────────────────────── */
const SOCIAL_NETWORKS = {
  instagram: { label: 'Instagram', short: 'IG', color: '#C13584', types: ['Post', 'Reel', 'Carousel'] },
  x:         { label: 'X',         short: 'X',  color: '#14171A', types: ['Text', 'Images'] },
  youtube:   { label: 'YouTube',   short: 'YT', color: '#FF0000', types: ['Video', 'Short'] },
  tiktok:    { label: 'TikTok',    short: 'TT', color: '#010101', types: ['Video'] },
};
const TYPE_COLORS = {
  'Reel':     { bg: '#F0E6E6', text: '#8C4040' },
  'Carousel': { bg: '#E6ECF5', text: '#3D5C8A' },
  'Post':     { bg: '#F5EFD8', text: '#7A6020' },
  'Text':     { bg: '#E6EEEA', text: '#2E6B50' },
  'Images':   { bg: '#EDE8F5', text: '#5C4480' },
  'Video':    { bg: '#F2EAE2', text: '#7A4E28' },
  'Short':    { bg: '#E4EFF0', text: '#2A6870' },
};
const ALL_NETS  = ['instagram', 'x', 'youtube', 'tiktok'];
const SOC_STATS = [
  { id: 'idea',   label: 'Idea',   color: 'var(--text-3)' },
  { id: 'draft',  label: 'Draft',  color: '#d97706' },
  { id: 'ready',  label: 'Ready',  color: '#22c55e' },
  { id: 'posted', label: 'Posted', color: 'var(--text-3)' },
];

export function SocialPlannerTile({ planner, setPlanner }) {
  const enabledNets = planner?.enabledNetworks ?? ['instagram', 'x'];
  const posts       = planner?.posts ?? [];

  const [activeTab,   setActiveTab]   = useState(enabledNets[0] ?? 'instagram');
  const [showPicker,  setShowPicker]  = useState(false);
  const [adding,      setAdding]      = useState(false);
  const [titleDraft,  setTitleDraft]  = useState('');
  const [typeDraft,   setTypeDraft]   = useState('');

  useEffect(() => {
    if (!enabledNets.includes(activeTab) && enabledNets.length > 0)
      setActiveTab(enabledNets[0]);
  }, [enabledNets, activeTab]);

  const update = (changes) => setPlanner({ ...planner, ...changes });

  const toggleNet = (net) => {
    const next = enabledNets.includes(net)
      ? enabledNets.filter((n) => n !== net)
      : ALL_NETS.filter((n) => enabledNets.includes(n) || n === net);
    if (next.length === 0) return;
    update({ enabledNetworks: next });
  };

  const addPost = () => {
    if (!titleDraft.trim()) return;
    const net  = SOCIAL_NETWORKS[activeTab];
    const type = typeDraft || net?.types[0] || '';
    update({ posts: [...posts, {
      id: `sp${Date.now()}`, network: activeTab,
      type, title: titleDraft.trim(), status: 'idea',
    }]});
    setTitleDraft(''); setTypeDraft(''); setAdding(false);
  };

  const removePost  = (id) => update({ posts: posts.filter((p) => p.id !== id) });
  const cycleStatus = (id) => update({
    posts: posts.map((p) => {
      if (p.id !== id) return p;
      const i = SOC_STATS.findIndex((s) => s.id === p.status);
      return { ...p, status: SOC_STATS[(i + 1) % SOC_STATS.length].id };
    }),
  });

  const net      = SOCIAL_NETWORKS[activeTab];
  const tabPosts = posts.filter((p) => p.network === activeTab);

  return (
    <Card>
      {/* ── header ── */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-[15px] font-semibold tracking-tight">Social</div>
        <div className="relative">
          <button onClick={() => setShowPicker((v) => !v)}
            className="w-7 h-7 rounded-full bg-surface-2 border border-stroke flex items-center justify-center text-text-3 hover:text-text transition-colors">
            <Settings size={12} />
          </button>
          {showPicker && (
            <div className="absolute right-0 top-full mt-1.5 bg-surface border border-stroke rounded-xl shadow-lg p-2 z-20 min-w-[160px]"
              onMouseLeave={() => setShowPicker(false)}>
              <div className="text-[10px] uppercase tracking-wider text-text-3 px-2 pb-1.5 font-medium">Networks</div>
              {ALL_NETS.map((n) => {
                const active = enabledNets.includes(n);
                return (
                  <button key={n} onClick={() => toggleNet(n)}
                    className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg hover:bg-surface-2 transition-colors">
                    <div className="w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 transition-all"
                      style={{ background: active ? SOCIAL_NETWORKS[n].color : 'transparent', borderColor: active ? SOCIAL_NETWORKS[n].color : 'var(--stroke)' }}>
                      {active && <Check size={8} className="text-white" />}
                    </div>
                    <span className="text-[13px] text-text">{SOCIAL_NETWORKS[n].label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── network tabs ── */}
      <div className="flex gap-1 mb-4 bg-surface-2 rounded-xl p-1">
        {enabledNets.map((n) => (
          <button key={n} onClick={() => setActiveTab(n)}
            className={`flex-1 text-[12px] py-1.5 rounded-lg font-medium transition-all
              ${activeTab === n ? 'bg-surface text-text shadow-sm' : 'text-text-3 hover:text-text-2'}`}>
            {SOCIAL_NETWORKS[n].short}
          </button>
        ))}
      </div>

      {/* ── post list ── */}
      <div key={activeTab} className="tab-content flex flex-col gap-0.5 mb-3" style={{ minHeight: 80 }}>
        {tabPosts.length === 0 && !adding && (
          <p className="text-[13px] text-text-3 py-1">Nothing planned for {net?.label}.</p>
        )}
        {tabPosts.map((p) => {
          const st     = SOC_STATS.find((s) => s.id === p.status) ?? SOC_STATS[0];
          const posted = p.status === 'posted';
          return (
            <div key={p.id}
              className="group flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-surface-2 transition-colors">
              {/* status dot — click cycles */}
              <button onClick={() => cycleStatus(p.id)} title={st.label}
                className="w-4 h-4 rounded-full border-[1.5px] shrink-0 flex items-center justify-center transition-all"
                style={{ borderColor: st.color, background: posted ? st.color : 'transparent' }}>
                {posted && <Check size={7} style={{ color: 'var(--canvas)' }} />}
              </button>

              <span className={`flex-1 text-[13px] leading-tight min-w-0 truncate
                ${posted ? 'line-through text-text-3' : 'text-text'}`}>
                {p.title}
              </span>

              <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium"
                style={TYPE_COLORS[p.type]
                  ? { background: TYPE_COLORS[p.type].bg, color: TYPE_COLORS[p.type].text }
                  : { background: 'var(--surface-3)', color: 'var(--text-3)' }}>
                {p.type}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium"
                style={{ background: `color-mix(in srgb, ${st.color} 14%, transparent)`, color: st.color }}>
                {st.label}
              </span>

              <button onClick={() => removePost(p.id)}
                className="opacity-0 group-hover:opacity-100 text-text-3 hover:text-red-400 transition-all p-0.5 shrink-0">
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {/* ── add form ── */}
      {adding ? (
        <div className="flex flex-col gap-2">
          <input value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPost()} autoFocus
            placeholder={`New ${net?.label} idea…`}
            className="text-sm bg-surface-2 border border-stroke rounded-xl px-3 py-2 outline-none placeholder:text-text-3" />
          <div className="flex gap-1.5 items-center">
            <div className="flex gap-1 flex-1 flex-wrap">
              {(net?.types ?? []).map((t) => (
                <button key={t} onClick={() => setTypeDraft(t)}
                  className={`text-[12px] px-2.5 py-1 rounded-lg transition-colors
                    ${(typeDraft || net?.types[0]) === t ? 'bg-text text-canvas' : 'bg-surface-3 text-text-2 hover:bg-surface-2'}`}>
                  {t}
                </button>
              ))}
            </div>
            <button onClick={addPost}
              className="w-8 h-8 rounded-xl bg-text text-canvas flex items-center justify-center shrink-0">
              <Plus size={13} />
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-[12px] text-text-3 hover:text-text-2 transition-colors w-full px-2 py-1 rounded-xl hover:bg-surface-2">
          <Plus size={11} /> Add idea
        </button>
      )}
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────
   Live Canvas — CSS-filter metaballs
   The blur+contrast filter on the container merges the circles
   into organic blobs without per-pixel computation.
───────────────────────────────────────────────────────────── */
export function LiveCanvas() {
  const containerRef = useRef(null);
  const canvasRef    = useRef(null);
  const rafRef       = useRef(null);
  const balls        = useRef([]);

  useEffect(() => {
    const wrap   = containerRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const W = wrap.offsetWidth;
    const H = wrap.offsetHeight;
    canvas.width  = W;
    canvas.height = H;

    const accent = getComputedStyle(document.documentElement)
      .getPropertyValue('--accent').trim() || '#334155';

    balls.current = Array.from({ length: 6 }, () => ({
      x:  W * 0.15 + Math.random() * W * 0.7,
      y:  H * 0.15 + Math.random() * H * 0.7,
      r:  22 + Math.random() * 20,
      vx: (Math.random() - 0.5) * 0.65,
      vy: (Math.random() - 0.5) * 0.65,
    }));

    const ctx = canvas.getContext('2d');

    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      for (const b of balls.current) {
        b.x += b.vx; b.y += b.vy;
        if (b.x - b.r < 0)   { b.x = b.r;     b.vx =  Math.abs(b.vx); }
        if (b.x + b.r > W)   { b.x = W - b.r; b.vx = -Math.abs(b.vx); }
        if (b.y - b.r < 0)   { b.y = b.r;     b.vy =  Math.abs(b.vy); }
        if (b.y + b.r > H)   { b.y = H - b.r; b.vy = -Math.abs(b.vy); }
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = accent;
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    tick();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <section className="bg-surface rounded-card shadow-sm relative overflow-hidden" style={{ minHeight: 180 }}>
      {/* filter layer: blur makes balls fuzzy, high contrast snaps them to hard edges where they overlap */}
      <div ref={containerRef} className="absolute inset-0"
        style={{ background: 'var(--surface)', filter: 'blur(14px) contrast(20)' }}>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      </div>
      <div className="absolute bottom-4 left-5 pointer-events-none z-10">
        <div className="text-[10px] uppercase tracking-widest text-text-3">Canvas</div>
      </div>
    </section>
  );
}
