import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLE_LABEL } from '../lib/format.js';
import { getTheme, setTheme } from '../lib/theme.js';
import { IconLogout, IconMoon, IconSun } from './icons.jsx';

export default function Topbar({ title, onMenu }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => getTheme() === 'dark');

  useEffect(() => {
    setTheme(dark ? 'dark' : 'light');
  }, [dark]);
  const initials = (user?.fullName || user?.username || '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-paper/80 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button className="btn-ghost h-9 w-9 !px-0 lg:hidden" onClick={onMenu} aria-label="Menu">
          <span className="text-lg">☰</span>
        </button>
        <h1 className="font-display text-lg font-bold text-ink sm:text-xl">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="btn-ghost h-9 w-9 !px-0"
          onClick={() => setDark((v) => !v)}
          aria-label={dark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
          title={dark ? 'Mode terang' : 'Mode gelap'}
        >
          {dark ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
        </button>

        <div className="relative">
          <button
            className="flex items-center gap-2.5 rounded-full border border-line bg-surface py-1 pl-1 pr-3 hover:bg-paper"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-library text-sm font-bold text-white">
              {initials}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold leading-tight">{user?.fullName}</span>
              <span className="block text-[11px] leading-tight text-muted">
                {ROLE_LABEL[user?.role] || user?.role}
              </span>
            </span>
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-surface shadow-pop">
                <div className="border-b border-line px-4 py-3">
                  <p className="text-sm font-semibold">{user?.fullName}</p>
                  <p className="text-xs text-muted">@{user?.username}</p>
                </div>
                <button
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-danger hover:bg-paper"
                  onClick={logout}
                >
                  <IconLogout className="h-4 w-4" /> Keluar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
