import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';
import Alert from '../components/Alert.jsx';
import { formatDateTime } from '../lib/format.js';
import { IconPlus, IconReturn } from '../components/icons.jsx';

export default function Visits() {
  const { hasRole } = useAuth();
  const canManage = hasRole('admin', 'pustakawan', 'penjual');

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOnly, setActiveOnly] = useState(false);
  const [listError, setListError] = useState('');

  const [open, setOpen] = useState(false);
  const [nik, setNik] = useState('');
  const [waktuMasuk, setWaktuMasuk] = useState('');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const [checkoutRow, setCheckoutRow] = useState(null);
  const [waktuKeluar, setWaktuKeluar] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setListError('');
    try {
      setRows(await api.get('/kunjungan', { active: activeOnly ? 'true' : undefined }));
    } catch (e) {
      setListError(e.message);
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const checkIn = async () => {
    setBusy(true);
    setFormError('');
    try {
      await api.post('/kunjungan/check-in', { nik: nik.trim(), waktuMasuk: waktuMasuk || undefined });
      setOpen(false);
      setNik('');
      setWaktuMasuk('');
      await load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const openCheckout = (row) => {
    setCheckoutRow(row);
    setWaktuKeluar('');
    setCheckoutError('');
  };

  const submitCheckout = async () => {
    setCheckoutBusy(true);
    setCheckoutError('');
    try {
      await api.patch(`/kunjungan/${checkoutRow.ID_wk}/check-out`, { waktuKeluar: waktuKeluar || undefined });
      setCheckoutRow(null);
      await load();
    } catch (e) {
      setCheckoutError(e.message);
    } finally {
      setCheckoutBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Buku Tamu"
        service="kunjungan"
        description="Catat kunjungan masuk dan keluar ruang baca. Waktu keluar tidak boleh mendahului waktu masuk (divalidasi trigger)."
        actions={
          canManage && (
            <button className="btn-library" onClick={() => setOpen(true)}>
              <IconPlus className="h-4 w-4" /> Check-in
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
          { key: 'ID_wk', header: 'ID', className: 'font-mono text-xs' },
          { key: 'Nama_k', header: 'Pengunjung', render: (r) => <span className="font-medium">{r.Nama_k}</span> },
          { key: 'NIK', header: 'NIK', className: 'font-mono text-xs', render: (r) => r.Pengunjung_NIK_k },
          { key: 'masuk', header: 'Masuk', render: (r) => formatDateTime(r.Waktu_Masuk_wk) },
          {
            key: 'keluar',
            header: 'Keluar',
            render: (r) =>
              r.Waktu_Keluar_wk ? (
                formatDateTime(r.Waktu_Keluar_wk)
              ) : (
                <span className="chip bg-library-soft text-library-ink">Masih di dalam</span>
              ),
          },
        ]}
        rows={rows}
        loading={loading}
        rowKey={(r) => r.ID_wk}
        toolbar={
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="h-4 w-4 rounded border-line"
            />
            Hanya yang masih di dalam
          </label>
        }
        empty="Belum ada kunjungan tercatat."
        actions={
          canManage
            ? (row) =>
                row.Waktu_Keluar_wk ? (
                  <span className="text-xs text-muted">Selesai</span>
                ) : (
                  <button className="btn-ghost h-8 !px-2 text-xs" onClick={() => openCheckout(row)}>
                    <IconReturn className="h-3.5 w-3.5" /> Check-out
                  </button>
                )
            : undefined
        }
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Check-in Pengunjung"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setOpen(false)} disabled={busy}>Batal</button>
            <button className="btn-library" onClick={checkIn} disabled={busy}>
              {busy ? 'Menyimpan…' : 'Catat Masuk'}
            </button>
          </>
        }
      >
        {formError && (
          <div className="mb-3">
            <Alert type="error">{formError}</Alert>
          </div>
        )}
        <label className="label" htmlFor="nik">NIK Pengunjung</label>
        <input
          id="nik"
          className="input"
          value={nik}
          onChange={(e) => setNik(e.target.value)}
          placeholder="Masukkan 16 digit NIK"
          autoFocus
        />
        <p className="mt-1 text-xs text-muted">NIK harus sudah terdaftar pada menu Pengunjung.</p>

        <label className="label mt-3" htmlFor="waktuMasuk">Waktu Masuk (opsional)</label>
        <input
          id="waktuMasuk"
          type="datetime-local"
          className="input"
          value={waktuMasuk}
          onChange={(e) => setWaktuMasuk(e.target.value)}
        />
        <p className="mt-1 text-xs text-muted">Kosongkan untuk memakai waktu sekarang, atau isi manual untuk mencatat kunjungan yang lalu.</p>
      </Modal>

      <Modal
        open={!!checkoutRow}
        onClose={() => setCheckoutRow(null)}
        title="Catat Keluar"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setCheckoutRow(null)} disabled={checkoutBusy}>Batal</button>
            <button className="btn-library" onClick={submitCheckout} disabled={checkoutBusy}>
              {checkoutBusy ? 'Menyimpan…' : 'Catat Keluar'}
            </button>
          </>
        }
      >
        {checkoutError && (
          <div className="mb-3">
            <Alert type="error">{checkoutError}</Alert>
          </div>
        )}
        <p className="mb-3 text-sm">
          Catat waktu keluar untuk <span className="font-medium">{checkoutRow?.Nama_k}</span>.
        </p>
        <label className="label" htmlFor="waktuKeluar">Waktu Keluar (opsional)</label>
        <input
          id="waktuKeluar"
          type="datetime-local"
          className="input"
          value={waktuKeluar}
          onChange={(e) => setWaktuKeluar(e.target.value)}
        />
        <p className="mt-1 text-xs text-muted">
          Kosongkan untuk memakai waktu sekarang. Waktu keluar sebelum waktu masuk akan ditolak oleh trg_validasi_waktu_kunjung.
        </p>
      </Modal>
    </div>
  );
}
