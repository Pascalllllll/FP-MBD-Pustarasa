import ResourcePage from '../components/ResourcePage.jsx';

export default function Payments() {
  return (
    <ResourcePage
      title="Metode Pembayaran"
      singular="Metode Pembayaran"
      description="Opsi pembayaran yang tersedia di kasir kantin."
      service="manajemen"
      endpoint="/metode-pembayaran"
      idField="ID_mp"
      writeRoles={['admin']}
      deleteRoles={['admin']}
      empty="Belum ada metode pembayaran."
      columns={[
        { key: 'ID_mp', header: 'ID', className: 'font-mono text-xs' },
        { key: 'Instansi_mp', header: 'Instansi', render: (r) => <span className="font-medium">{r.Instansi_mp}</span> },
        { key: 'Jenis_mp', header: 'Jenis' },
      ]}
      fields={[
        { name: 'Instansi_mp', label: 'Instansi', required: true, placeholder: 'BCA / Dana / Tunai' },
        { name: 'Jenis_mp', label: 'Jenis', required: true, placeholder: 'Tunai / Transfer / QRIS' },
      ]}
    />
  );
}
