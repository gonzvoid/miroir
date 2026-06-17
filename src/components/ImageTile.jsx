import { useEffect, useRef, useState } from 'react';
import { imageFolder } from '../lib/store';
import { ImageIcon, Plus, Shuffle, ChevronRight } from './icons';

export default function ImageTile({ images, setImages, folder, setFolder }) {
  const fileRef = useRef();
  // Two-layer crossfade: a/b alternate as foreground
  const [layers, setLayers] = useState({ a: 0, b: null, top: 'a' });

  const goTo = (newIdx) => {
    setLayers((prev) => {
      const inactive = prev.top === 'a' ? 'b' : 'a';
      return { ...prev, [inactive]: newIdx, top: inactive };
    });
  };

  // Auto-rotate every 12s
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

  // Clamp layers when images array shrinks
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
    if (f) { setFolder(f); const urls = await imageFolder.list(f); setImages(urls); }
  };
  const onFiles = (e) => {
    const files = [...(e.target.files || [])]; if (!files.length) return;
    Promise.all(files.map((f) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f); })))
      .then((urls) => setImages((prev) => [...(prev || []), ...urls]));
  };

  const curIdx = layers[layers.top] ?? 0;
  const next = () => goTo((curIdx + 1) % images.length);
  const shuffle = () => images.length > 1 && goTo(Math.floor(Math.random() * images.length));

  if (!images || images.length === 0) {
    return (
      <section className="relative rounded-card overflow-hidden shadow-sm min-h-[150px] bg-surface-3 flex">
        <div className="m-auto text-center text-text-2 flex flex-col items-center gap-2.5 p-6">
          <ImageIcon size={24} />
          <span className="text-[13px]">Add images for a rotating visual</span>
          <div className="flex gap-2">
            {imageFolder.supported && (
              <button onClick={pickFolder} className="bg-surface text-text text-[13px] px-4 py-2 rounded-full shadow-sm">Pick folder</button>
            )}
            <button onClick={() => fileRef.current.click()} className="bg-surface text-text text-[13px] px-4 py-2 rounded-full shadow-sm">Add images</button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onFiles} />
        </div>
      </section>
    );
  }

  return (
    <section className="relative rounded-card overflow-hidden shadow-sm min-h-[150px] bg-surface-3 flex">
      {/* Layer A */}
      <div className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: layers.a != null ? `url(${images[layers.a]})` : 'none',
          opacity: layers.top === 'a' ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }} />
      {/* Layer B */}
      <div className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: layers.b != null ? `url(${images[layers.b]})` : 'none',
          opacity: layers.top === 'b' ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,.5), transparent 55%)' }} />
      <div className="relative mt-auto p-[18px] flex justify-center items-end w-full z-10">
        <div className="flex gap-1.5">
          <Btn onClick={shuffle}><Shuffle size={14} /></Btn>
          <Btn onClick={next}><ChevronRight size={15} /></Btn>
          <Btn onClick={imageFolder.supported ? pickFolder : () => fileRef.current.click()}><Plus size={15} /></Btn>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onFiles} />
      </div>
    </section>
  );
}

const Btn = ({ children, onClick }) => (
  <button onClick={onClick} className="w-[30px] h-[30px] grid place-items-center rounded-full text-white"
    style={{ background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(8px)' }}>{children}</button>
);
