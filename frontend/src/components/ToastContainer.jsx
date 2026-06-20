import { useEffect, useState } from 'react';
import { subscribe } from '../lib/toast.js';
import { IconBolt, IconClose } from './icons.jsx';

const STYLES = {
  trigger: 'border-canteen/30 bg-canteen-soft text-canteen-ink',
  error: 'border-danger/30 bg-danger/10 text-danger',
  success: 'border-success/30 bg-success/10 text-success',
  info: 'border-library/30 bg-library-soft text-library-ink',
};

const TITLE = {
  trigger: 'Ditolak oleh trigger basis data',
  error: 'Terjadi kesalahan',
  success: 'Berhasil',
  info: 'Info',
};

const DURATION_MS = 7000;

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribe((toast) => {
      setToasts((cur) => [...cur, toast]);
      setTimeout(() => dismiss(toast.id), DURATION_MS);
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = (id) => setToasts((cur) => cur.filter((t) => t.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2 sm:right-6 sm:top-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 shadow-pop animate-toast-in ${STYLES[t.type] || STYLES.info}`}
        >
          {t.type === 'trigger' && <IconBolt className="mt-0.5 h-4 w-4 shrink-0" />}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{TITLE[t.type] || TITLE.info}</p>
            <p className="mt-0.5 text-sm">{t.message}</p>
          </div>
          <button className="shrink-0 opacity-60 hover:opacity-100" onClick={() => dismiss(t.id)} aria-label="Tutup">
            <IconClose className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
