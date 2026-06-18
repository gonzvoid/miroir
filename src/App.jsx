import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext, DragOverlay, closestCorners,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from './lib/store';
import { googleCalendar } from './lib/google';
import {
  ymd, addDays, startOfDay,
  DEFAULT_CALENDARS, DEFAULT_LOOPS, DEFAULT_TAGS, SEED_EVENT_IDS,
  LAYOUT_PRESETS, TAGS_PRESETS, TILE_CATALOG, parseYmd,
} from './lib/utils';
import { GripVertical, X, Plus } from './components/icons';
import Header from './components/Header';
import Focal from './components/Focal';
import ImageTile from './components/ImageTile';
import LayoutEditor from './components/LayoutEditor';
import SettingsPanel from './components/SettingsPanel';
import {
  Timeline, DailyLoops, Summary, Countdown, Sources,
  MoodPanel, CalCard, TaskHistory, Doodle, LunchMenu,
  FocusTile, ProjectsTile, BooksTile, TripTile, LiveCanvas,
  WorldClockTile, InspoLinksTile, PlantTrackerTile, SocialPlannerTile,
} from './components/Tiles';

const DEFAULT_LAYOUT = {
  left:  ['focal', 'summary'],
  mid:   ['loops', 'image', 'countdown', 'timeline', 'sources'],
  right: ['mood', 'calendar'],
  far:   [],
};

function migrateLayout(l) {
  if (!l || typeof l !== 'object' || Array.isArray(l)) return DEFAULT_LAYOUT;
  const fix = (arr) => {
    if (!arr) return [];
    const out = [];
    for (const id of arr) {
      if (id === 'visual') out.push('image', 'countdown');
      else if (id !== 'capture') out.push(id);
    }
    return out;
  };
  return { left: fix(l.left), mid: fix(l.mid), right: fix(l.right), far: fix(l.far) };
}

const DEFAULTS = {
  theme: 'light', bg: null, tasks: [], ideas: [], events: [],
  calendars: DEFAULT_CALENDARS, moods: {}, tileImages: [], imageFolder: null,
  loops: DEFAULT_LOOPS, countdowns: [], layout: DEFAULT_LAYOUT,
  tags: DEFAULT_TAGS, name: null, workType: null,
  doodles: {}, lunchMenu: {},
  imageAlbums: [],
  plants: [],
  clocks: [
    { id: 'c1', city: 'Madrid',   tz: 'Europe/Madrid' },
    { id: 'c2', city: 'New York', tz: 'America/New_York' },
  ],
  inspoLinks: [],
  clockFace: 'list',
  accentColor: 'slate', language: 'en', weekStart: 'mon', _v: 0,
  projects: [],
  books: { current: null, completed: [] },
  trip: null,
  pomodoroLog: [],
  socialPlanner: { enabledNetworks: ['instagram', 'x'], posts: [] },
};

/* ---- drag helpers ---- */
function findContainerInLayout(layout, id) {
  if (id in layout) return id;
  return Object.keys(layout).find((col) => layout[col].includes(id)) ?? null;
}

