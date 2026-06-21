import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import PageHeader from '../components/PageHeader.jsx';
import ServiceTag from '../components/ServiceTag.jsx';
import Alert from '../components/Alert.jsx';
import { formatRupiah, formatDate, formatDateTime, todayISO } from '../lib/format.js';

const SERVICE_OF = { perpustakaan: 'perpustakaan', kantin: 'kantin', kunjungan: 'kunjungan' };

// Heuristics to format dynamic view columns nicely.
const MONEY = /(pendapatan|penjualan|harga|denda|pengeluaran|total_penjualan)/i;
const DATEONLY = /(tanggal|waktu_pinjam|batas_kembali|waktu_kembali)/i;
const DATETIME = /(waktu_masuk|waktu_keluar|waktu_pesan|waktu_ubah)/i;

function formatCell(key, val) {
  if (val === null || val === undefined) return '—';
  if (MONEY.test(key) && !Number.isNaN(Number(val))) return formatRupiah(val);
  if (DATETIME.test(key)) return formatDateTime(val);
  if (DATEONLY.test(key)) return formatDate(val);
  return String(val);
}

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [active, setActive] = useState(null);
  const [data, setData] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');

  const [recapDate, setRecapDate] = useState(todayISO());
  const [recap, setRecap] = useState(null);
  const [recapBusy, setRecapBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await api.get('/laporan');
        setReports(list);
        if (list[0]) selectReport(list[0].slug);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoadingList(false);
      }
    })();
    fetchRecap(todayISO());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectReport = async (slug) => {
    setActive(slug);
    setLoadingData(true);
    setData(null);
    try {
      setData(await api.get(`/laporan/${slug}`));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchRecap = async (date) => {
    setRecapBusy(true);
    try {
      setRecap(await api.get('/laporan/daily-recap', { tanggal: date }));
    } catch (e) {
      setError(e.message);
    } finally {
      setRecapBusy(false);
    }
  };

  const grouped = useMemo(() => {
    const g = { perpustakaan: [], kunjungan: [], kantin: [] };
    reports.forEach((r) => (g[r.service] || (g[r.service] = [])).push(r));
    return g;
  }, [reports]);

  const columns = data && data.rows[0] ? Object.keys(data.rows[0]) : [];

  return (
    <div>
      <PageHeader
        title="Laporan"
        service="manajemen"
        description="Seluruh laporan analitis bersumber langsung dari 20 view basis data. Rekap harian dihitung oleh prosedur sp_rekap_harian."
      />

      {error && (
        <div className="mb-3">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      <div className="card mb-5 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold">Rekap Harian</h3>
            <p className="text-xs text-muted">
              Prosedur <span className="font-mono">sp_rekap_harian</span>
            </p>
          </div>
          <div className="flex items-end gap-2">
            <div>
              <label className="label">Tanggal</label>
              <input type="date" className="input" value={recapDate} onChange={(e) => setRecapDate(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={() => fetchRecap(recapDate)} disabled={recapBusy}>
              {recapBusy ? '…' : 'Tampilkan'}
            </button>
          </div>
        </div>
        {recap && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Recap label="Kunjungan" value={recap.Jumlah_Kunjungan} tone="library" />
            <Recap label="Peminjaman" value={recap.Jumlah_Peminjaman} tone="library" />
            <Recap label="Pemesanan" value={recap.Jumlah_Pemesanan} tone="canteen" />
            <Recap label="Total Penjualan" value={formatRupiah(recap.Total_Penjualan)} tone="canteen" />
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <div className="card h-fit p-3">
          {loadingList ? (
            <p className="p-4 text-center text-sm text-muted">Memuat…</p>
          ) : (
            ['perpustakaan', 'kunjungan', 'kantin'].map((svc) =>
              (grouped[svc] || []).length ? (
                <div key={svc} className="mb-3 last:mb-0">
                  <div className="mb-1 px-2">
                    <ServiceTag service={SERVICE_OF[svc]} />
                  </div>
                  <ul className="space-y-0.5">
                    {grouped[svc].map((r) => (
                      <li key={r.slug}>
                        <button
                          onClick={() => selectReport(r.slug)}
                          className={`w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                            active === r.slug ? 'bg-ink text-paper' : 'text-ink/80 hover:bg-paper'
                          }`}
                        >
                          {r.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null
            )
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-line px-4 py-3">
            <h3 className="font-display font-bold">{data?.title || 'Pilih laporan'}</h3>
          </div>
          <div className="overflow-x-auto">
            {loadingData ? (
              <p className="p-10 text-center text-muted">Memuat data…</p>
            ) : !data || data.rows.length === 0 ? (
              <p className="p-10 text-center text-muted">Tidak ada data untuk laporan ini.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-paper/60 text-xs uppercase tracking-wide text-muted">
                    {columns.map((c) => (
                      <th key={c} className="px-4 py-2.5 font-semibold">{c.replace(/_/g, ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, i) => (
                    <tr key={i} className="border-b border-line/70 last:border-0 hover:bg-paper/50">
                      {columns.map((c) => (
                        <td key={c} className="px-4 py-2.5">{formatCell(c, row[c])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {data && data.rows.length > 0 && (
            <div className="border-t border-line px-4 py-2 text-xs text-muted">
              {data.rows.length} baris
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Recap({ label, value, tone }) {
  const c = tone === 'library' ? 'text-library' : 'text-canteen-ink';
  return (
    <div className="rounded-lg bg-paper/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 font-display text-xl font-bold ${c}`}>{value}</p>
    </div>
  );
}
