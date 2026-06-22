import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';
import Alert from '../components/Alert.jsx';
import { formatDate, formatRupiah, todayISO } from '../lib/format.js';
import { IconPlus, IconTrash } from '../components/icons.jsx';

const DEFAULT_DENDA = 1000;

function addDays(iso, days) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function Borrowings() {
  const { hasRole } = useAuth();
  const canManage = hasRole('admin', 'pustakawan');

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [listError, setListError] = useState('');

  const [visitors, setVisitors] = useState([]);
  const [librarians, setLibrarians] = useState([]);
  const [books, setBooks] = useState([]);

  const [open, setOpen] = useState(false);
  const [nik, setNik] = useState('');
  const [nikPt, setNikPt] = useState('');
  const [waktuPinjam, setWaktuPinjam] = useState(todayISO());
  const [batasKembali, setBatasKembali] = useState(addDays(todayISO(), 7));
  const [cart, setCart] = useState([]); // [{ id_b, judul, denda_per_hari }]
  const [pickBook, setPickBook] = useState('');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const [detail, setDetail] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const load = useCallback(async (q) => {
    setLoading(true);
    setListError('');
    try {
      setRows(await api.get('/peminjaman', { search: q }));
    } catch (e) {
      setListError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 250);
    return () => clearTimeout(t);
  }, [search, load]);

  const openCreate = async () => {
    setFormError('');
    setNik('');
    setNikPt('');
    setWaktuPinjam(todayISO());
    setBatasKembali(addDays(todayISO(), 7));
    setCart([]);
    setPickBook('');
    setOpen(true);
    try {
      const [v, l, b] = await Promise.all([
        api.get('/pengunjung'),
        api.get('/pustakawan'),
        api.get('/buku'),
      ]);
      setVisitors(v);
      setLibrarians(l);
      setBooks(b);
    } catch (e) {
      setFormError(e.message);
    }
  };

  // Borrowed books stay listed (labelled) — the trigger rejects picking one, not the UI.
  const pickableBooks = books.filter((b) => !cart.some((c) => c.id_b === b.ID_b));

  const addToCart = () => {
    const b = books.find((x) => x.ID_b === pickBook);
    if (!b) return;
    setCart((c) => [...c, { id_b: b.ID_b, judul: b.Judul_b, denda_per_hari: DEFAULT_DENDA }]);
    setPickBook('');
  };

  const submit = async () => {
    setBusy(true);
    setFormError('');
    try {
      await api.post('/peminjaman', {
        nik,
        nikPt,
        waktuPinjam,
        batasKembali,
        items: cart.map((c) => ({ id_b: c.id_b, denda_per_hari: Number(c.denda_per_hari) })),
      });
      setOpen(false);
      await load(search);
    } catch (e) {
      setFormError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const openDetail = async (row) => {
    setDetailOpen(true);
    setDetail(null);
    try {
      setDetail(await api.get(`/peminjaman/${row.ID_pm}`));
    } catch (e) {
      setListError(e.message);
      setDetailOpen(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Peminjaman"
        service="perpustakaan"
        description="Buat transaksi peminjaman buku. Buku otomatis ditandai 'Dipinjam' oleh trigger, dan buku yang sedang dipinjam tidak bisa dipinjam ulang."
        actions={
          canManage && (
            <button className="btn-library" onClick={openCreate}>
              <IconPlus className="h-4 w-4" /> Pinjam Buku
            </button>
          )
        }
      />

      {listError && (
        <div className="mb-3">
          <Alert type="error">{listError}</Alert>
        </div>
      )}

      <DataTable
        columns={[
          { key: 'ID_pm', header: 'ID', className: 'font-mono text-xs',
            render: (r) => (
              <button onClick={() => openDetail(r)} className="font-mono text-xs font-semibold text-library hover:underline">
                {r.ID_pm}
              </button>
            ) },
          { key: 'Nama_k', header: 'Peminjam', render: (r) => <span className="font-medium">{r.Nama_k}</span> },
          { key: 'Nama_pt', header: 'Pustakawan' },
          { key: 'pinjam', header: 'Tgl Pinjam', render: (r) => formatDate(r.Waktu_Pinjam_pm) },
          { key: 'batas', header: 'Batas Kembali', render: (r) => formatDate(r.Batas_Kembali_pm) },
          { key: 'jumlah', header: 'Jml Buku', render: (r) => `${r.jumlah_buku} buku` },
        ]}
        rows={rows}
        loading={loading}
        rowKey={(r) => r.ID_pm}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Cari ID / nama peminjam…"
        empty="Belum ada transaksi peminjaman."
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Transaksi Peminjaman Baru"
        wide
        footer={
          <>
            <button className="btn-ghost" onClick={() => setOpen(false)} disabled={busy}>Batal</button>
            <button className="btn-library" onClick={submit} disabled={busy || !nik || !nikPt || cart.length === 0}>
              {busy ? 'Menyimpan…' : `Pinjamkan ${cart.length} buku`}
            </button>
          </>
        }
      >
        {formError && (
          <div className="mb-3">
            <Alert type="error">{formError}</Alert>
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Pengunjung</label>
            <select className="input" value={nik} onChange={(e) => setNik(e.target.value)}>
              <option value="">— Pilih pengunjung —</option>
              {visitors.map((v) => (
                <option key={v.NIK_k} value={v.NIK_k}>{v.Nama_k} · {v.NIK_k}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Pustakawan Petugas</label>
            <select className="input" value={nikPt} onChange={(e) => setNikPt(e.target.value)}>
              <option value="">— Pilih pustakawan —</option>
              {librarians.map((l) => (
                <option key={l.NIK_pt} value={l.NIK_pt}>{l.Nama_pt} · {l.NIK_pt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tanggal Pinjam</label>
            <input type="date" className="input" value={waktuPinjam} onChange={(e) => setWaktuPinjam(e.target.value)} />
          </div>
          <div>
            <label className="label">Batas Kembali</label>
            <input type="date" className="input" value={batasKembali} onChange={(e) => setBatasKembali(e.target.value)} />
          </div>
        </div>

        <div className="mt-5">
          <label className="label">Tambah Buku</label>
          <div className="flex gap-2">
            <select className="input" value={pickBook} onChange={(e) => setPickBook(e.target.value)}>
              <option value="">— Pilih buku —</option>
              {pickableBooks.map((b) => (
                <option key={b.ID_b} value={b.ID_b}>
                  {b.Judul_b} · {b.ID_b}{b.Keterangan_b === 'Dipinjam' ? ' — Sedang Dipinjam' : ''}
                </option>
              ))}
            </select>
            <button className="btn-ghost shrink-0" onClick={addToCart} disabled={!pickBook}>
              <IconPlus className="h-4 w-4" /> Tambah
            </button>
          </div>
          <p className="mt-1 text-[11px] text-muted">
            Buku "Sedang Dipinjam" tetap bisa dipilih — akan ditolak oleh trg_validasi_buku_sedang_dipinjam saat disimpan.
          </p>

          <div className="mt-3 rounded-lg border border-line">
            {cart.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-muted">Belum ada buku dipilih.</p>
            ) : (
              <ul className="divide-y divide-line">
                {cart.map((c, i) => (
                  <li key={c.id_b} className="flex items-center gap-3 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.judul}</p>
                      <p className="font-mono text-xs text-muted">{c.id_b}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted">Denda/hari</span>
                      <input
                        type="number"
                        className="input h-8 w-24 py-1"
                        value={c.denda_per_hari}
                        onChange={(e) =>
                          setCart((arr) => arr.map((x, idx) => (idx === i ? { ...x, denda_per_hari: e.target.value } : x)))
                        }
                      />
                    </div>
                    <button
                      className="btn-danger h-8 w-8 !px-0"
                      onClick={() => setCart((arr) => arr.filter((_, idx) => idx !== i))}
                      aria-label="Hapus"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Modal>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Detail Peminjaman" wide>
        {!detail ? (
          <p className="py-8 text-center text-muted">Memuat…</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Peminjam" value={detail.Nama_k} />
              <Info label="Pustakawan" value={detail.Nama_pt} />
              <Info label="Tanggal Pinjam" value={formatDate(detail.Waktu_Pinjam_pm)} />
              <Info label="Batas Kembali" value={formatDate(detail.Batas_Kembali_pm)} />
            </div>
            <div>
              <p className="label mb-2">Buku Dipinjam</p>
              <div className="overflow-hidden rounded-lg border border-line">
                <table className="w-full text-sm">
                  <thead className="bg-paper/60 text-xs uppercase text-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">Judul</th>
                      <th className="px-3 py-2 text-left">Dikembalikan</th>
                      <th className="px-3 py-2 text-right">Denda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items.map((it) => (
                      <tr key={it.ID_dpm} className="border-t border-line">
                        <td className="px-3 py-2">{it.Judul_b}</td>
                        <td className="px-3 py-2">
                          {it.Waktu_Kembali_dpm ? (
                            formatDate(it.Waktu_Kembali_dpm)
                          ) : (
                            <span className="chip bg-canteen-soft text-canteen-ink">Belum kembali</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-medium">{formatRupiah(it.denda)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-1 text-[11px] text-muted">
                Denda dihitung oleh fungsi <span className="font-mono">sf_hitung_denda_peminjaman</span>.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg bg-paper/60 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  );
}
