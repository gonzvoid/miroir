import { useState } from 'react';
import { TILE_CATALOG } from '../lib/utils';
import { X, Plus } from './icons';

/* ── Deterministic dot-opacity pattern for activity grids ─────── */
const DOT_OPS = [0.08, 0.18, 0.35, 0.60, 0.90, 0.45, 0.22, 0.72, 0.10, 0.50,
                 0.80, 0.30, 0.65, 0.15, 0.55, 0.40, 0.85, 0.20, 0.70, 0.12];

/* ── Visual skeleton preview for each tile type ───────────────── */
function TilePreview({ id, label }) {
  const Line = ({ w = '70%', h = 'h-1.5', cls = '' }) => (
    <div className={`${h} rounded-full bg-surface-3 ${cls}`} style={{ width: w }} />
  );

  const content = {
    focal: (
      <div className="flex flex-col gap-[9px]">
        {[72, 88, 58, 80].map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-[11px] h-[11px] rounded-[4px] border border-stroke shrink-0" />
            <Line w={`${w}%`} />
          </div>
        ))}
      </div>
    ),

    capture: (
      <div className="flex flex-col justify-between h-full gap-2">
        <div className="flex flex-col gap-2">
          <Line w="80%" />
          <Line w="55%" />
        </div>
        <div className="h-7 rounded-full bg-surface-2 border border-stroke" />
      </div>
    ),

    tasklog: (
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: 'repeat(14, 1fr)' }}>
        {Array.from({ length: 56 }, (_, i) => (
          <div key={i} className="aspect-square rounded-[2px]"
            style={{ background: 'var(--accent)', opacity: DOT_OPS[i % DOT_OPS.length] }} />
        ))}
      </div>
    ),

    summary: (
      <div className="flex flex-col gap-3">
        {[['Open', '70%'], ['Done', '40%'], ['Streak', '55%']].map(([, w], i) => (
          <div key={i} className="flex items-center gap-2 justify-between">
            <Line w={w} />
            <div className="h-5 w-8 rounded-lg bg-surface-2 border border-stroke shrink-0" />
          </div>
        ))}
      </div>
    ),

    loops: (
      <div className="flex flex-col gap-2.5">
        {[100, 65, 80, 30].map((pct, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-3.5 h-3.5 rounded-full border shrink-0 transition-all
              ${pct === 100 ? 'bg-accent border-accent' : 'border-stroke'}`} />
            <div className="flex-1 h-[3px] rounded-full bg-surface-3">
              <div className="h-full rounded-full bg-stroke" style={{ width: `${pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    ),

    visual: (
      <div className="flex flex-col gap-1.5 h-full">
        <div className="flex-1 rounded-xl bg-surface-2 border border-stroke" style={{ minHeight: 44 }} />
        <div className="h-6 rounded-lg bg-surface-2 border border-stroke" />
      </div>
    ),

    timeline: (
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-text-3 shrink-0" />
            <Line w={`${42 + i * 9}%`} />
          </div>
        ))}
      </div>
    ),

    sources: (
      <div className="flex flex-col gap-2.5">
        {[['var(--accent)', '62%'], ['var(--text-3)', '78%'], ['var(--stroke)', '50%']].map(([color, w], i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: color }} />
            <Line w={w} />
          </div>
        ))}
      </div>
    ),

    calendar: (
      <div>
        <div className="grid grid-cols-7 gap-[3px] mb-1.5">
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <div key={i} className="text-[7px] text-center text-text-3 font-medium">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-[3px]">
          {Array.from({ length: 35 }, (_, i) => (
            <div key={i}
              className="rounded-[3px]"
              style={{
                aspectRatio: '1',
                background: i === 10 ? 'var(--accent)' : 'var(--surface-2)',
              }} />
          ))}
        </div>
      </div>
    ),

    mood: (
      <div className="flex items-center justify-around py-2">
        {[1, 0, 0, 0, 0].map((active, i) => (
          <div key={i}
            className="w-5 h-5 rounded-full border"
            style={{
              background: active ? 'var(--accent)' : 'var(--surface-2)',
              borderColor: active ? 'var(--accent)' : 'var(--stroke)',
            }} />
        ))}
      </div>
    ),

    doodle: (
      <div className="flex-1 rounded-xl bg-surface-2 border border-stroke flex items-center justify-center"
        style={{ minHeight: 56 }}>
        <svg width="72" height="22" viewBox="0 0 72 22" fill="none">
          <path d="M2 15 C9 3,16 19,24 11 C32 3,40 17,48 9 C54 3,60 15,70 7"
            stroke="var(--stroke)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    ),

    lunchMenu: (
      <div className="flex flex-col gap-1.5">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[8px] text-text-3 w-4 shrink-0 font-medium">{day}</span>
            <div className="h-[3px] flex-1 rounded-full"
              style={{ background: i < 5 ? 'var(--surface-3)' : 'var(--surface-2)' }} />
          </div>
        ))}
      </div>
    ),
  };

  return (
    <div className="flex flex-col h-full gap-2.5">
      <div className="text-[11px] font-semibold text-text-2 tracking-tight leading-none">{label}</div>
      <div className="flex-1 min-h-0">
        {content[id] ?? <div className="flex flex-col gap-1.5"><Line w="75%" /><Line w="50%" /></div>}
      </div>
    </div>
  );
}