/* ---- SortableTile ---- */
function SortableTile({ id, unlocked, isAnyDragging, onRemove, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: !unlocked });
  return (
    <div ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : isAnyDragging ? 'transform 180ms ease' : transition,
        opacity: isDragging ? 0 : 1,
        pointerEvents: isDragging ? 'none' : undefined,
      }}
      className="relative">
      {unlocked && (
        <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1">
          <button
            onClick={() => onRemove?.(id)}
            className="w-6 h-6 grid place-items-center bg-surface-3 rounded-full text-text-3 hover:text-[#c0564b] hover:bg-red-50 shadow-sm transition-colors">
            <X size={11} />
          </button>
          <div {...attributes} {...listeners}
            className="w-6 h-6 grid place-items-center bg-surface-3 rounded-full cursor-grab active:cursor-grabbing text-text-3 hover:text-text shadow-sm transition-colors">
            <GripVertical size={13} />
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

/* ---- GhostTile — add tile from edit mode ---- */
function GhostTile({ available, onAdd }) {
  const [open, setOpen] = useState(false);
  if (!available.length) return null;
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full rounded-card border border-dashed flex items-center justify-center transition-colors hover:bg-surface-2"
        style={{ minHeight: 52, opacity: 0.4, borderColor: 'var(--stroke)' }}>
        <Plus size={13} className="text-text-3" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-surface border border-stroke rounded-xl shadow-lg p-1.5 z-30 min-w-[170px]"
          onMouseLeave={() => setOpen(false)}>
          {available.map((t) => (
            <button key={t.id} onClick={() => { onAdd(t.id); setOpen(false); }}
              className="flex w-full items-center px-2.5 py-2 rounded-lg hover:bg-surface-2 text-text-2 hover:text-text text-[12.5px] text-left transition-colors">
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- DroppableColumn ---- */
function DroppableColumn({ id, items, unlocked, isAnyDragging, tileMap, onRemoveTile, availableTiles, onAddTile, className }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <SortableContext items={items} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} className={`flex flex-col gap-4 min-h-20 ${className ?? ''}`}>
        {items.map((tileId) => (
          <SortableTile key={tileId} id={tileId} unlocked={unlocked} isAnyDragging={isAnyDragging} onRemove={onRemoveTile}>
            {tileMap[tileId]}
          </SortableTile>
        ))}
        {unlocked && <GhostTile available={availableTiles} onAdd={(tileId) => onAddTile(tileId, id)} />}
      </div>
    </SortableContext>
  );
}

/* ---- Onboarding ---- */
const WORK_TYPES = [
  {
    id: 'design', label: 'Design & Visual', desc: 'UI, branding, creative direction',
    cols: [2, 2, 2], // tile counts per column for preview schematic
  },
  {
    id: 'dev', label: 'Development', desc: 'Code, systems, engineering',
    cols: [3, 2, 2],
  },
  {
    id: 'gtd', label: 'GTD / Productivity', desc: 'Task management, goals, focus',
    cols: [2, 3, 2],
  },
  {
    id: 'personal', label: 'Personal', desc: 'Life, habits, family, wellness',
    cols: [2, 2, 2],
  },
];

function LayoutSchematic({ cols, active }) {
  const H = [20, 14, 11, 8, 6];
  return (
    <div className="flex gap-[5px] items-start shrink-0">
      {cols.map((n, ci) => (
        <div key={ci} className="flex flex-col gap-[3px]" style={{ width: 18 }}>
          {Array.from({ length: n }, (_, i) => (
            <div key={i} className="rounded-[2px] transition-colors"
              style={{
                height: H[i] ?? 5,
                background: active ? 'var(--text)' : 'var(--stroke)',
                opacity: active ? 0.55 : 1,
              }} />
          ))}
        </div>
      ))}
    </div>
  );
}

function OnboardingScreen({ onDone, onClose, theme }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [workType, setWorkType] = useState(null);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (!onClose) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const next = () => {
    if (!name.trim()) return;
    setTransitioning(true);
    setTimeout(() => { setStep(1); setTransitioning(false); }, 200);
  };

  const finish = () => {
    if (!workType) return;
    onDone(name.trim(), workType);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center"
      style={{ background: theme === 'dark'
        ? 'linear-gradient(160deg, #141614 0%, #1B1E1A 55%, #0F110E 100%)'
        : theme === 'cream'
        ? 'linear-gradient(160deg, #FDF8F3 0%, #F5EFE4 55%, #ECE5D7 100%)'
        : 'linear-gradient(160deg, #F8F8F6 0%, #EEF0EB 55%, #E6E9E2 100%)' }}>

      <div className={`w-full max-w-[400px] px-8 transition-all duration-200
        ${transitioning ? 'opacity-0 translate-y-1.5' : 'opacity-100 translate-y-0'}`}>

        {step === 0 ? (
          /* ── Step 1: name ─────────────────────────────────────── */
          <div className="flex flex-col gap-7">
            <div>
              <div className="text-[11px] tracking-[0.18em] uppercase text-text-3 mb-4 font-medium">
                Miroir
              </div>
              <div className="text-[38px] font-semibold tracking-tight text-text leading-[1.08] mb-3">
                Your personal<br />command center.
              </div>
              <div className="text-text-2 text-[15px] leading-relaxed">
                Designed to keep you focused<br />on what matters.
              </div>
            </div>

            <input autoFocus value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && next()}
              placeholder="What should we call you?"
              className="w-full bg-surface border border-stroke rounded-2xl px-5 py-4
                text-[15px] text-text outline-none transition-colors
                placeholder:text-text-3 focus:border-text-3" />

            <button onClick={next} disabled={!name.trim()}
              className="w-full py-[14px] rounded-2xl text-[14px] font-semibold
                bg-text text-canvas transition-opacity disabled:opacity-20 hover:opacity-75
                active:scale-[0.99]">
              Continue →
            </button>

            <div className="flex gap-1.5 justify-center">
              <span className="w-4 h-[3px] rounded-full bg-text" />
              <span className="w-[3px] h-[3px] rounded-full bg-stroke" />
            </div>
          </div>

        ) : (
          /* ── Step 2: work type ────────────────────────────────── */
          <div className="flex flex-col gap-6">
            <div>
              <div className="text-[11px] tracking-[0.18em] uppercase text-text-3 mb-4 font-medium">
                Miroir
              </div>
              <div className="text-[28px] font-semibold tracking-tight text-text mb-1">
                Hi, {name}.
              </div>
              <div className="text-text-2 text-[14px]">
                How will you use Miroir?<br />We'll set up a layout that fits.
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {WORK_TYPES.map((wt) => (
                <button key={wt.id} onClick={() => setWorkType(wt.id)}
                  className={`text-left px-4 py-3.5 rounded-2xl border transition-all
                    flex items-center gap-4
                    ${workType === wt.id
                      ? 'border-text bg-surface shadow-sm'
                      : 'border-stroke bg-surface hover:bg-surface-2 hover:border-text-3'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-text font-medium text-[13.5px]">{wt.label}</div>
                    <div className="text-text-3 text-[12px] mt-0.5">{wt.desc}</div>
                  </div>
                  <LayoutSchematic cols={wt.cols} active={workType === wt.id} />
                </button>
              ))}
            </div>

            <button onClick={finish} disabled={!workType}
              className="w-full py-[14px] rounded-2xl text-[14px] font-semibold
                bg-text text-canvas transition-opacity disabled:opacity-20 hover:opacity-75
                active:scale-[0.99]">
              Set up my space →
            </button>

            <div className="flex gap-1.5 justify-center">
              <span className="w-[3px] h-[3px] rounded-full bg-stroke" />
              <span className="w-4 h-[3px] rounded-full bg-text" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================ */
export default function App() {
  const [s, patch, loaded] = useStore(DEFAULTS);
  const [filter, setFilter] = useState('all');
  const [viewMonth, setViewMonth] = useState(startOfDay(new Date()));
  const [unlocked, setUnlocked] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [showLayoutEditor, setShowLayoutEditor] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [previewOnboarding, setPreviewOnboarding] = useState(false);
  const composerRef = useRef(null);
  const now = new Date();

  useEffect(() => { document.documentElement.setAttribute('data-theme', s.theme); }, [s.theme]);
  useEffect(() => {
    document.documentElement.setAttribute('data-accent', s.accentColor ?? 'slate');
  }, [s.accentColor]);

  // Ctrl+Shift+O → preview onboarding without touching store
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'O') setPreviewOnboarding(true);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // R → toggle layout unlock mode (when not focused on an input)
  useEffect(() => {
    const handler = (e) => {
      if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        setUnlocked((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const tasks = s.tasks, moods = s.moods;
  const layout = migrateLayout(s.layout);

  const [selDay, setSelDay] = useState(ymd(now));
  const shiftDay = (n) => setSelDay((d) => ymd(addDays(parseYmd(d), n)));

  // One-time migration: remove seed events
  useEffect(() => {
    if (!loaded) return;
    if (!s._v || s._v < 2) {
      patch('events', (evs) => (evs || []).filter((e) => !SEED_EVENT_IDS.has(e.id)));
      patch('_v', 2);
    }
  }, [loaded]);

  /* Google Calendar */
  const [googleAccounts, setGoogleAccounts] = useState([]);
  const [googleEvents, setGoogleEvents] = useState([]);
  const [googleSyncErrors, setGoogleSyncErrors] = useState({});

  const fetchGoogleEvents = async () => {
    const t = new Date();
    const timeMin = new Date(t.getFullYear(), t.getMonth() - 1, 1).toISOString();
    const timeMax = new Date(t.getFullYear(), t.getMonth() + 3, 1).toISOString();
    const res = await googleCalendar.listEvents({ timeMin, timeMax });
    setGoogleEvents(res.events || []);
    setGoogleSyncErrors(res.errors || {});
  };
  const refreshAccounts = async () => {
    const accounts = await googleCalendar.getAccounts();
    setGoogleAccounts(accounts);
    return accounts;
  };
  useEffect(() => {
    if (!loaded) return;
    refreshAccounts().then((accts) => { if (accts.length) fetchGoogleEvents(); });
  }, [loaded]);

  const onConnect = async () => {
    const res = await googleCalendar.connect();
    if (res?.success) { await refreshAccounts(); fetchGoogleEvents(); }
  };
  const onDisconnect = async (email) => {
    await googleCalendar.disconnect(email);
    const accts = await refreshAccounts();
    if (accts.length) fetchGoogleEvents(); else setGoogleEvents([]);
  };
  const onRename = async (email, name) => {
    await googleCalendar.setDisplayName(email, name);
    setGoogleAccounts((prev) => prev.map((a) => a.email === email ? { ...a, displayName: name || null } : a));
  };

  const localEvents = s.events || [];
  const allEvents = useMemo(() => [...localEvents, ...googleEvents], [localEvents, googleEvents]);
  const allCalendars = useMemo(() => {
    if (!googleAccounts.length) return s.calendars;
    const without = s.calendars.filter((c) => c.id !== 'google');
    return [...without, { id: 'google', name: 'Google Calendar', color: '#4285F4', connected: true }];
  }, [s.calendars, googleAccounts]);

  /* task handlers */
  const addTask = (title, tagId, date) => {
    if (!title.trim()) return;
    patch('tasks', (t) => [...t, {
      id: Date.now() + '' + Math.random(),
      title: title.trim(), lane: tagId, date: date || null, state: 0,
    }]);
  };
  const addEvent = (ev) => {
    const obj = typeof ev === 'string'
      ? { calendarId: 'work', title: ev.trim(), start: ymd(now), time: '', loc: '' }
      : { calendarId: ev.calendarId || 'work', title: (ev.title || 'New event').trim(), start: ev.date || ymd(now), time: ev.time || '', loc: ev.loc || '' };
    patch('events', (e) => [...(e || []), { id: Date.now() + '', ...obj }]);
  };
  const clearLocalEvents = () => patch('events', []);

  const cycleTask = (id) => patch('tasks', (t) => t.map((x) => {
    if (x.id !== id) return x;
    const newState = ((x.state || 0) + 1) % 3;
    return { ...x, state: newState, completedAt: newState === 2 ? ymd(new Date()) : (newState === 0 ? null : x.completedAt) };
  }));
  const delTask       = (id) => patch('tasks', (t) => t.filter((x) => x.id !== id));
  const editTask      = (id, title) => patch('tasks', (t) => t.map((x) => x.id === id ? { ...x, title } : x));
  const setTaskStatus = (id, status) => patch('tasks', (t) => t.map((x) => x.id === id ? { ...x, status: x.status === status ? null : status } : x));
  const setTaskLane   = (id, laneId) => patch('tasks', (t) => t.map((x) => x.id === id ? { ...x, lane: laneId } : x));
  const moveTask      = (id, laneId) => {
    const d = laneId === 'today' ? ymd(now) : laneId === 'tomorrow' ? ymd(addDays(now, 1)) : laneId === 'week' ? ymd(addDays(now, 4)) : ymd(addDays(now, 14));
    patch('tasks', (t) => t.map((x) => x.id === id ? { ...x, date: d } : x));
  };
  const reorderTask   = (dragId, overId) => patch('tasks', (t) => {
    const a = [...t]; const from = a.findIndex((x) => x.id === dragId); const to = a.findIndex((x) => x.id === overId);
    if (from < 0 || to < 0) return t;
    const [m] = a.splice(from, 1); a.splice(to, 0, m); return a;
  });

  const addIdea    = (txt) => { if (!txt.trim()) return; patch('ideas', (i) => [{ id: Date.now() + '', text: txt.trim() }, ...i]); };
  const delIdea    = (id)  => patch('ideas', (i) => i.filter((x) => x.id !== id));
  const ideaToTask = (idea) => { addTask(idea.text, (s.tags?.[0]?.id ?? 'work'), ymd(now)); delIdea(idea.id); };
  const setMoodSeg = (k, seg, p) => patch('moods', (m) => ({ ...m, [k]: { ...(m[k] || {}), [seg]: { ...((m[k] || {})[seg] || {}), ...p } } }));
  const focusComposer = () => { const el = composerRef.current; if (!el) return; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => el.focus(), 300); };

  const tags = s.tags || DEFAULT_TAGS;
  const vTasks  = useMemo(() => filter === 'all' ? tasks : tasks.filter((t) => t.lane === filter), [tasks, filter]);
  const vEvents = useMemo(() => filter === 'all' ? allEvents : allEvents.filter((e) => e.calendarId === filter), [allEvents, filter]);

  // Migrate legacy tileImages/imageFolder → multi-album format (plain const, no hook)
  const imageAlbums = (s.imageAlbums && s.imageAlbums.length > 0)
    ? s.imageAlbums
    : (s.tileImages && s.tileImages.length > 0)
      ? [{ id: 'album-default', name: 'Album 1', images: s.tileImages, folder: s.imageFolder ?? null }]
      : [];
  const setImageAlbums = (v) => patch('imageAlbums', typeof v === 'function' ? v(imageAlbums) : v);

  /* ---- new tile handlers ---- */
  const addProject    = (p)  => patch('projects', (ps) => [...ps, p]);
  const updateProject = (id, changes) => patch('projects', (ps) => ps.map((p) => p.id === id ? { ...p, ...changes } : p));
  const deleteProject = (id) => patch('projects', (ps) => ps.filter((p) => p.id !== id));

  const setCurrentBook      = (book) => patch('books', (b) => ({ ...b, current: book }));
  const updateCurrentPage   = (page) => patch('books', (b) => ({ ...b, current: b.current ? { ...b.current, currentPage: page } : b.current }));
  const completeCurrentBook = ()     => patch('books', (b) => {
    if (!b.current) return b;
    return { current: null, completed: [{ ...b.current, completedYear: new Date().getFullYear() }, ...(b.completed || [])] };
  });
  const deleteCompletedBook = (idx)  => patch('books', (b) => ({ ...b, completed: b.completed.filter((_, i) => i !== idx) }));

  const setTrip    = (t)       => patch('trip', t);
  const updateTrip = (changes) => patch('trip', (t) => t ? { ...t, ...changes } : t);
  const clearTrip  = ()        => patch('trip', null);

  const logPomodoroSession = () => patch('pomodoroLog', (log) => [...(log || []), { date: ymd(now), ts: Date.now() }]);

  /* tile map */
  const tileMap = {
    focal:    <Focal tasks={vTasks} addTask={addTask} cycleTask={cycleTask} delTask={delTask}
                editTask={editTask} setTaskStatus={setTaskStatus} setTaskLane={setTaskLane}
                moveTask={moveTask} reorderTask={reorderTask} composerRef={composerRef} tags={tags} />,
    summary:  <Summary tasks={tasks} moods={moods} now={now} />,
    tasklog:  <TaskHistory tasks={tasks} now={now} />,
    loops:    <DailyLoops loops={s.loops} setLoops={(v) => patch('loops', v)} />,
    doodle:   <Doodle doodles={s.doodles} setDoodles={(v) => patch('doodles', v)} now={now} />,
    lunchMenu:<LunchMenu lunchMenu={s.lunchMenu} setLunchMenu={(v) => patch('lunchMenu', v)} now={now} />,
    image:    <ImageTile albums={imageAlbums} setAlbums={setImageAlbums} />,
    countdown:<Countdown countdowns={s.countdowns} setCountdowns={(v) => patch('countdowns', v)} />,
    timeline: <Timeline events={vEvents} now={now} />,
    sources:  <Sources calendars={allCalendars} setCalendars={(v) => patch('calendars', v)}
                googleAccounts={googleAccounts} onConnect={onConnect} onDisconnect={onDisconnect}
                onRename={onRename} clearLocalEvents={clearLocalEvents}
                syncErrors={googleSyncErrors} onRefresh={fetchGoogleEvents} />,
    calendar: <CalCard viewMonth={viewMonth} setViewMonth={setViewMonth} events={vEvents}
                calendars={allCalendars} addEvent={addEvent} />,
    mood:     <MoodPanel selDay={selDay} shiftDay={shiftDay} setSelDay={setSelDay} moods={moods} setMoodSeg={setMoodSeg} now={now} />,
    focus:    <FocusTile pomodoroLog={s.pomodoroLog} onLogSession={logPomodoroSession} />,
    projects: <ProjectsTile projects={s.projects} onAdd={addProject} onUpdate={updateProject} onDelete={deleteProject} />,
    books:    <BooksTile books={s.books} onSet={setCurrentBook} onUpdate={updateCurrentPage} onComplete={completeCurrentBook} onDeleteCompleted={deleteCompletedBook} />,
    trip:     <TripTile trip={s.trip} onSet={setTrip} onUpdate={updateTrip} onClear={clearTrip} />,
    canvas:      <LiveCanvas />,
    worldclock:  <WorldClockTile  clocks={s.clocks}     setClocks={(v)    => patch('clocks', v)}  clockFace={s.clockFace}  setClockFace={(v) => patch('clockFace', v)} />,
    inspolinks:  <InspoLinksTile  links={s.inspoLinks}  setLinks={(v)     => patch('inspoLinks', v)} />,
    plants:      <PlantTrackerTile plants={s.plants}    setPlants={(v)    => patch('plants', v)} />,
    social:      <SocialPlannerTile planner={s.socialPlanner} setPlanner={(v) => patch('socialPlanner', v)} />,
  };

  const addTileToColumn = useCallback((tileId, col) => {
    patch('layout', {
      left: layout.left, mid: layout.mid, right: layout.right, far: layout.far,
      [col]: [...(layout[col] ?? []), tileId],
    });
  }, [layout, patch]);

  const removeTileFromLayout = useCallback((tileId) => {
    patch('layout', {
      left:  layout.left.filter((id) => id !== tileId),
      mid:   layout.mid.filter((id) => id !== tileId),
      right: layout.right.filter((id) => id !== tileId),
      far:   layout.far.filter((id) => id !== tileId),
    });
  }, [layout, patch]);

  /* ---- DnD ---- */
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [draftLayout, setDraftLayout] = useState(null);
  const activeLayout = draftLayout ?? layout;
  const placedIds      = new Set([...(activeLayout.left??[]), ...(activeLayout.mid??[]), ...(activeLayout.right??[]), ...(activeLayout.far??[])]);
  const availableTiles = TILE_CATALOG.filter((t) => !placedIds.has(t.id));
  const dragOverTimer = useRef(null);
  const pendingDragOver = useRef(null);

  const handleDragStart = ({ active }) => {
    clearTimeout(dragOverTimer.current);
    setActiveId(active.id);
    setDraftLayout(layout);
  };
  const handleDragOver = useCallback(({ active, over }) => {
    if (!over) return;
    pendingDragOver.current = { active, over };
    clearTimeout(dragOverTimer.current);
    dragOverTimer.current = setTimeout(() => {
      const pending = pendingDragOver.current;
      if (!pending) return;
      const { active: a, over: o } = pending;
      setDraftLayout((l) => {
        if (!l) return l;
        const ac = findContainerInLayout(l, a.id);
        const oc = findContainerInLayout(l, o.id) ?? (o.id in l ? o.id : null);
        if (!ac || !oc || ac === oc) return l;
        const aItems = l[ac], oItems = l[oc];
        const overIdx = o.id in l ? oItems.length : oItems.indexOf(o.id);
        return { ...l, [ac]: aItems.filter((id) => id !== a.id), [oc]: [...oItems.slice(0, overIdx), a.id, ...oItems.slice(overIdx)] };
      });
    }, 90);
  }, []);
  const handleDragEnd = useCallback(({ active, over }) => {
    clearTimeout(dragOverTimer.current);
    pendingDragOver.current = null;
    setActiveId(null);
    setDraftLayout((draft) => {
      if (!draft) return null;
      let final = draft;
      if (over) {
        const ac = findContainerInLayout(draft, active.id);
        const oc = findContainerInLayout(draft, over.id) ?? (over.id in draft ? over.id : null);
        if (ac && oc && ac === oc) {
          const items = draft[ac];
          const oldIdx = items.indexOf(active.id), newIdx = items.indexOf(over.id);
          if (oldIdx !== newIdx) final = { ...draft, [ac]: arrayMove(items, oldIdx, newIdx) };
        }
      }
      patch('layout', final);
      return null;
    });
  }, [patch]);

  /* ---- render ---- */
  if (!loaded) return <div className="grid place-items-center h-screen text-text-3">·</div>;

  if (s.name === null || s.name === undefined) {
    return (
      <OnboardingScreen theme={s.theme} onDone={(name, workType) => {
        patch('name', name);
        patch('workType', workType);
        patch('layout', LAYOUT_PRESETS[workType] ?? DEFAULT_LAYOUT);
        patch('tags', TAGS_PRESETS[workType] ?? DEFAULT_TAGS);
      }} />
    );
  }

  // Preview onboarding overlay (Ctrl+Shift+O) — does NOT touch the store
  if (previewOnboarding) {
    return (
      <OnboardingScreen
        theme={s.theme}
        onClose={() => setPreviewOnboarding(false)}
        onDone={() => setPreviewOnboarding(false)}
      />
    );
  }

  const tileLabels = TILE_CATALOG.reduce((acc, t) => { acc[t.id] = t.label; return acc; }, {});

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 bg-canvas" style={{ zIndex: -20 }} />
      {s.bg && (
        <div className="fixed inset-0" style={{ zIndex: -10 }}>
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${s.bg})` }} />
          <div className="absolute inset-0 bg-canvas" style={{ opacity: 0.55 }} />
        </div>
      )}

      {/* layout editor overlay */}
      {showLayoutEditor && (
        <LayoutEditor
          layout={layout}
          onLayoutChange={(l) => patch('layout', l)}
          onClose={() => setShowLayoutEditor(false)}
        />
      )}

      {/* settings panel */}
      {showSettings && (
        <SettingsPanel s={s} patch={patch} onClose={() => setShowSettings(false)} />
      )}

      <div className="max-w-[1240px] mx-auto px-[26px] pt-2 pb-7">
        <Header
          theme={s.theme} setTheme={(v) => patch('theme', v)}
          filter={filter} setFilter={setFilter}
          now={now} unlocked={unlocked} setUnlocked={setUnlocked}
          name={s.name} tags={tags} setTags={(v) => patch('tags', v)}
          onOpenLayoutEditor={() => setShowLayoutEditor(true)}
          onOpenSettings={() => setShowSettings(true)}
        />

        <DndContext sensors={sensors} collisionDetection={closestCorners}
          onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1.05fr] 2xl:grid-cols-[1.25fr_1fr_1.05fr_1fr] gap-4 items-start">
            {['left', 'mid', 'right', 'far'].map((col) => (
              <div key={col} className={[
                col === 'right' ? 'md:col-span-2 lg:col-span-1' : '',
                col === 'far'   ? 'hidden 2xl:block' : '',
              ].filter(Boolean).join(' ') || undefined}>
                <DroppableColumn id={col} items={activeLayout[col] ?? []} unlocked={unlocked} isAnyDragging={!!activeId} tileMap={tileMap} onRemoveTile={removeTileFromLayout} availableTiles={availableTiles} onAddTile={addTileToColumn} />
              </div>
            ))}
          </div>

          <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
            {activeId && (
              <div className="rounded-card bg-surface shadow-lg opacity-80 p-[22px] border border-stroke"
                style={{ transform: 'rotate(0.8deg) scale(1.015)' }}>
                <div className="text-[13px] font-medium text-text-2">{tileLabels[activeId] ?? activeId}</div>
                <div className="mt-2 h-8 bg-surface-2 rounded-xl" />
                <div className="mt-1.5 h-4 bg-surface-2 rounded-xl w-2/3" />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
