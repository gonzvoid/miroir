import { useEffect, useRef, useState } from 'react';
import { imageFolder } from '../lib/store';
import { ImageIcon, Plus, Shuffle, ChevronRight, X } from './icons';

function nanoid() { return Math.random().toString(36).slice(2, 9); }

function AlbumViewer({ album, onUpdate }) {
  const fileRef = useRef();
  const images = album.images ?? [];

  const [layers, setLayers] = useState({ a: 0, b: null, top: 'a' });

  const goTo = (newIdx) => {
    setLayers((prev) => {
      const inactive = prev.top === 'a' ? 'b' : 'a';
      return { ...prev, [inactive]: newIdx, top: inactive };
    });
  };

  useEffect(() => {
    if (images.length > 1) {
      const t = setInterval(() => {
        setLayers((prev) => {
          const curIdx = prev[prev.top] ?? 0;
          const nextIdx = (curIdx + 1) % images.length;
          const inactive = prev.top === 'a' ? 'b' : 'a';
          return { ...prev, [inactive]: nextIdx, top: inactive };
        });
      }, 12000);
      return () => clearInterval(t);
    }
  }, [images.length]);

  useEffect(() => {
    if (!images.length) return;
    setLayers((prev) => ({
      a: Math.min(prev.a ?? 0, images.length - 1),
      b: prev.b != null ? Math.min(prev.b, images.length - 1) : null,
      top: prev.top,
    }));
  }, [images.length]);

  const pickFolder = async () => {
    const f = await imageFolder.pick();
    if (f) {
      const urls = await imageFolder.list(f);
      onUpdate({ ...album, images: urls, folder: f });
    }
  };

  const onFiles = (e) => {
    const files = [...(e.target.files || [])];
    if (!files.length) return;
    Promise.all(files.map((f) => new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.readAsDataURL(f);
    }))).then((urls) => onUpdate({ ...album, images: [...images, ...urls] }));
  };

  const curIdx = layers[layers.top] ?? 0;
  const next = () => images.length > 1 && goTo((curIdx + 1) % images.length);
  const shuffle = () => images.length > 1 && goTo(Math.floor(Math.random() * images.length));

  if (!images.length) {
    return (
      <div className="flex-1 flex">
        <div className="m-auto text-center text-text-2 flex flex-col items-center gap-2.5 p-6">
          <ImageIcon size={22} />
          <span className="text-[13px]">No images in this album</span>
          <div className="flex gap-2">
            {imageFolder.supported && (
              <button onClick={pickFolder} className="bg-surface text-text text-[12px] px-3.5 py-1.5 rounded-full shadow-sm">Pick folder</button>
            )}
            <button onClick={() => fileRef.current.click()} className="bg-surface text-text text-[12px] px-3.5 py-1.5 rounded-full shadow-sm">Add images</button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onFiles} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: layers.a != null ? `url(${images[layers.a]})` : 'none',
          opacity: layers.top === 'a' ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }} />
      <div className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: layers.b != null ? `url(${images[layers.b]})` : 'none',
          opacity: layers.top === 'b' ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,.5), transparent 55%)' }} />
      <div className="relative mt-auto pb-[52px] flex justify-center items-end w-full z-10 p-[18px]">
        <div className="flex gap-1.5">
          <Btn onClick={shuffle}><Shuffle size={14} /></Btn>
          <Btn onClick={next}><ChevronRight size={15} /></Btn>
          <Btn onClick={imageFolder.supported ? pickFolder : () => fileRef.current.click()}><Plus size={15} /></Btn>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onFiles} />
      </div>
    </>
  );
}

export default function ImageTile({ albums, setAlbums }) {
  const [activeIdx, setActiveIdx] = useState(0);

  const safeIdx = Math.min(activeIdx, Math.max(0, albums.length - 1));
  const activeAlbum = albums[safeIdx];

  const addAlbum = () => {
    const n = albums.length + 1;
    const newAlbum = { id: `album-${nanoid()}`, name: `Album ${n}`, images: [], folder: null };
    setAlbums([...albums, newAlbum]);
    setActiveIdx(albums.length);
  };

  const removeAlbum = (idx) => {
    if (albums.length <= 1) return;
    const next = [...albums];
    next.splice(idx, 1);
    setAlbums(next);
    setActiveIdx(Math.min(safeIdx, next.length - 1));
  };

  const updateAlbum = (updated) => {
    setAlbums(albums.map((a) => (a.id === updated.id ? updated : a)));
  };

  if (!albums.length) {
    return (
      <section className="relative rounded-card overflow-hidden shadow-sm min-h-[150px] bg-surface-3 flex">
        <div className="m-auto text-center text-text-2 flex flex-col items-center gap-2.5 p-6">
          <ImageIcon size={24} />
          <span className="text-[13px]">Create an album to get started</span>
          <button onClick={addAlbum} className="bg-surface text-text text-[13px] px-4 py-2 rounded-full shadow-sm">New album</button>
        </div>
      </section>
    );
  }

  return (
    <section className="relative rounded-card overflow-hidden shadow-sm min-h-[200px] bg-surface-3 flex flex-col">
      {/* image area */}
      <div className="relative flex-1 flex flex-col" style={{ minHeight: 120 }}>
        {activeAlbum && (
          <AlbumViewer key={activeAlbum.id} album={activeAlbum} onUpdate={updateAlbum} />
        )}
      </div>

      {/* album tabs strip */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center gap-1 px-3 py-2"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,.45) 0%, transparent 100%)' }}>
        <div className="flex-1 flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {albums.map((alb, idx) => (
            <div key={alb.id} className="flex items-center shrink-0">
              <button
                onClick={() => setActiveIdx(idx)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full transition-all whitespace-nowrap"
                style={{
                  background: idx === safeIdx ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)',
                  color: idx === safeIdx ? '#111' : 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(8px)',
                }}>
                {alb.name}
              </button>
              {albums.length > 1 && (
                <button
                  onClick={() => removeAlbum(idx)}
                  className="ml-0.5 w-4 h-4 grid place-items-center rounded-full"
                  style={{ background: 'rgba(0,0,0,0.3)', color: 'rgba(255,255,255,0.7)' }}>
                  <X size={9} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addAlbum}
          className="shrink-0 w-6 h-6 grid place-items-center rounded-full ml-1"
          style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.85)' }}>
          <Plus size={12} />
        </button>
      </div>
    </section>
  );
}

const Btn = ({ children, onClick }) => (
  <button onClick={onClick} className="w-[30px] h-[30px] grid place-items-center rounded-full text-white"
    style={{ background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(8px)' }}>{children}</button>
);
