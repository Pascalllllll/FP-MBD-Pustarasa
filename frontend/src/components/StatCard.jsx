// Compact KPI tile. `accent` tints the value + icon by service.
const ACCENT = {
  library: 'text-library bg-library-soft',
  canteen: 'text-canteen bg-canteen-soft',
  ink: 'text-ink bg-ink/5',
};

export default function StatCard({ label, value, sub, icon: Icon, accent = 'ink' }) {
  return (
    <div className="card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
        </div>
        {Icon && (
          <span className={`grid h-9 w-9 place-items-center rounded-lg ${ACCENT[accent]}`}>
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
    </div>
  );
}
