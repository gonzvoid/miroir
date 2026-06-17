import { useEffect, useRef, useState } from 'react';

// Bridge to Electron's main process. Falls back to localStorage when running
// in a plain browser (e.g. `vite` without electron), so dev still works.
const hasElectron = typeof window !== 'undefined' && window.lumen;

async function loadAll() {
  if (hasElectron) return (await window.lumen.loadState()) || {};
  try { return JSON.parse(localStorage.getItem('lumen-data') || '{}'); } catch { return {}; }
}
async function saveAll(state) {
  if (hasElectron) return window.lumen.saveState(state);
  localStorage.setItem('lumen-data', JSON.stringify(state));
}

/**
 * useStore — single source of truth persisted as one JSON blob.
 * Returns [state, patch, loaded].
 */
export function useStore(defaults) {
  const [state, setState] = useState(defaults);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      const saved = await loadAll();
      setState((d) => ({ ...d, ...saved }));
      setLoaded(true);
    })();
  }, []);

  // debounced save whenever state changes (after initial load)
  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveAll(state), 250);
  }, [state, loaded]);

  const patch = (key, value) =>
    setState((s) => ({ ...s, [key]: typeof value === 'function' ? value(s[key]) : value }));

  return [state, patch, loaded];
}

export const imageFolder = {
  pick: () => (hasElectron ? window.lumen.pickImageFolder() : Promise.resolve(null)),
  list: (folder) => (hasElectron ? window.lumen.listImages(folder) : Promise.resolve([])),
  supported: !!hasElectron,
};
