import { useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import Focal from '../components/Focal.jsx';
import { WorldClockTile, FocusTile, PlantTrackerTile, MoodGauge } from '../components/Tiles.jsx';
import { DEFAULT_TAGS, DEFAULT_MOOD_METRICS, ymd, addDays } from '../lib/utils.js';
import './islands.css';

const today = new Date();

const SEED_TASKS = [
  { id: 't1', title: 'Plan holidays with Kate', lane: 'personal', date: ymd(today),            state: 1, status: 'started' },
  { id: 't2', title: 'Send the Q3 proposal',     lane: 'work',     date: ymd(today),            state: 0 },
  { id: 't3', title: 'Water the plants',         lane: 'personal', date: ymd(today),            state: 0 },
  { id: 't4', title: 'Reply to the design feedback', lane: 'work', date: ymd(today),           state: 0 },
  { id: 't5', title: 'Gym session',              lane: 'health',   date: ymd(addDays(today,1)), state: 0 },
  { id: 't6', title: 'Call the dentist',         lane: 'health',   date: ymd(addDays(today,1)), state: 0 },
  { id: 't7', title: 'Research new tools',       lane: 'work',     date: ymd(addDays(today,3)), state: 0, status: 'hold' },
  { id: 't8', title: 'Draft the newsletter',     lane: 'work',     date: ymd(addDays(today,4)), state: 0 },
  { id: 't9', title: 'Pick a birthday gift',     lane: 'family',   date: ymd(addDays(today,5)), state: 0 },
  { id: 't10', title: 'Book the flights',        lane: 'personal', date: ymd(addDays(today,10)),state: 0 },
  { id: 't11', title: 'Renew the subscription',  lane: 'personal', date: ymd(addDays(today,14)),state: 0 },
  { id: 't12', title: 'Plan the studio offsite', lane: 'work',     date: ymd(addDays(today,18)),state: 0 },
];

/* ── Things to do (real Focal component, local demo state) ── */
function TodoDemo() {
  const [tasks, setTasks] = useState(SEED_TASKS);
  const composerRef = useRef(null);

  const addTask = (title, tagId, date) => {
    if (!title.trim()) return;
    setTasks((t) => [...t, { id: Date.now() + '' + Math.random(), title: title.trim(), lane: tagId, date: date || null, state: 0 }]);
  };
  const cycleTask = (id) => setTasks((t) => t.map((x) => {
    if (x.id !== id) return x;
    const ns = ((x.state || 0) + 1) % 3;
    return { ...x, state: ns, completedAt: ns === 2 ? ymd(new Date()) : (ns === 0 ? null : x.completedAt) };
  }));
  const delTask       = (id) => setTasks((t) => t.filter((x) => x.id !== id));
  const editTask      = (id, title) => setTasks((t) => t.map((x) => x.id === id ? { ...x, title } : x));
  const setTaskStatus = (id, status) => setTasks((t) => t.map((x) => x.id === id ? { ...x, status: x.status === status ? null : status } : x));
  const setTaskLane   = (id, laneId) => setTasks((t) => t.map((x) => x.id === id ? { ...x, lane: laneId } : x));
  const moveTask      = (id, laneId) => {
    const d = laneId === 'today' ? ymd(today) : laneId === 'tomorrow' ? ymd(addDays(today, 1)) : laneId === 'week' ? ymd(addDays(today, 4)) : ymd(addDays(today, 14));
    setTasks((t) => t.map((x) => x.id === id ? { ...x, date: d } : x));
  };
  const reorderTask = (dragId, overId) => setTasks((t) => {
    const a = [...t]; const from = a.findIndex((x) => x.id === dragId); const to = a.findIndex((x) => x.id === overId);
    if (from < 0 || to < 0) return t;
    const [m] = a.splice(from, 1); a.splice(to, 0, m); return a;
  });

  return (
    <Focal tasks={tasks} addTask={addTask} cycleTask={cycleTask} delTask={delTask}
      editTask={editTask} setTaskStatus={setTaskStatus} setTaskLane={setTaskLane}
      moveTask={moveTask} reorderTask={reorderTask} composerRef={composerRef} tags={DEFAULT_TAGS} />
  );
}

/* ── World clock (real WorldClockTile, local demo state) ── */
function ClockDemo() {
  const [clocks, setClocks] = useState([
    { id: 'c1', city: 'Madrid',   tz: 'Europe/Madrid' },
    { id: 'c2', city: 'New York', tz: 'America/New_York' },
    { id: 'c3', city: 'Tokyo',    tz: 'Asia/Tokyo' },
  ]);
  const [face, setFace] = useState('orb');
  return <WorldClockTile clocks={clocks} setClocks={setClocks} clockFace={face} setClockFace={setFace} />;
}

/* ── Focus timer (real FocusTile, local demo) ── */
function FocusDemo() {
  return <FocusTile pomodoroLog={[]} onLogSession={() => {}} />;
}

/* ── Plants (real PlantTrackerTile, local demo state) ── */
function PlantsDemo() {
  const ago = (d) => new Date(Date.now() - d * 86400000).toISOString();
  const [plants, setPlants] = useState([
    { id: 'pl1', name: 'Monstera',    icon: 'leaf',   color: '#56b49a', intervalDays: 7,  lastWatered: ago(5) },
    { id: 'pl2', name: 'Hortensia',   icon: 'flower', color: '#86c6b0', intervalDays: 5,  lastWatered: ago(4) },
    { id: 'pl3', name: 'Snake plant', icon: 'tree',   color: '#7aa86a', intervalDays: 14, lastWatered: ago(10) },
  ]);
  return <PlantTrackerTile plants={plants} setPlants={setPlants} />;
}

/* ── Mood (real MoodGauge, local demo state) ── */
function MoodDemo() {
  const day = ymd(today);
  const [log, setLog] = useState({ [day]: { happiness: 64, productivity: 58, anger: 26 } });
  const setMetric = (k, metricId, pct) =>
    setLog((m) => ({ ...m, [k]: { ...(m[k] || {}), [metricId]: pct } }));
  return <MoodGauge metrics={DEFAULT_MOOD_METRICS} log={log} day={day} setMetric={setMetric} />;
}

function mount(id, Comp) {
  const node = document.getElementById(id);
  if (!node) return;
  createRoot(node).render(
    <div className="miroir-island" data-theme="light"><Comp /></div>
  );
}

function init() {
  mount('todo-demo', TodoDemo);
  mount('tg-clock', ClockDemo);
  mount('tg-focus', FocusDemo);
  mount('tg-plants', PlantsDemo);
  mount('tg-mood', MoodDemo);
}

if (document.readyState !== 'loading') init();
else document.addEventListener('DOMContentLoaded', init);
