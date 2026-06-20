import { NavLink } from 'react-router-dom';
import { NAV_GROUPS } from './nav.js';
import { useAuth } from '../context/AuthContext.jsx';

function Brand() {
  return (
    <div className="px-5 py-5">
      <span className="font-display text-2xl font-extrabold tracking-tight text-ink">
        pusta<span className="text-canteen">rasa</span>
        <span className="text-library">.</span>
      </span>
      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-widest text-muted">
        Perpustakaan &amp; Kantin
      </p>
    </div>
  );
}

const SERVICE_DOT = {
  perpustakaan: 'bg-library',
  kunjungan: 'bg-library/60',
  kantin: 'bg-canteen',
  manajemen: 'bg-muted',
};

export default function Sidebar({ onNavigate }) {
  const { hasRole } = useAuth();

  return (
    <nav className="flex h-full w-64 flex-col border-r border-line bg-surface">
      <Brand />
      <div className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
        {NAV_GROUPS.map((group, gi) => {
          const items = group.items.filter((it) => !it.roles || hasRole(...it.roles));
          if (items.length === 0) return null;
          return (
            <div key={gi}>
              {group.label && (
                <div className="mb-1 flex items-center gap-2 px-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${SERVICE_DOT[group.service] || 'bg-muted'}`} />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    {group.label}
                  </span>
                </div>
              )}
              <ul className="space-y-0.5">
                {items.map((it) => (
                  <li key={it.to}>
                    <NavLink
                      to={it.to}
                      end={it.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-ink text-paper'
                            : 'text-ink/80 hover:bg-paper hover:text-ink'
                        }`
                      }
                    >
                      <it.icon className="h-[18px] w-[18px]" />
                      {it.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
