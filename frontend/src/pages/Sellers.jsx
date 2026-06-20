import ResourcePage from '../components/ResourcePage.jsx';
import { formatDate } from '../lib/format.js';

export default function Sellers() {
  return (
    <ResourcePage
      title="Penjual"
      singular="Penjual"
      description="Data penjual kantin yang memproses pesanan makanan."
      service="manajemen"
      endpoint="/penjual"
      idField="NIK_pj"
      searchable
      searchPlaceholder="Cari NIK / nama…"
      writeRoles={['admin']}
      deleteRoles={['admin']}
      empty="Belum ada data penjual."
      columns={[
        { key: 'NIK_pj', header: 'NIK', className: 'font-mono text-xs' },
        { key: 'Nama_pj', header: 'Nama', render: (r) => <span className="font-medium">{r.Nama_pj}</span> },
        { key: 'Tanggal_Lahir_pj', header: 'Tgl Lahir', render: (r) => formatDate(r.Tanggal_Lahir_pj) },
        { key: 'No_Telp_pj', header: 'Telepon' },
        { key: 'Email_pj', header: 'Email' },
      ]}
      fields={[
        { name: 'NIK_pj', label: 'NIK (16 digit)', required: true, createOnly: true, placeholder: '3578…' },
        { name: 'Nama_pj', label: 'Nama Lengkap', required: true },
        { name: 'Tanggal_Lahir_pj', label: 'Tanggal Lahir', type: 'date', required: true },
        { name: 'No_Telp_pj', label: 'No. Telepon' },
        { name: 'Email_pj', label: 'Email' },
        { name: 'Alamat_pj', label: 'Alamat', type: 'textarea', colSpan: 2 },
      ]}
    />
  );
}
