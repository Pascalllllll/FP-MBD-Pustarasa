import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';
import Alert from '../components/Alert.jsx';
import { formatRupiah, formatDateTime } from '../lib/format.js';
import { IconCart, IconPlus, IconTrash } from '../components/icons.jsx';

export default function Orders() {
  const { user, hasRole } = useAuth();
  const canSell = hasRole('admin', 'penjual');

  const [tab, setTab] = useState('kasir');

  return (
    <div>
      <PageHeader
        title="Kasir & Pesanan"
        service="kantin"
        description="Setiap penjual punya menunya sendiri — pilih penjual untuk membuka kasirnya, lalu buat pesanan. Checkout dijalankan oleh prosedur sp_checkout_pesanan dalam satu transaksi; menu habis otomatis ditolak oleh trigger."
        actions={
          <div className="flex rounded-lg border border-line bg-surface p-0.5">
            {['kasir', 'riwayat'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold capitalize transition-colors ${
                  tab === t ? 'bg-canteen text-canteen-ink' : 'text-muted hover:text-ink'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        }
      />

      {tab === 'kasir' ? (
        canSell ? <PosScreen user={user} /> : <Alert type="info">Hanya admin atau penjual yang dapat mengoperasikan kasir.</Alert>
      ) : (
        <OrderHistory />
      )}
    </div>
  );
}

function PosScreen({ user }) {
  const [foods, setFoods] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [cart, setCart] = useState({}); // id_mk -> { food, qty }
  const [nik, setNik] = useState('');
  const [nikPj, setNikPj] = useState('');
  const [idMp, setIdMp] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [f, v, s, m] = await Promise.all([
          api.get('/makanan'),
          api.get('/pengunjung'),
          api.get('/penjual'),
          api.get('/metode-pembayaran'),
        ]);
        setFoods(f);
        setVisitors(v);
        setSellers(s);
        setMethods(m);
        // Prefill seller if the logged-in user is a penjual linked to a NIK
        if (user?.role === 'penjual' && user?.staffNik && s.some((x) => x.NIK_pj === user.staffNik)) {
          setNikPj(user.staffNik);
        }
      } catch (e) {
        setLoadError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Switching stalls resets the cart — items belong to the previous seller's menu.
  const selectSeller = (nextNik) => {
    setNikPj(nextNik);
    setCart({});
  };

  const add = (food) =>
    setCart((c) => ({ ...c, [food.ID_mk]: { food, qty: (c[food.ID_mk]?.qty || 0) + 1 } }));
  // Quantity is left exactly as typed/clicked, including 0 or negative — checkout
  // sends it as-is so trg_validasi_kuantitas_pesanan is what rejects bad values,
  // not the cart UI silently dropping the line.
  const setQty = (id, qty) =>
    setCart((c) => ({ ...c, [id]: { ...c[id], qty } }));
  const removeFromCart = (id) =>
    setCart((c) => {
      const next = { ...c };
      delete next[id];
      return next;
    });

  const lines = Object.values(cart);
  const total = useMemo(
    () => lines.reduce((sum, l) => sum + Number(l.food.Harga_mk) * l.qty, 0),
    [lines]
  );

  const menu = useMemo(() => foods.filter((f) => f.Penjual_NIK_pj === nikPj), [foods, nikPj]);
  const filteredFoods = menu.filter((f) =>
    f.Nama_mk.toLowerCase().includes(search.toLowerCase())
  );

  const checkout = async () => {
    setBusy(true);
    setError('');
    try {
      const order = await api.post('/pemesanan/checkout', {
        nik,
        nikPj,
        idMp,
        items: lines.map((l) => ({ id_mk: l.food.ID_mk, qty: l.qty })),
      });
      setReceipt(order);
      setCart({});
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="card p-10 text-center text-muted">Memuat menu…</div>;
  if (loadError) return <Alert type="error">{loadError}</Alert>;

  if (!nikPj) {
    return (
      <div>
        <p className="mb-3 text-sm text-muted">Setiap penjual punya menunya sendiri — pilih penjual untuk membuka kasirnya.</p>
        {sellers.length === 0 ? (
          <Alert type="info">Belum ada data penjual.</Alert>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {sellers.map((s) => (
              <button
                key={s.NIK_pj}
                onClick={() => selectSeller(s.NIK_pj)}
                className="card p-4 text-left transition-shadow hover:shadow-pop"
              >
                <span className="font-medium">{s.Nama_pj}</span>
                <span className="block font-mono text-xs text-muted">{s.NIK_pj}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const seller = sellers.find((s) => s.NIK_pj === nikPj);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
        <div>
          <p className="text-xs text-muted">Menu milik</p>
          <p className="font-display text-lg font-bold">{seller?.Nama_pj || nikPj}</p>
        </div>
        <button className="btn-ghost" onClick={() => selectSeller('')}>Ganti Penjual</button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div>
        <input
          className="input mb-3"
          placeholder="Cari menu…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {filteredFoods.length === 0 ? (
          <div className="card p-8 text-center text-muted">Belum ada menu untuk penjual ini.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filteredFoods.map((f) => {
              const habis = f.Status_Ketersediaan_mk === 'Habis';
              return (
                <button
                  key={f.ID_mk}
                  onClick={() => add(f)}
                  title={habis ? 'Stok habis — bisa dicoba, akan ditolak trigger basis data saat checkout' : undefined}
                  className={`card group flex flex-col items-start p-3 text-left transition-shadow hover:shadow-pop ${habis ? 'opacity-70' : ''}`}
                >
                  <span className="mb-2 flex flex-wrap gap-1">
                    <span className="chip bg-canteen-soft text-canteen-ink">{f.Jenis_mk}</span>
                    {habis && <span className="chip bg-danger/10 text-danger">Habis</span>}
                  </span>
                  <span className="font-medium leading-tight">{f.Nama_mk}</span>
                  <span className="mt-1 text-sm font-semibold text-canteen-ink">{formatRupiah(f.Harga_mk)}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs text-muted group-hover:text-canteen-ink">
                    <IconPlus className="h-3.5 w-3.5" /> Tambah
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="card sticky top-20 h-fit p-4">
        <div className="mb-3 flex items-center gap-2">
          <IconCart className="h-5 w-5 text-canteen-ink" />
          <h3 className="font-display text-lg font-bold">Keranjang</h3>
          <span className="ml-auto chip bg-canteen-soft text-canteen-ink">{lines.length} item</span>
        </div>

        {error && (
          <div className="mb-3">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="label">Pengunjung</label>
            <select className="input" value={nik} onChange={(e) => setNik(e.target.value)}>
              <option value="">— Pilih —</option>
              {visitors.map((v) => (
                <option key={v.NIK_k} value={v.NIK_k}>{v.Nama_k}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Pembayaran</label>
            <select className="input" value={idMp} onChange={(e) => setIdMp(e.target.value)}>
              <option value="">— Pilih —</option>
              {methods.map((m) => (
                <option key={m.ID_mp} value={m.ID_mp}>{m.Instansi_mp} · {m.Jenis_mp}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="my-3 border-t border-line" />

        {lines.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">Keranjang kosong. Pilih menu di kiri.</p>
        ) : (
          <ul className="space-y-2">
            {lines.map((l) => (
              <li key={l.food.ID_mk} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{l.food.Nama_mk}</p>
                  <p className="text-xs text-muted">{formatRupiah(l.food.Harga_mk)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button className="btn-ghost h-7 w-7 !px-0" onClick={() => setQty(l.food.ID_mk, l.qty - 1)}>−</button>
                  <input
                    type="number"
                    className="input h-7 w-14 px-1 text-center text-sm"
                    value={l.qty}
                    onChange={(e) => setQty(l.food.ID_mk, e.target.value === '' ? '' : Number(e.target.value))}
                  />
                  <button className="btn-ghost h-7 w-7 !px-0" onClick={() => setQty(l.food.ID_mk, l.qty + 1)}>+</button>
                </div>
                <button className="btn-danger h-7 w-7 !px-0" onClick={() => removeFromCart(l.food.ID_mk)} aria-label="Hapus">
                  <IconTrash className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {lines.length > 0 && (
          <p className="mt-2 text-[11px] text-muted">
            Menu "Habis" atau kuantitas ≤ 0 tetap bisa dicoba — akan ditolak oleh trigger basis data saat diproses.
          </p>
        )}

        <div className="my-3 border-t border-line" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-muted">Total</span>
          <span className="font-display text-xl font-bold text-canteen-ink">{formatRupiah(total)}</span>
        </div>

        <button
          className="btn-canteen mt-4 w-full"
          onClick={checkout}
          disabled={busy || lines.length === 0 || !nik || !idMp}
        >
          {busy ? 'Memproses…' : 'Proses Pesanan'}
        </button>
      </div>
      </div>

      <Modal
        open={!!receipt}
        onClose={() => setReceipt(null)}
        title="Pesanan Berhasil"
        footer={<button className="btn-primary" onClick={() => setReceipt(null)}>Selesai</button>}
      >
        {receipt && (
          <div className="space-y-3">
            <div className="text-center">
              <p className="font-mono text-sm text-muted">{receipt.ID_ps}</p>
              <p className="font-display text-2xl font-bold text-canteen-ink">{formatRupiah(receipt.total)}</p>
              <p className="text-xs text-muted">{formatDateTime(receipt.Waktu_Pesan_ps)}</p>
            </div>
            <div className="rounded-lg border border-line">
              <ul className="divide-y divide-line text-sm">
                {receipt.items.map((it) => (
                  <li key={it.ID_dps} className="flex justify-between px-3 py-2">
                    <span>{it.Nama_mk} × {it.Kuantitas_dps}</span>
                    <span className="font-medium">{formatRupiah(it.subtotal)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-center text-xs text-muted">
              {receipt.Nama_k} · {receipt.Instansi_mp} {receipt.Jenis_mp}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

function OrderHistory() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);

  const load = useCallback(async (q) => {
    setLoading(true);
    setError('');
    try {
      setRows(await api.get('/pemesanan', { search: q }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 250);
    return () => clearTimeout(t);
  }, [search, load]);

  const openDetail = async (row) => {
    setDetail({ loading: true });
    try {
      setDetail(await api.get(`/pemesanan/${row.ID_ps}`));
    } catch (e) {
      setError(e.message);
      setDetail(null);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-3">
          <Alert type="error">{error}</Alert>
        </div>
      )}
      <DataTable
        columns={[
          { key: 'ID_ps', header: 'ID', className: 'font-mono text-xs',
            render: (r) => (
              <button onClick={() => openDetail(r)} className="font-mono text-xs font-semibold text-canteen-ink hover:underline">
                {r.ID_ps}
              </button>
            ) },
          { key: 'waktu', header: 'Waktu', render: (r) => formatDateTime(r.Waktu_Pesan_ps) },
          { key: 'Nama_k', header: 'Pembeli' },
          { key: 'Nama_pj', header: 'Penjual' },
          { key: 'metode', header: 'Bayar', render: (r) => `${r.Instansi_mp} · ${r.Jenis_mp}` },
          { key: 'total', header: 'Total', className: 'text-right', render: (r) => <span className="font-semibold">{formatRupiah(r.total)}</span> },
        ]}
        rows={rows}
        loading={loading}
        rowKey={(r) => r.ID_ps}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Cari ID / pembeli…"
        empty="Belum ada pesanan."
      />

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Detail Pesanan">
        {!detail || detail.loading ? (
          <p className="py-8 text-center text-muted">Memuat…</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-muted">{detail.ID_ps}</span>
              <span className="font-display text-xl font-bold text-canteen-ink">{formatRupiah(detail.total)}</span>
            </div>
            <div className="rounded-lg border border-line">
              <ul className="divide-y divide-line text-sm">
                {detail.items.map((it) => (
                  <li key={it.ID_dps} className="flex justify-between px-3 py-2">
                    <span>{it.Nama_mk} × {it.Kuantitas_dps} <span className="text-muted">@ {formatRupiah(it.Harga_Satuan_dps)}</span></span>
                    <span className="font-medium">{formatRupiah(it.subtotal)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-muted">
              {detail.Nama_k} · dilayani {detail.Nama_pj} · {detail.Instansi_mp} {detail.Jenis_mp}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
