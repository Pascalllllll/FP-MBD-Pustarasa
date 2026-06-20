import ResourcePage from '../components/ResourcePage.jsx';
import { formatDate } from '../lib/format.js';

export default function Librarians() {
  return (
    <ResourcePage
      title="Pustakawan"
      singular="Pustakawan"
      description="Data petugas perpustakaan. Usia minimal 18 tahun divalidasi otomatis oleh trigger saat menyimpan."
      service="manajemen"
      endpoint="/pustakawan"
      idField="NIK_pt"
      searchable
      searchPlaceholder="Cari NIK / nama…"
      writeRoles={['admin']}
      deleteRoles={['admin']}
      empty="Belum ada data pustakawan."
      columns={[
        { key: 'NIK_pt', header: 'NIK', className: 'font-mono text-xs' },
        { key: 'Nama_pt', header: 'Nama', render: (r) => <span className="font-medium">{r.Nama_pt}</span> },
        { key: 'Jadwal_Shift_pt', header: 'Shift' },
        { key: 'Tanggal_Lahir_pt', header: 'Tgl Lahir', render: (r) => formatDate(r.Tanggal_Lahir_pt) },
        { key: 'No_Telp_pt', header: 'Telepon' },
      ]}
      fields={[
        { name: 'NIK_pt', label: 'NIK (16 digit)', required: true, createOnly: true, placeholder: '3578…' },
        { name: 'Nama_pt', label: 'Nama Lengkap', required: true },
        { name: 'Jadwal_Shift_pt', label: 'Jadwal Shift', required: true, placeholder: 'Pagi / Siang / Sore' },
        { name: 'Tanggal_Lahir_pt', label: 'Tanggal Lahir', type: 'date', required: true },
        { name: 'No_Telp_pt', label: 'No. Telepon' },
        { name: 'Email_pt', label: 'Email' },
        { name: 'Alamat_pt', label: 'Alamat', type: 'textarea', colSpan: 2 },
      ]}
    />
  );
}
