import { useEffect, useRef, useState } from 'react';
import { X, Check, ImageIcon } from './icons';
import { ACCENT_PRESETS, MOOD_GRADES, DEFAULT_MOOD_METRICS, ymd } from '../lib/utils';

/* ── helpers ──────────────────────────────────────────────────── */
function Row({ label, hint, children }) {
  return (
    <div className="flex items-start justify-between gap-6 py-5 border-b border-stroke last:border-0">
      <div className="min-w-0 pt-0.5">
        <div className="text-[13.5px] font-medium text-text">{label}</div>
        {hint && <div className="text-[12px] text-text-3 mt-0.5 leading-snug">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Seg({ options, value, onChange }) {
  return (
    <div className="flex bg-surface-2 rounded-xl p-0.5">
      {options.map(([val, label]) => (
        <button key={val} onClick={() => onChange(val)}
          className={`px-3.5 py-1.5 rounded-[10px] text-[12.5px] transition-all
            ${value === val ? 'bg-surface text-text font-medium shadow-sm' : 'text-text-3 hover:text-text-2'}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

/* ── Obsidian import sub-component ───────────────────────────── */
function ObsidianImport({ onImport }) {
  const [scanning, setScanning]   = useState(false);
  const [result, setResult]       = useState(null);  // { incomplete, complete }
  const [vaultPath, setVaultPath] = useState('');
  const [done, setDone]           = useState(false);

  const pick = async () => {
    const p = await window.lumen.obsidianPickVault();
    if (!p) return;
    setVaultPath(p);
    setScanning(true);
    setResult(null);
    const r = await window.lumen.obsidianScan(p);
    setScanning(false);
    setResult(r);
  };

  const confirm = () => {
    if (!result) return;
    onImport(result);
    setDone(true);
  };

  if (done) return (
    <div className="flex items-center gap-2 text-[13px] text-text-2 py-2">
      <Check size={14} className="text-accent" style={{ color: 'var(--accent)' }} />
      Tasks imported successfully.
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] text-text-2 leading-relaxed">
        Scans all <code className="bg-surface-2 px-1.5 py-0.5 rounded text-[12px]">.md</code> files
        in your vault for checkbox tasks{' '}
        <code className="bg-surface-2 px-1.5 py-0.5 rounded text-[12px]">- [ ]</code> and imports
        them. Due dates from the Tasks plugin{' '}
        <code className="bg-surface-2 px-1.5 py-0.5 rounded text-[12px]">📅 YYYY-MM-DD</code> are
        also detected.
      </p>

      <button onClick={pick} disabled={scanning}
        className="self-start px-4 py-2 rounded-xl bg-surface-2 border border-stroke
          text-[13px] text-text-2 hover:text-text transition-colors disabled:opacity-50">
        {scanning ? 'Scanning…' : vaultPath ? 'Pick another vault' : 'Pick vault folder'}
      </button>

      {vaultPath && !scanning && (
        <div className="text-[11px] text-text-3 font-mono truncate max-w-sm">{vaultPath}</div>
      )}

      {result && !scanning && (
        <div className="bg-surface-2 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex gap-6">
            <div>
              <div className="text-[26px] font-semibold tracking-tight">{result.incomplete.length}</div>
              <div className="text-[12px] text-text-2">open tasks</div>
            </div>
            <div>
              <div className="text-[26px] font-semibold tracking-tight text-text-3">{result.complete.length}</div>
              <div className="text-[12px] text-text-2">completed</div>
            </div>
          </div>

          {result.incomplete.length > 0 && (
            <div className="max-h-40 overflow-y-auto flex flex-col gap-1 border-t border-stroke pt-3">
              {result.incomplete.slice(0, 12).map((t, i) => (
                <div key={i} className="flex items-start gap-2 text-[12.5px]">
                  <span className="w-3 h-3 rounded-[3px] border border-stroke mt-0.5 shrink-0" />
                  <span className="text-text-2 leading-snug">{t.text}</span>
                  {t.date && <span className="text-[11px] text-text-3 shrink-0 ml-auto">{t.date}</span>}
                </div>
              ))}
              {result.incomplete.length > 12 && (
                <div className="text-[11.5px] text-text-3">+{result.incomplete.length - 12} more…</div>
              )}
            </div>
          )}

          {result.incomplete.length === 0 && result.complete.length === 0 && (
            <div className="text-[13px] text-text-3">No tasks found in this vault.</div>
          )}

          {(result.incomplete.length > 0 || result.complete.length > 0) && (
            <button onClick={confirm}
              className="self-start px-5 py-2 rounded-xl bg-text text-canvas text-[13px] font-medium
                hover:opacity-75 transition-opacity">
              Import {result.incomplete.length + result.complete.length} tasks
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── JSON backup ──────────────────────────────────────────────── */
function BackupSection({ s }) {
  const fileRef = useRef();
  const [importStatus, setImportStatus] = useState(null);
  const [dataPath, setDataPath] = useState('');

  useEffect(() => {
    window.lumen?.getDataPath?.().then((p) => setDataPath(p || ''));
  }, []);

  const exportData = async () => {
    const json = JSON.stringify(s, null, 2);
    const name = `miroir-backup-${ymd(new Date())}.json`;
    await window.lumen.exportData(json, name);
  };

  const importData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!Array.isArray(data.tasks)) throw new Error('not a Miroir backup');
        // full restore — reload to apply
        window.lumen.saveState(data).then(() => {
          setImportStatus('ok');
          setTimeout(() => window.location.reload(), 1200);
        });
      } catch {
        setImportStatus('error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div>
      <Row label="Export data" hint="Download a full backup of all your tasks, events, moods and settings.">
        <button onClick={exportData}
          className="px-4 py-2 rounded-xl bg-surface-2 border border-stroke text-[13px] text-text-2 hover:text-text transition-colors">
          Export JSON
        </button>
      </Row>

      <Row label="Restore backup" hint="Replace all data with a previously exported Miroir backup file.">
        <div className="flex flex-col items-end gap-1.5">
          <button onClick={() => fileRef.current.click()}
            className="px-4 py-2 rounded-xl bg-surface-2 border border-stroke text-[13px] text-text-2 hover:text-text transition-colors">
            Choose file…
          </button>
          <input ref={fileRef} type="file" accept=".json" hidden onChange={importData} />
          {importStatus === 'ok'    && <span className="text-[11.5px] text-green-500">Restored — reloading…</span>}
          {importStatus === 'error' && <span className="text-[11.5px] text-red-400">Invalid backup file</span>}
        </div>
      </Row>

      <Row label="Storage location" hint="Where miroir-data.json is saved on this machine.">
        <div className="flex flex-col items-end gap-2">
          {dataPath && (
            <div className="text-[11.5px] text-text-3 font-mono text-right max-w-[260px] leading-relaxed break-all">
              {dataPath}
            </div>
          )}
          <button
            onClick={async () => {
              const newPath = await window.lumen.pickStorageDir();
              if (newPath) setDataPath(newPath);
            }}
            className="px-4 py-2 rounded-xl bg-surface-2 border border-stroke text-[13px] text-text-2 hover:text-text transition-colors">
            Change folder…
          </button>
        </div>
      </Row>
    </div>
  );
}

/* ── Background image picker ─────────────────────────────────── */
function BgPicker({ bg, onSet, onClear }) {
  const fileRef = useRef();
  const onFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => onSet(r.result); r.readAsDataURL(f);
    e.target.value = '';
  };
  return (
    <div className="flex items-center gap-2">
      {bg ? (
        <>
          <div className="w-10 h-10 rounded-xl bg-cover bg-center border border-stroke shrink-0"
            style={{ backgroundImage: `url(${bg})` }} />
          <button onClick={() => fileRef.current.click()}
            className="px-3 py-1.5 rounded-xl bg-surface-2 border border-stroke text-[12.5px] text-text-2 hover:text-text transition-colors">
            Swap
          </button>
          <button onClick={onClear}
            className="px-3 py-1.5 rounded-xl bg-surface-2 border border-stroke text-[12.5px] text-text-2 hover:text-text transition-colors">
            Remove
          </button>
        </>
      ) : (
        <button onClick={() => fileRef.current.click()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-2 border border-stroke text-[12.5px] text-text-2 hover:text-text transition-colors">
          <ImageIcon size={13} /> Choose image…
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
    </div>
  );
}

/* ── Updates section ──────────────────────────────────────────── */
function UpdatesSection({ updater }) {
  const { status, info, progress, error, version, check, download, install } = updater;
  const available = status === 'available';
  const ready     = status === 'downloaded';

  return (
    <div>
      <Row label="Current version" hint="The version of Miroir running on this machine.">
        <span className="text-[13px] text-text-2 tabular-nums">{version ? `v${version}` : '—'}</span>
      </Row>

      <Row label="Updates" hint="Miroir checks for updates automatically on launch. You choose when to download and install.">
        <div className="flex flex-col items-end gap-2">
          {!available && !ready && status !== 'downloading' && (
            <button onClick={check} disabled={status === 'checking'}
              className="px-4 py-2 rounded-xl bg-surface-2 border border-stroke text-[13px] text-text-2 hover:text-text transition-colors disabled:opacity-50">
              {status === 'checking' ? 'Checking…' : 'Check for updates'}
            </button>
          )}

          {available && (
            <button onClick={download}
              className="px-4 py-2 rounded-xl bg-text text-canvas text-[13px] font-medium hover:opacity-75 transition-opacity">
              Download v{info?.version}
            </button>
          )}

          {status === 'downloading' && (
            <div className="flex flex-col items-end gap-1.5 w-44">
              <div className="w-full h-1.5 rounded-full bg-surface-2 overflow-hidden">
                <div className="h-full rounded-full transition-[width] duration-300"
                  style={{ width: `${progress}%`, background: 'var(--accent)' }} />
              </div>
              <span className="text-[11.5px] text-text-3 tabular-nums">Downloading… {progress}%</span>
            </div>
          )}

          {ready && (
            <button onClick={install}
              className="px-4 py-2 rounded-xl bg-text text-canvas text-[13px] font-medium hover:opacity-75 transition-opacity">
              Restart to update
            </button>
          )}

          {status === 'not-available' && <span className="text-[11.5px] text-text-3">You're up to date.</span>}
          {status === 'error' && <span className="text-[11.5px] text-red-400 max-w-[240px] text-right leading-snug">{error || 'Update failed'}</span>}
        </div>
      </Row>
    </div>
  );
}

/* ── Main SettingsPanel ───────────────────────────────────────── */
const SECTIONS = [
  { id: 'general',    label: 'General' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'mood',       label: 'Mood' },
  { id: 'data',       label: 'Data & Backup' },
  { id: 'import',     label: 'Import' },
  { id: 'updates',    label: 'Updates' },
];

function MoodSection({ metrics, setMetrics }) {
  const grades = Object.values(MOOD_GRADES);
  const update = (i, changes) => setMetrics((m) => m.map((x, idx) => (idx === i ? { ...x, ...changes } : x)));
  return (
    <div>
      <p className="text-[12px] text-text-3 mb-1 leading-snug">
        Pick the three things you track each day and a colour for each. The first one is shown larger in the tile.
      </p>
      {metrics.map((m, i) => (
        <Row key={i} label={i === 0 ? 'Primary metric' : `Metric ${i + 1}`}>
          <div className="flex items-center gap-3">
            <input value={m.label} maxLength={18}
              onChange={(e) => update(i, { label: e.target.value })}
              className="w-36 text-[13px] bg-surface-2 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-accent" />
            <div className="flex gap-1.5">
              {grades.map((g) => (
                <button key={g.id} onClick={() => update(i, { grade: g.id })} title={g.id}
                  className="w-7 h-7 rounded-lg transition-transform hover:scale-105"
                  style={{ background: g.grad, outline: m.grade === g.id ? '2px solid var(--text)' : 'none', outlineOffset: 2 }} />
              ))}
            </div>
          </div>
        </Row>
      ))}
    </div>
  );
}

export default function SettingsPanel({ s, patch, updater, onClose }) {
  const [section, setSection] = useState('general');

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleObsidianImport = ({ incomplete, complete }) => {
    const now = ymd(new Date());
    const newTasks = [
      ...incomplete.map((t) => ({
        id: Date.now() + Math.random().toString(36).slice(2),
        title: t.text,
        lane: s.tags?.[0]?.id ?? 'work',
        date: t.date || null,
        state: 0,
      })),
      ...complete.map((t) => ({
        id: Date.now() + Math.random().toString(36).slice(2),
        title: t.text,
        lane: s.tags?.[0]?.id ?? 'work',
        date: now,
        state: 2,
        completedAt: now,
      })),
    ];
    patch('tasks', (ts) => [...ts, ...newTasks]);
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-canvas">

      {/* ── left nav ─────────────────────────────────────────── */}
      <div className="w-48 shrink-0 border-r border-stroke flex flex-col p-4 pt-7 gap-0.5">
        <div className="text-[11px] tracking-widest uppercase text-text-3 mb-3 px-2.5">Settings</div>
        {SECTIONS.map(({ id, label }) => (
          <button key={id} onClick={() => setSection(id)}
            className={`text-left px-3 py-2.5 rounded-xl text-[13.5px] transition-colors
              ${section === id
                ? 'bg-surface text-text font-medium shadow-sm'
                : 'text-text-2 hover:text-text hover:bg-surface-2'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── content ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* top bar */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-stroke shrink-0">
          <div className="text-[17px] font-semibold tracking-tight text-text">
            {SECTIONS.find((sec) => sec.id === section)?.label}
          </div>
          <button onClick={onClose}
            className="w-8 h-8 grid place-items-center rounded-full text-text-3 hover:text-text hover:bg-surface-2 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* scrollable body */}
        <div className="flex-1 overflow-y-auto px-8 py-6" style={{ maxWidth: 640 }}>

          {/* ── General ───────────────────────────────────────── */}
          {section === 'general' && (
            <div>
              <Row label="Your name" hint="Shown in the greeting at the top of the dashboard.">
                <input
                  defaultValue={s.name || ''}
                  onBlur={(e) => patch('name', e.target.value.trim() || s.name)}
                  onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                  className="w-44 text-[13px] bg-surface-2 border border-stroke rounded-xl px-3 py-2 outline-none
                    focus:border-text-3 text-right transition-colors" />
              </Row>

              <Row label="Language" hint="Interface language. More translations coming soon.">
                <Seg
                  options={[['en', 'English'], ['es', 'Español']]}
                  value={s.language ?? 'en'}
                  onChange={(v) => patch('language', v)} />
              </Row>

              <Row label="Week starts on" hint="Affects the calendar and weekly views.">
                <Seg
                  options={[['mon', 'Monday'], ['sun', 'Sunday']]}
                  value={s.weekStart ?? 'mon'}
                  onChange={(v) => patch('weekStart', v)} />
              </Row>
            </div>
          )}

          {/* ── Appearance ────────────────────────────────────── */}
          {section === 'appearance' && (
            <div>
              <Row label="Theme" hint="Light, dark, or warm cream.">
                <Seg
                  options={[['light', 'Light'], ['dark', 'Dark'], ['cream', 'Cream']]}
                  value={s.theme ?? 'light'}
                  onChange={(v) => patch('theme', v)} />
              </Row>

              <Row label="Accent colour" hint="Used for highlights, active states and checkboxes.">
                <div className="flex flex-wrap gap-2">
                  {ACCENT_PRESETS.map((a) => (
                    <button key={a.id} onClick={() => patch('accentColor', a.id)}
                      title={a.label}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                      style={{ background: a.dot, outline: (s.accentColor ?? 'slate') === a.id ? '2.5px solid var(--text)' : 'none', outlineOffset: 2 }}>
                      {(s.accentColor ?? 'slate') === a.id && <Check size={10} className="text-white" />}
                    </button>
                  ))}
                </div>
              </Row>

              <Row label="Background image" hint="Custom image behind the dashboard tiles.">
                <BgPicker bg={s.bg} onSet={(v) => patch('bg', v)} onClear={() => patch('bg', null)} />
              </Row>

              <Row label="Tile style" hint="Flat uses solid surfaces. Glass makes tiles frosted and transparent.">
                <Seg
                  options={[['flat', 'Flat'], ['glass', 'Glass']]}
                  value={s.tileStyle ?? 'flat'}
                  onChange={(v) => patch('tileStyle', v)} />
              </Row>
            </div>
          )}

          {/* ── Data & Backup ─────────────────────────────────── */}
          {section === 'mood' && (
            <MoodSection metrics={s.moodMetrics || DEFAULT_MOOD_METRICS} setMetrics={(v) => patch('moodMetrics', v)} />
          )}

          {section === 'data' && <BackupSection s={s} />}

          {/* ── Updates ───────────────────────────────────────── */}
          {section === 'updates' && <UpdatesSection updater={updater} />}

          {/* ── Import ────────────────────────────────────────── */}
          {section === 'import' && (
            <div>
              <div className="text-[11px] tracking-widest uppercase text-text-3 mb-5">Obsidian</div>
              <ObsidianImport onImport={handleObsidianImport} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
