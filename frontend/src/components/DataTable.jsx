import { IconSearch } from './icons.jsx';

/** Generic table. columns: [{ key, header, render?(row), className? }]; actions: (row) => ReactNode. */
export default function DataTable({
  columns,
  rows,
  loading,
  rowKey = (r, i) => i,
  search,
  onSearch,
  searchPlaceholder = 'Cari…',
  toolbar,
  empty = 'Belum ada data.',
  actions,
}) {
  return (
    <div className="card overflow-hidden">
      {(onSearch || toolbar) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          {onSearch ? (
            <div className="relative w-full max-w-xs">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                className="input pl-9"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          ) : (
            <span />
          )}
          {toolbar}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-paper/60 text-xs uppercase tracking-wide text-muted">
              {columns.map((c) => (
                <th key={c.key} className={`px-4 py-2.5 font-semibold ${c.className || ''}`}>
                  {c.header}
                </th>
              ))}
              {actions && <th className="px-4 py-2.5 text-right font-semibold">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-10 text-center text-muted">
                  Memuat data…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-10 text-center text-muted">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={rowKey(row, i)} className="border-b border-line/70 last:border-0 hover:bg-paper/50">
                  {columns.map((c) => (
                    <td key={c.key} className={`px-4 py-2.5 align-middle ${c.className || ''}`}>
                      {c.render ? c.render(row) : row[c.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-1.5">{actions(row)}</div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
