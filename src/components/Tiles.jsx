import { useEffect, useMemo, useRef, useState } from 'react';
import {
  WEEKDAYS, SEGMENTS, MOODS, MOOD_SCORE, moodColor, COUNTDOWNS,
  startOfDay, addDays, sameDay, ymd, parseYmd,
} from '../lib/utils';
import {
  Plus, Check, X, ChevronLeft, ChevronRight, Trash2, ArrowRight, Link2,
  CheckSquare, CalIcon,
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
          <input type="date" value={draft.date} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
            className="w-full text-[13px] bg-surface-2 rounded-xl px-3 py-2 outline-none" />
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
export function MoodPanel({ selDay, shiftDay, moods, setMoodSeg, now }) {
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
                return (
                  <div key={key} className={`flex-1 min-w-0 rounded-[5px] overflow-hidden flex flex-col ${isSel ? 'ring-2 ring-accent ring-offset-1 ring-offset-surface' : ''}`}
                    style={{ height: 38 }} title={dd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}>
                    {SEGMENTS.map((s) => (
                      <span key={s.id} className="flex-1" style={{ background: hm[s.id]?.level ? moodColor(hm[s.id].level) : 'var(--surface-2)' }} />
                    ))}
                  </div>
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
              return (
                <div key={key} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10.5px] text-text-3">{DAY_ABBR[dd.getDay()]}</span>
                  <div className={`w-full rounded-[8px] overflow-hidden flex flex-col cursor-pointer ${isSel ? 'ring-2 ring-accent ring-offset-1 ring-offset-surface' : ''}`}
                    style={{ height: 64 }} title={dd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}>
                    {SEGMENTS.map((s) => (
                      <span key={s.id} className="flex-1" style={{ background: hm[s.id]?.level ? moodColor(hm[s.id].level) : 'var(--surface-2)' }} />
                    ))}
                  </div>
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
   Focus Timer (Pomodoro)
───────────────────────────────────────────────────────────── */
export function FocusTile({ pomodoroLog = [], onLogSession }) {
  const [workMins, setWorkMins]   = useState(25);
  const [breakMins, setBreakMins] = useState(5);
  const [mode, setMode]           = useState('work');
  const [secsLeft, setSecsLeft]   = useState(25 * 60);
  const [running, setRunning]     = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const totalSecs = mode === 'work' ? workMins * 60 : breakMins * 60;

  // countdown tick
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  // session complete
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

  const SZ = 132, R = 50;
  const C  = +(2 * Math.PI * R).toFixed(2);
  const offset = C * (1 - secsLeft / Math.max(1, totalSecs));

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
          {/* SVG ring + time */}
          <div className="flex justify-center my-1">
            <div className="relative flex items-center justify-center" style={{ width: SZ, height: SZ }}>
              <svg width={SZ} height={SZ} className="absolute inset-0" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={SZ / 2} cy={SZ / 2} r={R} fill="none" stroke="var(--stroke)" strokeWidth="3.5" />
                <circle cx={SZ / 2} cy={SZ / 2} r={R} fill="none"
                  stroke={mode === 'work' ? 'var(--accent)' : 'var(--text-3)'}
                  strokeWidth="3.5" strokeLinecap="round"
                  strokeDasharray={C} strokeDashoffset={offset}
                  style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'none' }}
                />
              </svg>
              <div className="text-center z-10">
                <div className="text-[28px] font-semibold tracking-tight text-text leading-none tabular-nums">
                  {mm}:{ss}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-text-3 mt-1">
                  {mode === 'work' ? 'Focus' : 'Break'}
                </div>
              </div>
            </div>
          </div>

          {/* controls */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <button onClick={reset}
              className="w-8 h-8 rounded-full border border-stroke text-text-3 hover:text-text flex items-center justify-center text-base transition-colors">↺</button>
            <button onClick={toggle}
              className="w-11 h-11 rounded-full bg-text text-canvas flex items-center justify-center text-base hover:opacity-75 transition-opacity">
              {running ? '⏸' : '▶'}
            </button>
            <button onClick={skip}
              className="w-8 h-8 rounded-full border border-stroke text-text-3 hover:text-text flex items-center justify-center text-sm transition-colors">⏭</button>
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
  const [taskDrafts, setTaskDrafts] = useState({});

  const submitProject = () => {
    if (!projDraft.trim()) return;
    onAdd({
      id: Date.now().toString(),
      name: projDraft.trim(),
      color: PRJ_COLORS[projects.length % PRJ_COLORS.length],
      status: 'active',
      tasks: [],
    });
    setProjDraft('');
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
        <div className="flex gap-2 mb-4">
          <input autoFocus value={projDraft} onChange={(e) => setProjDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitProject(); if (e.key === 'Escape') setAddingProject(false); }}
            placeholder="Project name…"
            className="flex-1 text-sm bg-surface-2 border border-stroke rounded-xl px-3 py-2 outline-none placeholder:text-text-3" />
          <button onClick={submitProject}
            className="px-3 py-2 bg-text text-canvas rounded-xl text-[12px] font-medium">Add</button>
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
            <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="text-sm bg-surface-2 border border-stroke rounded-xl px-3 py-2 outline-none text-text" />
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
