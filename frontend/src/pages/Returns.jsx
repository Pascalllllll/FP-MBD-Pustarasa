import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';
import Alert from '../components/Alert.jsx';
import { formatDate, formatRupiah, todayISO } from '../lib/format.js';
import { IconReturn } from '../components/icons.jsx';

export default function Returns() {
  const { hasRole } = useAuth();
  const canManage = hasRole('admin', 'pustakawan');

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');

  const [target, setTarget] = useState(null);
  const [tanggal, setTanggal] = useState(todayISO());
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [result, setResult] = useState(null); // { denda }

  const load = useCallback(async () => {
    setLoading(true);
    setListError('');
    try {
      setRows(await api.get('/peminjaman/reports/outstanding'));
    } catch (e) {
      setListError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openReturn = (row) => {
    setTarget(row);
    setTanggal(todayISO());
    setFormError('');
    setResult(null);
  };

  const confirmReturn = async () => {
    setBusy(true);
    setFormError('');
    try {
      const res = await api.patch(`/peminjaman/lines/${target.ID_dpm}/return`, { tanggal });
      setResult(res);
      await load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const isOverdue = (batas) => new Date(batas) < new Date(todayISO());

  return (
    <div>
      <PageHeader
        title="Pengembalian"
        service="perpustakaan"
        description="Daftar buku yang masih dipinjam. Proses pengembalian memanggil prosedur sp_pengembalian_buku, yang mencatat tanggal kembali, melepas status buku, dan menghitung denda."
      />

      {listError && (
        <div className="mb-3">
          <Alert type="error">{listError}</Alert>
        </div>
      )}

      <DataTable
        columns={[
          { key: 'ID_dpm', header: 'ID Detail', className: 'font-mono text-xs' },
          { key: 'Judul_b', header: 'Judul', render: (r) => <span className="font-medium">{r.Judul_b}</span> },
          { key: 'Nama_Peminjam', header: 'Peminjam' },
          { key: 'pinjam', header: 'Tgl Pinjam', render: (r) => formatDate(r.Waktu_Pinjam_pm) },
          {
            key: 'batas',
            header: 'Batas Kembali',
            render: (r) => (
              <span className={isOverdue(r.Batas_Kembali_pm) ? 'font-semibold text-danger' : ''}>
                {formatDate(r.Batas_Kembali_pm)}
                {isOverdue(r.Batas_Kembali_pm) && <span className="ml-1 text-xs">(terlambat)</span>}
              </span>
            ),
          },
        ]}
        rows={rows}
        loading={loading}
        rowKey={(r) => r.ID_dpm}
        empty="Tidak ada buku yang sedang dipinjam. 🎉"
        actions={
          canManage
            ? (row) => (
                <button className="btn-library h-8 !px-3 text-xs" onClick={() => openReturn(row)}>
                  <IconReturn className="h-3.5 w-3.5" /> Kembalikan
                </button>
              )
            : undefined
        }
      />

      <Modal
        open={!!target}
        onClose={() => setTarget(null)}
        title="Proses Pengembalian"
        footer={
          result ? (
            <button className="btn-primary" onClick={() => setTarget(null)}>Selesai</button>
          ) : (
            <>
              <button className="btn-ghost" onClick={() => setTarget(null)} disabled={busy}>Batal</button>
              <button className="btn-library" onClick={confirmReturn} disabled={busy}>
                {busy ? 'Memproses…' : 'Konfirmasi Pengembalian'}
              </button>
            </>
          )
        }
      >
        {formError && (
          <div className="mb-3">
            <Alert type="error">{formError}</Alert>
          </div>
        )}

        {target && !result && (
          <div className="space-y-4">
            <div className="rounded-lg bg-paper/60 p-3">
              <p className="font-medium">{target.Judul_b}</p>
              <p className="text-sm text-muted">
                Peminjam: {target.Nama_Peminjam} · Batas: {formatDate(target.Batas_Kembali_pm)}
              </p>
            </div>
            <div>
              <label className="label">Tanggal Pengembalian</label>
              <input type="date" className="input" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
              <p className="mt-1 text-xs text-muted">
                Denda akan dihitung otomatis bila melewati batas kembali.
              </p>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-3 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success/10 text-success">
              <IconReturn className="h-6 w-6" />
            </div>
            <p className="font-medium">Buku berhasil dikembalikan.</p>
            <div className="rounded-lg border border-line p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Denda</p>
              <p className={`mt-1 font-display text-2xl font-bold ${Number(result.denda) > 0 ? 'text-danger' : 'text-success'}`}>
                {formatRupiah(result.denda)}
              </p>
              {Number(result.denda) === 0 && <p className="text-xs text-muted">Dikembalikan tepat waktu.</p>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
