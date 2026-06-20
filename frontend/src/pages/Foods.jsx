import ResourcePage from '../components/ResourcePage.jsx';
import { formatRupiah } from '../lib/format.js';

const statusChip = (s) =>
  s === 'Ada' ? (
    <span className="chip bg-success/10 text-success">Tersedia</span>
  ) : (
    <span className="chip bg-danger/10 text-danger">Habis</span>
  );

export default function Foods() {
  return (
    <ResourcePage
      title="Menu Makanan"
      singular="Makanan"
      description="Kelola daftar menu kantin. Status 'Habis' otomatis memblokir pemesanan lewat trigger basis data."
      service="kantin"
      endpoint="/makanan"
      idField="ID_mk"
      searchable
      searchPlaceholder="Cari nama / jenis…"
      writeRoles={['admin', 'penjual']}
      deleteRoles={['admin']}
      defaults={{ Status_Ketersediaan_mk: 'Ada' }}
      empty="Belum ada menu makanan."
      columns={[
        { key: 'ID_mk', header: 'ID', className: 'font-mono text-xs' },
        { key: 'Nama_mk', header: 'Nama', render: (r) => <span className="font-medium">{r.Nama_mk}</span> },
        { key: 'Jenis_mk', header: 'Jenis' },
        { key: 'Harga_mk', header: 'Harga', render: (r) => formatRupiah(r.Harga_mk) },
        { key: 'Status_Ketersediaan_mk', header: 'Status', render: (r) => statusChip(r.Status_Ketersediaan_mk) },
      ]}
      fields={[
        { name: 'Nama_mk', label: 'Nama Makanan', required: true, colSpan: 2 },
        { name: 'Jenis_mk', label: 'Jenis', required: true, placeholder: 'Makanan / Minuman / Gorengan' },
        { name: 'Harga_mk', label: 'Harga (Rp)', type: 'number', required: true },
        {
          name: 'Status_Ketersediaan_mk',
          label: 'Ketersediaan',
          type: 'select',
          options: [
            { value: 'Ada', label: 'Ada' },
            { value: 'Habis', label: 'Habis' },
          ],
        },
      ]}
    />
  );
}
