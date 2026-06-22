import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';
import Alert from '../components/Alert.jsx';
import FormField from '../components/FormField.jsx';
import { formatRupiah } from '../lib/format.js';
import { IconPlus, IconEdit, IconTrash } from '../components/icons.jsx';

const CREATE_FIELDS = [
  { name: 'NIK_k', label: 'NIK (16 digit)', required: true, colSpan: 2, placeholder: '3578…' },
  { name: 'Nama_k', label: 'Nama Lengkap', required: true, colSpan: 2 },
  { name: 'No_Telp_k', label: 'No. Telepon' },
  { name: 'Email_k', label: 'Email', required: true, help: 'Harus memuat "@" dan "." — divalidasi oleh trg_validasi_email_pengunjung' },
  { name: 'Alamat_k', label: 'Alamat', type: 'textarea', colSpan: 2 },
];

export default function Visitors() {
  const { hasRole } = useAuth();
  const canWrite = hasRole('admin', 'pustakawan', 'penjual');
  const canDelete = hasRole('admin');
  const isAdmin = hasRole('admin');

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [listError, setListError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async (q) => {
    setLoading(true);
    setListError('');
    try {
      setRows(await api.get('/pengunjung', { search: q }));
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

  const openCreate = () => {
    setEditing(null);
    setForm({});
    setFieldErrors({});
    setFormError('');
    setFormOpen(true);
  };
  const openEdit = (row) => {
    setEditing(row);
    const init = {};
    CREATE_FIELDS.forEach((f) => (init[f.name] = row[f.name] ?? ''));
    setForm(init);
    setFieldErrors({});
    setFormError('');
    setFormOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    setFormError('');
    setFieldErrors({});
    try {
      if (editing) {
        // NIK_k is sent as typed; trg_validasi_update_nik rejects it server-side if changed.
        await api.put(`/pengunjung/${editing.NIK_k}`, form);
      } else {
        await api.post('/pengunjung', form);
      }
      setFormOpen(false);
      await load(search);
    } catch (e) {
      setFormError(e.message);
      if (e.details) setFieldErrors(e.details);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Hapus pengunjung "${row.Nama_k}"? Semua riwayat terkait ikut terhapus.`)) return;
    try {
      await api.del(`/pengunjung/${row.NIK_k}`);
      await load(search);
    } catch (e) {
      setListError(e.message);
    }
  };

  const openDetail = async (row) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const profile = await api.get(`/pengunjung/${row.NIK_k}`);
      setDetail(profile);
    } catch (e) {
      setListError(e.message);
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const statusChip = (s) =>
    s === 'Terdaftar' ? (
      <span className="chip bg-success/10 text-success">Terdaftar</span>
    ) : (
      <span className="chip bg-ink/5 text-muted">{s || 'Tidak Terdaftar'}</span>
    );

  return (
    <div>
      <PageHeader
        title="Pengunjung"
        service="kunjungan"
        description="Data anggota/pengunjung. Klik nama untuk melihat ringkasan aktivitas."
        actions={
          canWrite && (
            <button className="btn-primary" onClick={openCreate}>
              <IconPlus className="h-4 w-4" /> Tambah
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
          { key: 'NIK_k', header: 'NIK', className: 'font-mono text-xs' },
          {
            key: 'Nama_k',
            header: 'Nama',
            render: (r) => (
              <button onClick={() => openDetail(r)} className="text-left font-medium text-ink hover:text-library">
                {r.Nama_k}
              </button>
            ),
          },
          { key: 'No_Telp_k', header: 'Telepon' },
          { key: 'Email_k', header: 'Email' },
        ]}
        rows={rows}
        loading={loading}
        rowKey={(r) => r.NIK_k}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Cari NIK / nama / email…"
        empty="Belum ada pengunjung terdaftar."
        actions={
          canWrite || canDelete
            ? (row) => (
                <>
                  {canWrite && (
                    <button className="btn-ghost h-8 w-8 !px-0" onClick={() => openEdit(row)} aria-label="Ubah">
                      <IconEdit className="h-4 w-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button className="btn-danger h-8 w-8 !px-0" onClick={() => remove(row)} aria-label="Hapus">
                      <IconTrash className="h-4 w-4" />
                    </button>
                  )}
                </>
              )
            : undefined
        }
      />

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Ubah Pengunjung' : 'Tambah Pengunjung'}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setFormOpen(false)} disabled={saving}>Batal</button>
            <button className="btn-primary" onClick={submit} disabled={saving}>
              {saving ? 'Menyimpan…' : 'Simpan'}
            </button>
          </>
        }
      >
        {formError && (
          <div className="mb-3">
            <Alert type="error">{formError}</Alert>
          </div>
        )}
        {editing && (
          <p className="mb-3 rounded-lg bg-paper px-3 py-2 text-xs text-muted">
            {isAdmin
              ? 'Sebagai admin, Anda dapat mengubah NIK (mis. memperbaiki salah input). Peran lain akan ditolak oleh trigger basis data.'
              : 'Mengubah NIK akan ditolak oleh trigger basis data (trg_validasi_update_nik) — hanya admin yang dapat mengubahnya.'}
          </p>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CREATE_FIELDS.map((f) => (
            <FormField
              key={f.name}
              field={f}
              value={form[f.name]}
              onChange={(n, v) => setForm((s) => ({ ...s, [n]: v }))}
              error={fieldErrors[f.name]}
              disabled={saving}
            />
          ))}
        </div>
      </Modal>

      {/* Profile detail — exercises 4 functions */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Profil Pengunjung" wide>
        {detailLoading ? (
          <p className="py-8 text-center text-muted">Memuat…</p>
        ) : detail ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-bold">{detail.Nama_k}</h3>
                <p className="font-mono text-xs text-muted">{detail.NIK_k}</p>
              </div>
              {statusChip(detail.status_pengunjung)}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Metric label="Total Pengeluaran" value={formatRupiah(detail.total_pengeluaran)} tone="canteen" />
              <Metric label="Total Denda" value={formatRupiah(detail.total_denda)} tone="library" />
              <Metric label="Rata-rata Kunjungan" value={`${Number(detail.durasi_kunjungan_rata2 || 0).toFixed(0)} mnt`} tone="library" />
            </div>
            <p className="text-[11px] text-muted">
              Metrik dihitung oleh fungsi <span className="font-mono">sf_total_pengeluaran_pengunjung</span>,{' '}
              <span className="font-mono">sf_total_denda_pengunjung</span>,{' '}
              <span className="font-mono">sf_durasi_kunjungan_rata_rata</span>, dan{' '}
              <span className="font-mono">sf_cek_status_pengunjung</span>.
            </p>
          </div>
        ) : (
          <p className="py-8 text-center text-muted">Data tidak tersedia.</p>
        )}
      </Modal>
    </div>
  );
}

function Metric({ label, value, tone }) {
  const c = tone === 'library' ? 'text-library' : 'text-canteen-ink';
  return (
    <div className="rounded-lg border border-line p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 font-display text-lg font-bold ${c}`}>{value}</p>
    </div>
  );
}
