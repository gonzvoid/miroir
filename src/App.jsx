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
import Header, { TopBar, BottomDock } from './components/Header';
import Focal from './components/Focal';
import ImageTile from './components/ImageTile';
import LayoutEditor from './components/LayoutEditor';
import SettingsPanel from './components/SettingsPanel';
import { useUpdater } from './lib/useUpdater';
import {
  Timeline, DailyLoops, Summary, Countdown, Sources,
  MoodPanel, CalCard, TaskHistory, Doodle, LunchMenu,
  FocusTile, ProjectsTile, BooksTile, TripTile, LiveCanvas,
  WorldClockTile, InspoLinksTile, PlantTrackerTile, SocialPlannerTile,
  SunArcTile, MoonPhaseTile, WeatherOrbTile,
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
  accentColor: 'slate', language: 'en', weekStart: 'mon', tileStyle: 'flat', _v: 0,
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
        <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-0.5 p-0.5 rounded-full"
          style={{
            background: 'color-mix(in srgb, var(--surface) 68%, transparent)',
            backdropFilter: 'blur(14px) saturate(150%)',
            WebkitBackdropFilter: 'blur(14px) saturate(150%)',
            boxShadow: '0 2px 12px -4px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.08)',
          }}>
          <button
            onClick={() => onRemove?.(id)}
            className="w-7 h-7 grid place-items-center rounded-full text-text-3 hover:text-[#c0564b] hover:bg-red-50 transition-colors">
            <X size={12} />
          </button>
          <div {...attributes} {...listeners}
            className="w-7 h-7 grid place-items-center rounded-full cursor-grab active:cursor-grabbing text-text-3 hover:text-text hover:bg-surface-2 transition-colors">
            <GripVertical size={14} />
          </div>
        </div>
      )}
      <div style={unlocked ? { pointerEvents: 'none', userSelect: 'none' } : undefined}>
        {children}
      </div>
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
        className="w-full rounded-card border-2 border-dashed flex items-center justify-center transition-colors hover:bg-surface-2"
        style={{ minHeight: 60, opacity: 0.65, borderColor: 'var(--text-3)' }}>
        <Plus size={13} className="text-text-3" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-surface border border-stroke rounded-xl shadow-lg z-30 min-w-[170px] overflow-hidden"
          onMouseLeave={() => setOpen(false)}>
          <div className="p-1.5 max-h-[220px] overflow-y-auto">
            {available.map((t) => (
              <button key={t.id} onClick={() => { onAdd(t.id); setOpen(false); }}
                className="flex w-full items-center px-2.5 py-2 rounded-lg hover:bg-surface-2 text-text-2 hover:text-text text-[12.5px] text-left transition-colors">
                {t.label}
              </button>
            ))}
          </div>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 rounded-b-xl"
            style={{ background: 'linear-gradient(to bottom, transparent, var(--surface))' }} />
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
const ONBOARDING_LAYOUT = {
  left:  ['focal', 'canvas', 'tasklog'],
  mid:   ['social', 'image', 'projects'],
  right: ['worldclock', 'mood', 'calendar', 'focus', 'countdown', 'timeline'],
  far:   [],
};

