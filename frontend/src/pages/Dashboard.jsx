import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatCard from '../components/StatCard.jsx';
import Alert from '../components/Alert.jsx';
import { formatRupiah, formatDate, todayISO } from '../lib/format.js';
import {
  IconBook, IconBorrow, IconVisitor, IconClock, IconFood, IconCart, IconReport,
} from '../components/icons.jsx';

function WorldHeader({ tone, kicker, title }) {
  const bar = tone === 'library' ? 'bg-library' : 'bg-canteen';
  const text = tone === 'library' ? 'text-library' : 'text-canteen-ink';
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className={`h-6 w-1.5 rounded-full ${bar}`} />
      <div>
        <p className={`text-[11px] font-bold uppercase tracking-widest ${text}`}>{kicker}</p>
        <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [kpi, setKpi] = useState(null);
  const [recap, setRecap] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [k, r] = await Promise.all([
          api.get('/laporan/dashboard'),
          api.get('/laporan/daily-recap', { tanggal: todayISO() }),
        ]);
        if (!active) return;
        setKpi(k);
        setRecap(r);
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-muted">Selamat datang kembali,</p>
        <h2 className="font-display text-2xl font-bold text-ink">
          {user?.fullName} <span className="text-muted">·</span>{' '}
          <span className="text-base font-medium text-muted">Ringkasan operasional hari ini</span>
        </h2>
      </div>

      {error && (
        <div className="mb-4">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      {loading ? (
        <div className="card p-10 text-center text-muted">Memuat ringkasan…</div>
      ) : (
        <div className="space-y-8">
          {/* DUAL-WORLD SPLIT — the signature layout */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Perpustakaan world */}
            <section className="rounded-xl2 border border-library/15 bg-library-soft/40 p-5">
              <WorldHeader tone="library" kicker="Dunia Buku" title="Perpustakaan" />
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Total Buku" value={kpi.total_buku} icon={IconBook} accent="library" />
                <StatCard label="Sedang Dipinjam" value={kpi.buku_dipinjam} icon={IconBorrow} accent="library" />
                <StatCard label="Belum Kembali" value={kpi.buku_belum_kembali} sub="eksemplar" icon={IconBorrow} accent="library" />
                <StatCard label="Total Pengunjung" value={kpi.total_pengunjung} icon={IconVisitor} accent="library" />
              </div>
            </section>

            {/* Kantin world */}
            <section className="rounded-xl2 border border-canteen/20 bg-canteen-soft/40 p-5">
              <WorldHeader tone="canteen" kicker="Dunia Rasa" title="Kantin" />
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Menu Tersedia" value={kpi.makanan_tersedia} sub={`${kpi.makanan_habis} habis`} icon={IconFood} accent="canteen" />
                <StatCard label="Pendapatan Hari Ini" value={formatRupiah(kpi.pendapatan_hari_ini)} icon={IconCart} accent="canteen" />
                <StatCard label="Pendapatan Total" value={formatRupiah(kpi.pendapatan_total)} icon={IconReport} accent="canteen" />
                <StatCard label="Total Menu" value={kpi.total_makanan} icon={IconFood} accent="canteen" />
              </div>
            </section>
          </div>

          {/* Kunjungan strip */}
          <section>
            <WorldHeader tone="library" kicker="Aktivitas" title="Kunjungan Ruang Baca" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Sedang di Dalam" value={kpi.kunjungan_aktif} sub="belum check-out" icon={IconClock} accent="ink" />
              <StatCard label="Kunjungan Hari Ini" value={kpi.kunjungan_hari_ini} icon={IconVisitor} accent="ink" />
              <StatCard label="Pustakawan" value={kpi.total_pustakawan} icon={IconVisitor} accent="ink" />
              <StatCard label="Menu Habis" value={kpi.makanan_habis} icon={IconFood} accent="ink" />
            </div>
          </section>

          {/* Daily recap — sourced from stored procedure sp_rekap_harian */}
          {recap && (
            <section className="card p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold">Rekap Harian</h3>
                  <p className="text-xs text-muted">
                    Dihitung oleh prosedur <span className="font-mono">sp_rekap_harian</span> · {formatDate(recap.Tanggal)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <RecapItem label="Kunjungan" value={recap.Jumlah_Kunjungan} tone="library" />
                <RecapItem label="Peminjaman" value={recap.Jumlah_Peminjaman} tone="library" />
                <RecapItem label="Pemesanan" value={recap.Jumlah_Pemesanan} tone="canteen" />
                <RecapItem label="Total Penjualan" value={formatRupiah(recap.Total_Penjualan)} tone="canteen" />
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function RecapItem({ label, value, tone }) {
  const c = tone === 'library' ? 'text-library' : 'text-canteen-ink';
  return (
    <div className="rounded-lg bg-paper/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 font-display text-xl font-bold ${c}`}>{value}</p>
    </div>
  );
}
