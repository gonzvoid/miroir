// date helpers — all local-time to avoid the UTC off-by-one bug
export const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
export const addDays = (d,n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
export const sameDay = (a,b) => startOfDay(a).getTime() === startOfDay(b).getTime();
export const ymd = (d) => { const x = startOfDay(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`; };
export const parseYmd = (s) => { const [y,m,d] = String(s).split('-').map(Number); return new Date(y,m-1,d); };
export const WEEKDAYS = ['M','T','W','T','F','S','S'];

export function bucketOf(dateStr){
  if(!dateStr) return 'future';
  const diff = Math.round((startOfDay(parseYmd(dateStr)) - startOfDay(new Date()))/86400000);
  if(diff<=0) return 'today';
  if(diff===1) return 'tomorrow';
  if(diff<=7) return 'week';
  return 'future';
}

export const LANES = [
  { id:'today', label:'Today' },
  { id:'tomorrow', label:'Tomorrow' },
  { id:'week', label:'This week' },
  { id:'future', label:'Future' },
];
export const STATUSES = [
  { id:'pending',   label:'Pending' },
  { id:'started',   label:'Started' },
  { id:'hold',      label:'On hold' },
  { id:'postponed', label:'Postponed' },
];

export const MOODS = [
  { id:'great', color:'var(--m-great)', emoji:'😊', label:'Great' },
  { id:'good',  color:'var(--m-good)',  emoji:'🙂', label:'Good' },
  { id:'okay',  color:'var(--m-okay)',  emoji:'😐', label:'Okay' },
  { id:'low',   color:'var(--m-low)',   emoji:'😕', label:'Low' },
  { id:'rough', color:'var(--m-rough)', emoji:'😩', label:'Rough' },
];
export const MOOD_SCORE = { great:5, good:4, okay:3, low:2, rough:1 };
export const moodColor = (id) => MOODS.find(m=>m.id===id)?.color || 'transparent';
export const SEGMENTS = [
  { id:'morning', label:'Morning' },
  { id:'midday',  label:'Midday' },
  { id:'evening', label:'Evening' },
];

/* Mood gauge — graded fills, anchored to the cell. Each metric picks a grade.
   `grad` is the CSS gradient (top = high value, bottom = low). `tint` is the
   empty-cell background; `text`/`label` are the deep on-tint colors. */
export const MOOD_GRADES = {
  green: {
    id:'green', tint:'#E7F0EE', text:'#1f5e57', label:'#2f7068', dot:'#46B58A',
    grad:'linear-gradient(180deg,#46B58A 0%,#3E86CF 58%,#2C6BB6 100%)',
  },
  graphite: {
    id:'graphite', tint:'#EDEDEB', text:'#2c2c2a', label:'#5f5e5a', dot:'#45433F',
    grad:'linear-gradient(180deg,#45433F 0%,#8C8B85 100%)',
  },
  redyellow: {
    id:'redyellow', tint:'#F7ECDB', text:'#8a3a1a', label:'#a8552c', dot:'#DA5040',
    grad:'linear-gradient(180deg,#DA5040 0%,#E89A3F 55%,#ECC74C 100%)',
  },
};
export const DEFAULT_MOOD_METRICS = [
  { id:'happiness',    label:'Happiness',    grade:'green' },
  { id:'productivity', label:'Productivity', grade:'graphite' },
  { id:'anger',        label:'Anger',        grade:'redyellow' },
];

export const dateForLane = (l) => {
  const t = new Date();
  if(l==='today') return ymd(t);
  if(l==='tomorrow') return ymd(addDays(t,1));
  if(l==='week') return ymd(addDays(t,4));
  return ymd(addDays(t,14));
};

export const DEFAULT_CALENDARS = [
  { id:'work', name:'Work', color:'var(--accent)', connected:true },
  { id:'life', name:'Personal', color:'var(--text-3)', connected:true },
];

export const DEFAULT_TAGS = [
  { id:'work',     label:'Work',     color:'#3D5A40' },
  { id:'personal', label:'Personal', color:'#5A7D9A' },
  { id:'family',   label:'Family',   color:'#8B5A80' },
  { id:'health',   label:'Health',   color:'#7A9D6F' },
];

export const TAGS_PRESETS = {
  design: [
    { id: 'client',   label: 'Client work',  color: '#3D5A40', category: 'work'     },
    { id: 'personal', label: 'Personal',      color: '#5A7D9A', category: 'personal' },
    { id: 'explore',  label: 'Experiments',   color: '#E3B95E', category: 'fun'      },
  ],
  dev: [
    { id: 'work',     label: 'Work',          color: '#3D5A40', category: 'work'     },
    { id: 'projects', label: 'Side projects', color: '#E3B95E', category: 'fun'      },
    { id: 'personal', label: 'Personal',      color: '#5A7D9A', category: 'personal' },
  ],
  gtd: [
    { id: 'work',     label: 'Work',          color: '#3D5A40', category: 'work'     },
    { id: 'personal', label: 'Personal',      color: '#5A7D9A', category: 'personal' },
    { id: 'health',   label: 'Health',        color: '#7A9D6F', category: 'personal' },
    { id: 'fun',      label: 'Fun',           color: '#E3B95E', category: 'fun'      },
  ],
  personal: [
    { id: 'family',   label: 'Family',        color: '#8B5A80', category: 'personal' },
    { id: 'health',   label: 'Health',        color: '#7A9D6F', category: 'personal' },
    { id: 'social',   label: 'Social',        color: '#5A7D9A', category: 'personal' },
    { id: 'fun',      label: 'Fun',           color: '#E3B95E', category: 'fun'      },
  ],
};

export const DEFAULT_LOOPS = [
  { id:'l1', label:'Gym', goal:5, done:0 },
  { id:'l2', label:'Read', goal:5, done:0 },
  { id:'l3', label:'No phone before 9', goal:7, done:0 },
  { id:'l4', label:'Cook at home', goal:7, done:0 },
];

export const COUNTDOWNS = [
  { label:'Wedding', date:'2026-10-10' },
  { label:'Honeymoon', date:'2026-10-12' },
];

// All tiles available in the system
export const TILE_CATALOG = [
  { id:'focal',      label:'Things to do' },
  { id:'tasklog',    label:'Task history' },
  { id:'summary',    label:'Summary' },
  { id:'loops',      label:'Daily loops' },
  { id:'doodle',     label:'Daily doodle' },
  { id:'lunchMenu',  label:'Weekly menu' },
  { id:'image',      label:'Photo slide' },
  { id:'countdown',  label:'Countdown' },
  { id:'timeline',   label:'Today' },
  { id:'sources',    label:'Calendars' },
  { id:'calendar',   label:'Calendar' },
  { id:'mood',       label:'Mood' },
  { id:'focus',      label:'Focus timer' },
  { id:'projects',   label:'Project tracker' },
  { id:'books',      label:'Book tracker' },
  { id:'trip',       label:'Next trip' },
  { id:'canvas',     label:'Live canvas' },
  { id:'worldclock', label:'World clock' },
  { id:'inspolinks', label:'Inspiration links' },
  { id:'plants',     label:'Plant tracker' },
  { id:'social',     label:'Social planner' },
  { id:'sun',        label:'Sun arc'        },
  { id:'moon',       label:'Moon phase'     },
  { id:'weather',    label:'Weather orb'    },
];

// Accent colour presets — id maps to data-accent attribute
export const ACCENT_PRESETS = [
  { id:'slate',  label:'Slate',  dot:'#334155' },
  { id:'forest', label:'Forest', dot:'#3D5A40' },
  { id:'navy',   label:'Navy',   dot:'#1D4ED8' },
  { id:'violet', label:'Violet', dot:'#7C3AED' },
  { id:'rose',   label:'Rose',   dot:'#E11D48' },
  { id:'amber',  label:'Amber',  dot:'#D97706' },
];

// Layout presets per work type (chosen at onboarding)
export const LAYOUT_PRESETS = {
  design: {
    left: ['focal', 'tasklog'],
    mid:  ['doodle', 'image', 'countdown'],
    right: ['mood', 'calendar'],
    far:  [],
  },
  dev: {
    left: ['focal', 'summary'],
    mid:  ['loops', 'timeline'],
    right: ['mood', 'calendar'],
    far:  [],
  },
  gtd: {
    left: ['focal'],
    mid:  ['loops', 'timeline', 'summary'],
    right: ['mood', 'calendar'],
    far:  [],
  },
  personal: {
    left: ['focal', 'tasklog'],
    mid:  ['loops', 'image', 'countdown'],
    right: ['mood', 'calendar'],
    far:  [],
  },
};

// Kept for promo / demo use — not auto-seeded anymore
export function seedEvents(){
  const t = startOfDay(new Date());
  const mk = (cal,title,off,time,loc) => ({ id:cal+title+off, calendarId:cal, title, start:ymd(addDays(t,off)), time, loc });
  return [
    mk('life','Morning run + coffee',0,'08:00','Park loop'),
    mk('work','Standup',0,'09:00','Zoom'),
    mk('work','Memo Paris review',0,'11:00',''),
    mk('life','Lunch w/ Kateryna',0,'13:00',''),
    mk('work','Render farm check',0,'16:30',''),
    mk('life','Gym — strength',0,'19:00',''),
    mk('work','Client call: CIN',1,'10:00',''),
    mk('life','Leaf — vet',2,'12:30',''),
    mk('work','Tiovivo UI handoff',3,'15:00',''),
    mk('work','Invoice round',6,'09:00',''),
  ];
}

// IDs of the seed events — used for one-time migration
export const SEED_EVENT_IDS = new Set([
  'lifeMorning run + coffee0','workStandup0','workMemo Paris review0',
  'lifeLunch w/ Kateryna0','workRender farm check0','lifeGym — strength0',
  'workClient call: CIN1','lifeLeaf — vet2','workTiovivo UI handoff3','workInvoice round6',
]);
