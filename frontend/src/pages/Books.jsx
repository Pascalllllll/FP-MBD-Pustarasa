import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';
import Alert from '../components/Alert.jsx';
import FormField from '../components/FormField.jsx';
import { IconPlus, IconEdit, IconTrash, IconSearch } from '../components/icons.jsx';

const FIELDS = [
  { name: 'Judul_b', label: 'Judul Buku', required: true, colSpan: 2 },
  { name: 'Penulis_b', label: 'Penulis', required: true },
  { name: 'Jenis_b', label: 'Jenis / Genre', required: true, placeholder: 'Novel, Sains, Sejarah…' },
  { name: 'Tahun_Terbit_b', label: 'Tahun Terbit', type: 'number', required: true },
  {
    name: 'Kualitas_b',
    label: 'Kualitas',
    type: 'select',
    required: true,
    options: ['Baik', 'Cukup', 'Rusak Ringan', 'Rusak Berat'].map((v) => ({ value: v, label: v })),
  },
  { name: 'Sinopsis_b', label: 'Sinopsis', type: 'textarea', colSpan: 2 },
];

const statusChip = (s) =>
  s === 'Dipinjam' ? (
    <span className="chip bg-canteen-soft text-canteen-ink">Dipinjam</span>
  ) : (
    <span className="chip bg-success/10 text-success">Tersedia</span>
  );

export default function Books() {
  const { hasRole } = useAuth();
  const canWrite = hasRole('admin', 'pustakawan');
  const canDelete = hasRole('admin');

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
      setRows(await api.get('/buku', { search: q }));
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
    setForm({ Kualitas_b: 'Baik' });
    setFieldErrors({});
    setFormError('');
    setFormOpen(true);
  };
  const openEdit = (row) => {
    setEditing(row);
    const init = {};
    FIELDS.forEach((f) => (init[f.name] = row[f.name] ?? ''));
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
      if (editing) await api.put(`/buku/${editing.ID_b}`, form);
      else await api.post('/buku', form);
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
    if (!window.confirm(`Hapus buku "${row.Judul_b}"?`)) return;
    try {
      await api.del(`/buku/${row.ID_b}`);
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
      setDetail(await api.get(`/buku/${row.ID_b}`));
    } catch (e) {
      setListError(e.message);
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Katalog Buku"
        service="perpustakaan"
        description="Koleksi perpustakaan. Status pinjam diperbarui otomatis oleh trigger saat buku dipinjam atau dikembalikan."
        actions={
          canWrite && (
            <button className="btn-primary" onClick={openCreate}>
              <IconPlus className="h-4 w-4" /> Tambah Buku
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
          { key: 'ID_b', header: 'ID', className: 'font-mono text-xs' },
          {
            key: 'Judul_b',
            header: 'Judul',
            render: (r) => (
              <button onClick={() => openDetail(r)} className="text-left font-medium text-ink hover:text-library">
                {r.Judul_b}
              </button>
            ),
          },
          { key: 'Penulis_b', header: 'Penulis' },
          { key: 'Jenis_b', header: 'Genre' },
          { key: 'Tahun_Terbit_b', header: 'Tahun' },
          { key: 'Keterangan_b', header: 'Status', render: (r) => statusChip(r.Keterangan_b) },
        ]}
        rows={rows}
        loading={loading}
        rowKey={(r) => r.ID_b}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Cari judul / penulis / genre…"
        empty="Belum ada buku di katalog."
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
        title={editing ? 'Ubah Buku' : 'Tambah Buku'}
        wide
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <FormField key={f.name} field={f} value={form[f.name]} onChange={(n, v) => setForm((s) => ({ ...s, [n]: v }))} error={fieldErrors[f.name]} disabled={saving} />
          ))}
        </div>
      </Modal>

      {/* Detail modal — exercises sf_cek_ketersediaan_buku + sf_rekomendasi_buku */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Detail Buku" wide>
        {detailLoading ? (
          <p className="py-8 text-center text-muted">Memuat…</p>
        ) : detail ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-bold">{detail.Judul_b}</h3>
                <p className="text-sm text-muted">
                  {detail.Penulis_b} · {detail.Tahun_Terbit_b} · {detail.Jenis_b}
                </p>
              </div>
              <span className="chip bg-library-soft font-mono text-library-ink">{detail.ID_b}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-line p-3">
                <p className="label mb-1">Ketersediaan (fungsi)</p>
                <p className="font-semibold">{detail.ketersediaan}</p>
              </div>
              <div className="rounded-lg border border-line p-3">
                <p className="label mb-1">Kualitas</p>
                <p className="font-semibold">{detail.Kualitas_b}</p>
              </div>
            </div>

            {detail.Sinopsis_b && (
              <div>
                <p className="label mb-1">Sinopsis</p>
                <p className="text-sm leading-relaxed text-ink/80">{detail.Sinopsis_b}</p>
              </div>
            )}

            <div className="rounded-lg bg-library-soft/50 p-3">
              <p className="label mb-1 text-library-ink">Rekomendasi genre serupa</p>
              <p className="text-sm text-library-ink/90">
                {detail.rekomendasi || 'Tidak ada rekomendasi.'}
              </p>
              <p className="mt-1 text-[11px] text-muted">
                Dihasilkan oleh <span className="font-mono">sf_rekomendasi_buku</span>.
              </p>
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-muted">Data tidak tersedia.</p>
        )}
      </Modal>
    </div>
  );
}