/* ── Approximate heights per tile (px) ───────────────────────── */
const TILE_H = {
  focal: 168, capture: 108, tasklog: 144, summary: 112,
  loops: 140, visual: 124, timeline: 128, sources: 104,
  calendar: 168, mood: 80, doodle: 128, lunchMenu: 148,
  focus: 160, projects: 148, books: 140, trip: 148, canvas: 140,
};

/* ── A placed tile card ──────────────────────────────────────── */
function PlacedTile({ tile, isDragging, onRemove, onMoveUp, onMoveDown, isFirst, isLast,
                      onDragStart, onDragEnd }) {
  const h = TILE_H[tile?.id] ?? 120;
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="group relative bg-surface border border-stroke rounded-card p-4 shadow-sm overflow-hidden
        transition-opacity"
      style={{ height: h, opacity: isDragging ? 0.35 : 1, cursor: 'grab' }}>
      <TilePreview id={tile?.id ?? ''} label={tile?.label ?? tile?.id ?? ''} />

      {/* hover overlay — × + ↑↓ still available as fallback */}
      <div className="absolute inset-0 rounded-card opacity-0 group-hover:opacity-100 transition-opacity
        flex items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto"
        style={{ background: 'rgba(var(--surface-rgb, 255,255,255), 0.82)' }}>
        {!isFirst && (
          <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            className="w-8 h-8 rounded-full bg-surface border border-stroke shadow-sm
              flex items-center justify-center text-text-2 hover:text-text text-xs transition-colors">↑</button>
        )}
        {!isLast && (
          <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            className="w-8 h-8 rounded-full bg-surface border border-stroke shadow-sm
              flex items-center justify-center text-text-2 hover:text-text text-xs transition-colors">↓</button>
        )}
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="w-8 h-8 rounded-full bg-surface border border-stroke shadow-sm
            flex items-center justify-center text-text-3 hover:text-text transition-colors">
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

/* ── Drop indicator line between tiles ───────────────────────── */
function DropZone({ active }) {
  return (
    <div className="transition-all duration-100 rounded-full mx-1"
      style={{
        height: active ? 3 : 6,
        background: active ? 'var(--accent)' : 'transparent',
        opacity: active ? 1 : 0,
      }} />
  );
}

/* ── Unplaced tile in the shelf ──────────────────────────────── */
function UnplacedTile({ tile, onAdd, onDragStart, onDragEnd, isDragging }) {
  const [picking, setPicking] = useState(false);
  const h = Math.min(TILE_H[tile?.id] ?? 120, 116);

  return (
    <div className="relative" style={{ opacity: isDragging ? 0.35 : 1 }}>
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={() => setPicking((v) => !v)}
        className="group relative bg-surface border border-stroke rounded-card p-4 shadow-sm
          w-full text-left overflow-hidden transition-shadow hover:shadow cursor-grab"
        style={{ height: h }}>
        <TilePreview id={tile?.id ?? ''} label={tile?.label ?? ''} />
        <div className="absolute inset-0 rounded-card opacity-0 group-hover:opacity-100 transition-opacity
          flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 rounded-full bg-text flex items-center justify-center shadow-sm">
            <Plus size={13} className="text-canvas" />
          </div>
        </div>
      </div>

      {picking && (
        <div className="absolute top-full left-0 mt-1.5 bg-surface border border-stroke rounded-xl shadow-lg p-1.5 z-10 min-w-[140px]"
          onMouseLeave={() => setPicking(false)}>
          {[['left', 'Left'], ['mid', 'Center'], ['right', 'Right']].map(([col, lbl]) => (
            <button key={col} onClick={() => { onAdd(col); setPicking(false); }}
              className="flex w-full items-center px-2.5 py-2 rounded-lg hover:bg-surface-2
                text-text-2 hover:text-text text-[12.5px] transition-colors">
              Add to {lbl}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Small "+ Add tile" button ───────────────────────────────── */
function AddButton({ available, onAdd }) {
  const [open, setOpen] = useState(false);
  if (!available.length) return null;
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 w-full px-3 py-2 rounded-xl
          text-text-3 hover:text-text-2 text-[12px] transition-colors hover:bg-surface-2">
        <Plus size={11} /> Add tile
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-1 bg-surface border border-stroke rounded-xl shadow-lg p-1.5 z-10 min-w-[176px]"
          onMouseLeave={() => setOpen(false)}>
          {available.map((t) => (
            <button key={t.id} onClick={() => { onAdd(t.id); setOpen(false); }}
              className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg
                hover:bg-surface-2 text-text-2 hover:text-text text-[12.5px] text-left transition-colors">
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────── */
const COL_LABELS = { left: 'Left', mid: 'Center', right: 'Right' };

export default function LayoutEditor({ layout, onLayoutChange, onClose }) {
  const [draft, setDraft] = useState({
    left:  [...(layout?.left  ?? [])],
    mid:   [...(layout?.mid   ?? [])],
    right: [...(layout?.right ?? [])],
  });

  // dragging: { id, fromCol } — fromCol is null when coming from shelf
  const [dragging, setDragging]   = useState(null);
  // dragOver: { col, idx } — insertion point (idx = position in column array)
  const [dragOver, setDragOver]   = useState(null);

  const placed    = new Set([...draft.left, ...draft.mid, ...draft.right]);
  const available = TILE_CATALOG.filter((t) => !placed.has(t.id));

  /* ── mutation helpers ─────────────────────────────────────── */
  const remove = (id) =>
    setDraft((d) => ({
      left:  d.left.filter((t)  => t !== id),
      mid:   d.mid.filter((t)   => t !== id),
      right: d.right.filter((t) => t !== id),
    }));

  const add = (id, col) =>
    setDraft((d) => ({ ...d, [col]: [...d[col], id] }));

  const moveUp = (col, idx) => {
    if (idx === 0) return;
    setDraft((d) => {
      const a = [...d[col]]; [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]];
      return { ...d, [col]: a };
    });
  };

  const moveDown = (col, idx) =>
    setDraft((d) => {
      const a = [...d[col]];
      if (idx >= a.length - 1) return d;
      [a[idx], a[idx + 1]] = [a[idx + 1], a[idx]];
      return { ...d, [col]: a };
    });

  /* ── drag handlers ────────────────────────────────────────── */
  const handleDrop = (toCol, toIdx) => {
    if (!dragging) return;
    const { id, fromCol } = dragging;

    setDraft((d) => {
      const next = { left: [...d.left], mid: [...d.mid], right: [...d.right] };

      // Remove from source column (if placed)
      if (fromCol) next[fromCol] = next[fromCol].filter((t) => t !== id);

      // Adjust index if dropping in same column below the removed item
      let idx = toIdx;
      if (fromCol === toCol) {
        const wasAt = d[fromCol].indexOf(id);
        if (wasAt < toIdx) idx--;
      }

      idx = Math.max(0, Math.min(idx, next[toCol].length));
      next[toCol] = [...next[toCol].slice(0, idx), id, ...next[toCol].slice(idx)];
      return next;
    });

    setDragging(null);
    setDragOver(null);
  };

  // Shared column drop-zone props
  const colDropProps = (col, idx) => ({
    onDragOver: (e) => { e.preventDefault(); setDragOver({ col, idx }); },
    onDrop:     (e) => { e.preventDefault(); e.stopPropagation(); handleDrop(col, idx); },
  });

  const apply = () => { onLayoutChange(draft); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas"
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => { setDragging(null); setDragOver(null); }}>

      {/* ── top bar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-stroke shrink-0">
        <div>
          <div className="text-text font-semibold text-[17px] tracking-tight">Layout</div>
          <div className="text-text-3 text-[12px] mt-0.5">
            Drag tiles between columns · hover for ↑↓ and ×
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClose}
            className="text-text-2 hover:text-text text-[13px] px-4 py-2 rounded-xl
              transition-colors hover:bg-surface-2">Cancel</button>
          <button onClick={apply}
            className="bg-text text-canvas text-[13px] px-5 py-2 rounded-xl
              font-semibold transition-opacity hover:opacity-75">Apply</button>
        </div>
      </div>

      {/* ── scrollable body ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="grid grid-cols-3 gap-5 max-w-4xl mx-auto">
          {(['left', 'mid', 'right']).map((col) => (
            <div key={col}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-text-2 text-[11px] uppercase tracking-widest font-medium">
                  {COL_LABELS[col]}
                </span>
                <span className="text-text-3 text-[11px]">{draft[col].length}</span>
              </div>

              {/* column drop container */}
              <div className="flex flex-col rounded-2xl transition-colors min-h-[80px] pb-1"
                style={{ background: dragging && dragOver?.col === col ? 'var(--surface-2)' : 'transparent' }}
                onDragOver={(e) => { e.preventDefault(); if (!dragOver || dragOver.col !== col) setDragOver({ col, idx: draft[col].length }); }}
                onDrop={(e) => { e.preventDefault(); handleDrop(col, draft[col].length); }}>

                {/* drop zone before first tile */}
                <div {...colDropProps(col, 0)}>
                  <DropZone active={!!dragging && dragOver?.col === col && dragOver?.idx === 0} />
                </div>

                {draft[col].length === 0 && !dragging && (
                  <div className="flex items-center justify-center text-text-3 text-[12px] py-8
                    bg-surface-2 border border-dashed border-stroke rounded-2xl mx-0">
                    Empty
                  </div>
                )}

                {draft[col].map((id, idx) => {
                  const tile = TILE_CATALOG.find((t) => t.id === id);
                  return (
                    <div key={id}>
                      <PlacedTile
                        tile={tile ?? { id, label: id }}
                        isDragging={dragging?.id === id}
                        isFirst={idx === 0}
                        isLast={idx === draft[col].length - 1}
                        onRemove={() => remove(id)}
                        onMoveUp={() => moveUp(col, idx)}
                        onMoveDown={() => moveDown(col, idx)}
                        onDragStart={() => setDragging({ id, fromCol: col })}
                        onDragEnd={() => { setDragging(null); setDragOver(null); }}
                      />
                      {/* drop zone after each tile */}
                      <div {...colDropProps(col, idx + 1)}>
                        <DropZone active={!!dragging && dragOver?.col === col && dragOver?.idx === idx + 1} />
                      </div>
                    </div>
                  );
                })}

                <AddButton available={available} onAdd={(id) => add(id, col)} />
              </div>
            </div>
          ))}
        </div>

        {/* ── unplaced shelf ───────────────────────────────────────── */}
        {available.length > 0 && (
          <div className="mt-10 max-w-4xl mx-auto">
            <div className="text-text-3 text-[11px] uppercase tracking-widest mb-4">
              Not placed
            </div>
            <div className="grid grid-cols-4 gap-3">
              {available.map((tile) => (
                <UnplacedTile
                  key={tile.id}
                  tile={tile}
                  isDragging={dragging?.id === tile.id}
                  onAdd={(col) => add(tile.id, col)}
                  onDragStart={() => setDragging({ id: tile.id, fromCol: null })}
                  onDragEnd={() => { setDragging(null); setDragOver(null); }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
