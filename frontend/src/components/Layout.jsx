import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import AmbientBlobs from './AmbientBlobs.jsx';
import { NAV_GROUPS } from './nav.js';

function titleForPath(pathname) {
  for (const g of NAV_GROUPS) {
    for (const it of g.items) {
      if (it.to === pathname || (it.to !== '/' && pathname.startsWith(it.to))) return it.label;
    }
  }
  return 'Dasbor';
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const title = titleForPath(location.pathname);

  const isDashboard = location.pathname === '/';

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="sticky top-0 hidden h-screen lg:block">
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 h-full shadow-pop">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} onMenu={() => setMobileOpen(true)} />
        <main className="relative flex-1 overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
          {isDashboard && <AmbientBlobs />}
          <div className="relative z-10 mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
