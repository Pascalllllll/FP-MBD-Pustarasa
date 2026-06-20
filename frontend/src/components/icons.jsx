// Minimal inline-SVG icon set so the app has no icon-library dependency.
// Each accepts className for sizing/color via currentColor.

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const wrap = (children) =>
  function Icon({ className = 'h-5 w-5' }) {
    return (
      <svg viewBox="0 0 24 24" className={className} {...base}>
        {children}
      </svg>
    );
  };

export const IconDashboard = wrap(
  <>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </>
);
export const IconBook = wrap(
  <>
    <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z" />
    <path d="M4 19a2 2 0 0 0 2 2h12" />
  </>
);
export const IconBorrow = wrap(
  <>
    <path d="M3 7h13l-2-2M21 17H8l2 2" />
    <path d="M16 7v10" />
  </>
);
export const IconReturn = wrap(
  <>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h11a5 5 0 0 1 5 5v1" />
  </>
);
export const IconVisitor = wrap(
  <>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </>
);
export const IconClock = wrap(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>
);
export const IconFood = wrap(
  <>
    <path d="M5 3v8a3 3 0 0 0 6 0V3M8 3v18" />
    <path d="M17 3c-1.5 1-2 3-2 5s.5 3 2 3v10" />
  </>
);
export const IconCart = wrap(
  <>
    <circle cx="9" cy="20" r="1.5" />
    <circle cx="18" cy="20" r="1.5" />
    <path d="M3 4h2l2.4 12.2a1 1 0 0 0 1 .8h8.2a1 1 0 0 0 1-.8L21 8H6" />
  </>
);
export const IconLibrarian = wrap(
  <>
    <circle cx="12" cy="7" r="3" />
    <path d="M6 21a6 6 0 0 1 12 0" />
    <path d="M9 11l3 2 3-2" />
  </>
);
export const IconSeller = wrap(
  <>
    <path d="M4 9h16l-1 11H5z" />
    <path d="M8 9V6a4 4 0 0 1 8 0v3" />
  </>
);
export const IconCard = wrap(
  <>
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M3 10h18M7 15h4" />
  </>
);
export const IconReport = wrap(
  <>
    <path d="M5 3h9l5 5v13H5z" />
    <path d="M14 3v5h5" />
    <path d="M9 13v4M12 11v6M15 14v3" />
  </>
);
export const IconSearch = wrap(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </>
);
export const IconPlus = wrap(<path d="M12 5v14M5 12h14" />);
export const IconLogout = wrap(
  <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5M21 12H9" />
  </>
);
export const IconClose = wrap(<path d="M6 6l12 12M18 6 6 18" />);
export const IconTrash = wrap(
  <>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M6 7l1 13h10l1-13" />
  </>
);
export const IconEdit = wrap(
  <>
    <path d="M4 20h4L18.5 9.5a2 2 0 0 0-3-3L5 17z" />
    <path d="M13.5 6.5l3 3" />
  </>
);
export const IconBolt = wrap(<path d="M13 2 4 14h6l-1 8 9-12h-6z" />);
export const IconSun = wrap(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
  </>
);
export const IconMoon = wrap(<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />);
