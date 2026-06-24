import { useEffect, useState, useCallback } from 'react';

/* Shared auto-update state. Auto-checks once on startup; download is manual.
   status: idle | checking | available | not-available | downloading | downloaded | error */
export function useUpdater() {
  const [status, setStatus]     = useState('idle');
  const [info, setInfo]         = useState(null);   // { version }
  const [progress, setProgress] = useState(0);
  const [error, setError]       = useState(null);
  const [version, setVersion]   = useState('');

  useEffect(() => {
    const api = window.lumen?.update;
    if (!api?.onStatus) return;

    window.lumen.appVersion?.().then((v) => setVersion(v || ''));

    const off = api.onStatus((evt) => {
      switch (evt.type) {
        case 'checking':      setStatus('checking'); setError(null); break;
        case 'available':     setStatus('available'); setInfo(evt.info); break;
        case 'not-available': setStatus('not-available'); break;
        case 'progress':      setStatus('downloading'); setProgress(evt.percent); break;
        case 'downloaded':    setStatus('downloaded'); setInfo(evt.info); break;
        case 'error':         setStatus('error'); setError(evt.message); break;
        default: break;
      }
    });

    api.check?.();          // silent auto-check on startup
    return off;
  }, []);

  const check    = useCallback(() => { setError(null); window.lumen?.update?.check?.(); }, []);
  const download = useCallback(() => window.lumen?.update?.download?.(), []);
  const install  = useCallback(() => window.lumen?.update?.install?.(), []);

  return { status, info, progress, error, version, check, download, install };
}