function OnboardingScreen({ onDone, onClose }) {
  const [name, setName]   = useState('');
  const [theme, setTheme] = useState('light');
  const [bg, setBg]       = useState(null);
  const fileRef           = useRef(null);

  useEffect(() => {
    if (!onClose) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const finish = () => {
    if (!name.trim()) return;
    onDone(name.trim(), theme, bg);
  };

  const onBgFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBg(f.path || URL.createObjectURL(f));
  };

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Background — place onboarding-bg.jpg in src/assets/ to use the painting */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(160deg, #1a3a6b 0%, #2d5f9e 18%, #c8883a 46%, #d94e1e 65%, #8b1a10 82%, #1a0f0a 100%)',
      }} />
      <img
        src={new URL('./assets/onboarding1.png', import.meta.url).href}
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => { e.target.style.display = 'none'; }}
        alt=""
      />
      {/* Film grain */}
      <div className="absolute inset-0 pointer-events-none" style={{
        opacity: 0.55,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '256px 256px',
      }} />
      {/* Readability overlay */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.52) 100%)' }} />

      {/* Centered content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-8 text-center">

        <div className="text-[10px] tracking-[0.28em] uppercase text-white/50 mb-10 font-medium">
          Miroir
        </div>

        <h1 className="text-[54px] font-semibold tracking-tight text-white leading-[1.04] mb-4">
          Your personal<br />command center.
        </h1>
        <p className="text-white/60 text-[16px] mb-12 leading-relaxed">
          Designed to keep you focused<br />on what matters.
        </p>

        {/* Name */}
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && finish()}
          placeholder="What should we call you?"
          className="w-full max-w-[360px] mb-7
            bg-white/10 backdrop-blur-sm border border-white/20
            rounded-2xl px-5 py-4 text-[15px] text-white text-center outline-none
            placeholder:text-white/35 focus:border-white/55 transition-colors" />

        {/* Theme picker */}
        <div className="flex gap-2 mb-5">
          {[
            { id: 'light', label: 'Light' },
            { id: 'dark',  label: 'Dark'  },
            { id: 'cream', label: 'Cream' },
          ].map((t) => (
            <button key={t.id} onClick={() => setTheme(t.id)}
              className={`px-5 py-2 rounded-full text-[13px] font-medium transition-all border
                ${theme === t.id
                  ? 'bg-white text-neutral-900 border-white'
                  : 'bg-white/10 text-white/65 border-white/20 hover:bg-white/20'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Dashboard BG picker */}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onBgFile} />
        <button onClick={() => fileRef.current?.click()}
          className="text-white/40 text-[13px] mb-11 hover:text-white/70 transition-colors">
          {bg ? '✓ Background image selected' : '+ Set dashboard background'}
        </button>

        {/* CTA */}
        <button onClick={finish} disabled={!name.trim()}
          className="px-12 py-[14px] rounded-2xl text-[14px] font-semibold
            bg-white text-neutral-900 disabled:opacity-25 hover:opacity-80 transition-opacity
            active:scale-[0.99]">
          Get started →
        </button>

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
  const updater = useUpdater();
  const composerRef = useRef(null);
  const now = new Date();

  useEffect(() => { document.documentElement.setAttribute('data-theme', s.theme); }, [s.theme]);
  useEffect(() => { document.documentElement.setAttribute('data-tile-style', s.tileStyle ?? 'flat'); }, [s.tileStyle]);
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

  // R → toggle layout unlock mode; Esc → exit unlock mode
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        setUnlocked((v) => !v);
      }
      if (e.key === 'Escape') {
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        setUnlocked(false);
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
    sun:         <SunArcTile />,
    moon:        <MoonPhaseTile />,
    weather:     <WeatherOrbTile theme={s.theme} tileStyle={s.tileStyle ?? 'flat'} />,
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
  if (!loaded) return <div style={{ position: 'fixed', inset: 0, borderRadius: 12, overflow: 'hidden' }} className="grid place-items-center text-text-3">·</div>;

  if (s.name === null || s.name === undefined) {
    return (
      <div style={{ position: 'fixed', inset: 0, borderRadius: 12, overflow: 'hidden', transform: 'translateZ(0)' }}>
        <OnboardingScreen onDone={(name, theme, bg) => {
          patch('name', name);
          patch('theme', theme);
          patch('clockFace', 'orb');
          patch('layout', ONBOARDING_LAYOUT);
          if (bg) patch('bg', bg);
        }} />
      </div>
    );
  }

  // Preview onboarding overlay (Ctrl+Shift+O) — does NOT touch the store
  if (previewOnboarding) {
    return (
      <div style={{ position: 'fixed', inset: 0, borderRadius: 12, overflow: 'hidden', transform: 'translateZ(0)' }}>
        <OnboardingScreen
          theme={s.theme}
          onClose={() => setPreviewOnboarding(false)}
          onDone={() => setPreviewOnboarding(false)}
        />
      </div>
    );
  }

  const tileLabels = TILE_CATALOG.reduce((acc, t) => { acc[t.id] = t.label; return acc; }, {});

  return (
    <div style={{
      position: 'fixed', inset: 0,
      borderRadius: 12, overflow: 'hidden',
      transform: 'translateZ(0)',
    }}>
      <div className="absolute inset-0 bg-canvas" style={{ zIndex: -20 }} />
      {s.bg && (
        <div className="absolute inset-0" style={{ zIndex: -10 }}>
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
        <SettingsPanel s={s} patch={patch} updater={updater} onClose={() => setShowSettings(false)} />
      )}

      {/* scrollable content */}
      <div style={{ height: '100%', overflowY: 'auto' }}>
        {/* thin sticky top strip — drag area + window controls only */}
        <div className="sticky top-0 z-40" style={{
          paddingBottom: 64,
          background: s.bg
            ? 'color-mix(in srgb, var(--canvas) 38%, transparent)'
            : 'color-mix(in srgb, var(--canvas) 90%, transparent)',
          backdropFilter: s.bg ? 'blur(14px)' : undefined,
          WebkitBackdropFilter: s.bg ? 'blur(14px)' : undefined,
          WebkitMaskImage: 'linear-gradient(to bottom, black 0, black 32px, rgba(0,0,0,0.97) 38px, rgba(0,0,0,0.90) 44px, rgba(0,0,0,0.78) 51px, rgba(0,0,0,0.65) 57px, rgba(0,0,0,0.50) 63px, rgba(0,0,0,0.35) 69px, rgba(0,0,0,0.22) 75px, rgba(0,0,0,0.10) 82px, rgba(0,0,0,0.03) 88px, transparent 94px)',
          maskImage: 'linear-gradient(to bottom, black 0, black 32px, rgba(0,0,0,0.97) 38px, rgba(0,0,0,0.90) 44px, rgba(0,0,0,0.78) 51px, rgba(0,0,0,0.65) 57px, rgba(0,0,0,0.50) 63px, rgba(0,0,0,0.35) 69px, rgba(0,0,0,0.22) 75px, rgba(0,0,0,0.10) 82px, rgba(0,0,0,0.03) 88px, transparent 94px)',
          pointerEvents: 'none',
        }}>
          <div style={{ pointerEvents: 'auto' }}>
            <TopBar />
          </div>
        </div>

        <div className="px-[26px] pb-24">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1.05fr] gap-4 items-start">
              {['left', 'mid', 'right', 'far'].map((col) => (
                <div key={col} className={[
                  col === 'right' ? 'md:col-span-2 lg:col-span-1' : '',
                  col === 'far'   ? 'hidden' : '',
                ].filter(Boolean).join(' ') || undefined}>
                  <DroppableColumn id={col} items={activeLayout[col] ?? []} unlocked={unlocked} isAnyDragging={!!activeId} tileMap={tileMap} onRemoveTile={removeTileFromLayout} availableTiles={availableTiles} onAddTile={addTileToColumn} />
                </div>
              ))}
            </div>

            <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
              {activeId && (
                <div className="rounded-card overflow-hidden border border-stroke"
                  style={{
                    transform: 'rotate(0.8deg) scale(1.015)',
                    background: 'var(--surface)',
                    boxShadow: '0 8px 32px -8px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.06)',
                    padding: '18px 22px',
                    minWidth: 120,
                  }}>
                  <div className="text-[12px] text-text-3">{tileLabels[activeId] ?? activeId}</div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* bottom blur vignette */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 110,
        background: s.bg
          ? 'color-mix(in srgb, var(--canvas) 38%, transparent)'
          : 'color-mix(in srgb, var(--canvas) 90%, transparent)',
        backdropFilter: s.bg ? 'blur(14px)' : undefined,
        WebkitBackdropFilter: s.bg ? 'blur(14px)' : undefined,
        WebkitMaskImage: 'linear-gradient(to top, black 0, black 32px, rgba(0,0,0,0.97) 38px, rgba(0,0,0,0.90) 44px, rgba(0,0,0,0.78) 51px, rgba(0,0,0,0.65) 57px, rgba(0,0,0,0.50) 63px, rgba(0,0,0,0.35) 69px, rgba(0,0,0,0.22) 75px, rgba(0,0,0,0.10) 82px, rgba(0,0,0,0.03) 88px, transparent 100px)',
        maskImage: 'linear-gradient(to top, black 0, black 32px, rgba(0,0,0,0.97) 38px, rgba(0,0,0,0.90) 44px, rgba(0,0,0,0.78) 51px, rgba(0,0,0,0.65) 57px, rgba(0,0,0,0.50) 63px, rgba(0,0,0,0.35) 69px, rgba(0,0,0,0.22) 75px, rgba(0,0,0,0.10) 82px, rgba(0,0,0,0.03) 88px, transparent 100px)',
        zIndex: 39,
        pointerEvents: 'none',
      }} />
      {/* bottom dock */}
      <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 40 }}>
        <BottomDock
          theme={s.theme} setTheme={(v) => patch('theme', v)}
          unlocked={unlocked} setUnlocked={setUnlocked}
          onOpenLayoutEditor={() => setShowLayoutEditor(true)}
          onOpenSettings={() => setShowSettings(true)}
          hasBg={!!s.bg}
          updateReady={updater.status === 'available' || updater.status === 'downloaded'}
        />
      </div>
    </div>
  );
}
